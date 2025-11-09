import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting analyze-job-match function...');
    const { jobDescription } = await req.json();

    // Input validation
    const MAX_JOB_DESC_LENGTH = 50000; // 50KB
    const MIN_TEXT_LENGTH = 50;

    if (!jobDescription || typeof jobDescription !== 'string') {
      console.log('❌ Invalid job description');
      return new Response(
        JSON.stringify({ error: "Job description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (jobDescription.length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too short",
          details: `Job description must be at least ${MIN_TEXT_LENGTH} characters`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (jobDescription.length > MAX_JOB_DESC_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too large",
          maxLength: MAX_JOB_DESC_LENGTH,
          details: `Job description exceeds maximum allowed size of ${MAX_JOB_DESC_LENGTH} characters (${Math.round(MAX_JOB_DESC_LENGTH/1024)}KB)`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processedJobDesc = jobDescription.slice(0, MAX_JOB_DESC_LENGTH);
    console.log('📝 Job description length:', processedJobDesc.length);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log('❌ Missing auth header');
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseService.auth.getUser();
    if (userError || !user) {
      console.log('❌ User auth failed:', userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting check
    const RATE_LIMIT = 20; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'analyze-job-match';
    const now = new Date();
    const windowStart = new Date(now.getTime() - (WINDOW_HOURS * 60 * 60 * 1000));

    const { data: rateLimitData } = await supabaseService
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitData && rateLimitData.request_count >= RATE_LIMIT) {
      const resetTime = new Date(new Date(rateLimitData.window_start).getTime() + (WINDOW_HOURS * 60 * 60 * 1000));
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          details: `Maximum ${RATE_LIMIT} requests per hour. Please try again later.`,
          retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString()
          } 
        }
      );
    }

    // Update rate limit
    if (rateLimitData) {
      await supabaseService.from('rate_limits').update({ 
        request_count: rateLimitData.request_count + 1,
        updated_at: now.toISOString()
      }).eq('user_id', user.id).eq('endpoint', endpoint).eq('window_start', rateLimitData.window_start);
    } else {
      await supabaseService.from('rate_limits').insert({
        user_id: user.id,
        endpoint,
        request_count: 1,
        window_start: now.toISOString()
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    console.log('🔍 Fetching user skills from database...');

    // Fetch user's skills from database with skill names
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        *,
        skill_framework (
          name,
          category
        )
      `)
      .eq('user_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      throw new Error('Failed to fetch user skills');
    }

    if (!userSkills || userSkills.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No skills found",
          details: "Please upload your CV or connect data sources first to analyze job matches."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('📊 Found', userSkills.length, 'user skills');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare user skills summary for AI
    const userSkillsSummary = userSkills.map(skill => {
      const skillName = skill.skill_framework?.name || 'Unknown';
      const category = skill.skill_framework?.category || 'Unknown';
      return `${skillName} (${category}, ${skill.proficiency_level || 'N/A'})`;
    }).join('\n');

    const systemPrompt = `You are an expert career counselor and job matching specialist. Provide accurate, evidence-based job match scoring.

MATCH SCORE CALCULATION (0-100):
Calculate based on actual skill overlap and requirements:

1. REQUIRED SKILLS COVERAGE (50 points):
   - Calculate: (Candidate's matching required skills / Total required skills) × 50
   - Must-have technical skills: 25 points
   - Must-have soft skills and qualifications: 25 points

2. PREFERRED SKILLS COVERAGE (25 points):
   - Calculate: (Candidate's matching preferred skills / Total preferred skills) × 25
   - Nice-to-have skills boost the score

3. EXPERIENCE LEVEL MATCH (15 points):
   - Years of experience matches requirement: 15 points
   - Close match (±1 year): 10 points
   - Somewhat close (±2-3 years): 5 points
   - Significant gap: 0 points

4. PROFICIENCY MATCH (10 points):
   - Proficiency levels align with job needs: 10 points
   - Some proficiency gaps: 5 points
   - Significant proficiency gaps: 0 points

SCORING GUIDELINES:
- 90-100: Exceptional match - all critical requirements met, most preferred skills present
- 80-89: Excellent match - all critical requirements, some preferred skills
- 70-79: Strong match - most critical requirements, few gaps
- 60-69: Good match - key requirements met but notable gaps
- 50-59: Fair match - some requirements met, several gaps
- 40-49: Weak match - missing several critical requirements
- 0-39: Poor match - most requirements not met

CRITICAL: 
- Count actual skills, don't estimate
- Be realistic about gaps
- Perfect matches (95-100) are rare
- Calculate mathematically, don't guess`;

    const userPrompt = `Analyze this job match and calculate a PRECISE match score using the rubric.

JOB DESCRIPTION:
${processedJobDesc}

CANDIDATE SKILLS:
${userSkillsSummary}

Calculate match score step-by-step:

STEP 1: Extract ALL required skills from job description
STEP 2: Extract ALL preferred/nice-to-have skills
STEP 3: Count how many candidate skills match required skills
STEP 4: Count how many candidate skills match preferred skills
STEP 5: Check experience level requirements vs candidate experience
STEP 6: Calculate score using formula:
   - Required skills coverage: (matches / total required) × 50
   - Preferred skills coverage: (matches / total preferred) × 25
   - Experience match: 0-15 points
   - Proficiency alignment: 0-10 points
   - TOTAL = sum of above (max 100)

Return:
1. matchScore: Calculated score (0-100) using above formula
2. matchingSkills: Array of candidate skills that match job requirements
3. missingSkills: Array of required/preferred skills candidate lacks
4. recommendations: Specific, actionable advice for candidate
5. jobRequirements: Breakdown of technical, soft skills, experience needed
6. calculationBreakdown: Show your math (required: X/Y = Z points, etc.)

CRITICAL: Show your work. The score must be mathematically accurate based on skill overlap.`;

    console.log('🤖 Analyzing job match with AI...');

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_job_match",
              description: "Return job match analysis with score and recommendations",
              parameters: {
                type: "object",
                properties: {
                  matchScore: {
                    type: "number",
                    description: "Match score from 0-100 based on skill overlap"
                  },
                  matchingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills the candidate has that match the job requirements"
                  },
                  missingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills required for the job that the candidate needs to develop"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Actionable recommendations for the candidate (3-5 items)"
                  },
                  jobRequirements: {
                    type: "object",
                    properties: {
                      technical: {
                        type: "array",
                        items: { type: "string" },
                        description: "Technical skills required"
                      },
                      soft: {
                        type: "array",
                        items: { type: "string" },
                        description: "Soft skills required"
                      },
                      experience: {
                        type: "string",
                        description: "Experience level required"
                      }
                    }
                  },
                  calculationBreakdown: {
                    type: "object",
                    properties: {
                      requiredSkillsScore: {
                        type: "number",
                        description: "Points from required skills (0-50)"
                      },
                      preferredSkillsScore: {
                        type: "number", 
                        description: "Points from preferred skills (0-25)"
                      },
                      experienceScore: {
                        type: "number",
                        description: "Points from experience match (0-15)"
                      },
                      proficiencyScore: {
                        type: "number",
                        description: "Points from proficiency alignment (0-10)"
                      },
                      explanation: {
                        type: "string",
                        description: "Text explanation of score calculation"
                      }
                    }
                  }
                },
                required: ["matchScore", "matchingSkills", "missingSkills", "recommendations", "calculationBreakdown"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_job_match" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_job_match") {
      console.error('Unexpected AI response format:', JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return expected tool call");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Normalize matchScore to ensure it's in 0-100 range
    if (analysis.matchScore < 1) {
      analysis.matchScore = Math.round(analysis.matchScore * 100);
    } else if (analysis.matchScore > 100) {
      analysis.matchScore = 100;
    }
    analysis.matchScore = Math.round(analysis.matchScore);

    console.log('✅ Job match analysis completed');
    console.log('  - Match score:', analysis.matchScore);
    console.log('  - Matching skills:', analysis.matchingSkills?.length || 0);
    console.log('  - Missing skills:', analysis.missingSkills?.length || 0);

    // Store job match result in database (in analysis field as jsonb)
    const { error: matchError } = await supabase
      .from('job_matches')
      .insert({
        user_id: user.id,
        job_id: null, // No specific job posting for manual analysis
        match_score: analysis.matchScore,
        matching_skills: analysis.matchingSkills,
        missing_skills: analysis.missingSkills,
        analysis: {
          jobDescription: processedJobDesc.slice(0, 2000),
          recommendations: analysis.recommendations,
          jobRequirements: analysis.jobRequirements,
          analyzedAt: new Date().toISOString()
        }
      });

    if (matchError) {
      console.error('Error storing job match:', matchError);
      // Continue anyway, don't fail the request
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-job-match function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze job match. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
