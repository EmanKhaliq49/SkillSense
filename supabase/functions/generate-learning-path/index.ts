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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const RATE_LIMIT = 5; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'generate-learning-path';
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

    const { goalId } = await req.json();

    console.log('🎯 Generating learning path for user:', user.id, 'goal:', goalId);

    // Fetch user's current skills (using direct user_id filter to avoid RLS recursion)
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        id,
        skill_id,
        user_id,
        proficiency_level,
        confidence_score,
        skill_framework:skill_id (
          name,
          category,
          description
        )
      `)
      .eq('user_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      console.error('Error details:', JSON.stringify(skillsError));
      throw new Error('Failed to fetch user skills');
    }

    console.log('📊 Fetched user skills:', userSkills?.length || 0);

    // Fetch career goal if goalId is provided
    let goalData = null;
    if (goalId) {
      const { data, error: goalError } = await supabase
        .from('career_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();

      if (goalError) {
        console.error('Error fetching goal:', goalError);
      } else {
        goalData = data;
      }
    }

    // If no specific goal, fetch all active goals
    if (!goalData) {
      const { data: goals } = await supabase
        .from('career_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      goalData = goals && goals.length > 0 ? goals[0] : null;
    }

    console.log('🤖 Generating personalized learning path with AI...');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI
    const currentSkillsText = userSkills && userSkills.length > 0
      ? userSkills.map(us => {
          const skillName = us.skill_framework && typeof us.skill_framework === 'object' && !Array.isArray(us.skill_framework) 
            ? (us.skill_framework as any).name 
            : 'Unknown';
          return `- ${skillName} (${us.proficiency_level || 'Unknown level'}, Confidence: ${us.confidence_score || 0}%)`;
        }).join('\n')
      : 'No skills recorded yet';

    const goalText = goalData 
      ? `Goal: ${goalData.title}\nDescription: ${goalData.description || 'Not provided'}\nTarget Skills: ${goalData.target_skills?.join(', ') || 'Not specified'}\nTimeline: ${goalData.timeline || 'Not specified'}`
      : 'No specific career goal set yet';

    const systemPrompt = `You are an expert career development coach and learning path architect. Your role is to create personalized, actionable learning roadmaps that bridge the gap between current skills and career goals.

Create a comprehensive learning path that includes:
1. Identify skill gaps between current skills and target goals
2. Prioritize skills by importance and learning difficulty
3. Recommend specific learning resources (courses, books, projects)
4. Create milestone-based progression with realistic timelines
5. Suggest hands-on projects to build portfolio

Return ONLY a valid JSON object with this structure:
{
  "pathTitle": "Personalized learning path title",
  "estimatedDuration": "6 months",
  "skillGaps": [
    {
      "skill": "skill name",
      "category": "Technical|Soft|Domain",
      "priority": "Critical|High|Medium|Low",
      "currentLevel": "None|Beginner|Intermediate|Advanced",
      "targetLevel": "Intermediate|Advanced|Expert",
      "reasoning": "why this skill is important"
    }
  ],
  "learningPhases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "2 months",
      "focus": "what to focus on",
      "milestones": [
        {
          "title": "milestone title",
          "description": "what to achieve",
          "estimatedTime": "2 weeks",
          "resources": [
            {
              "title": "resource title",
              "type": "Course|Book|Tutorial|Project|Article",
              "provider": "Coursera|Udemy|YouTube|Official Docs|etc",
              "url": "example.com/resource",
              "difficulty": "Beginner|Intermediate|Advanced",
              "estimatedHours": 20,
              "description": "brief description"
            }
          ],
          "practiceProjects": [
            {
              "title": "project title",
              "description": "what to build",
              "skills": ["skill1", "skill2"],
              "complexity": "Simple|Medium|Complex"
            }
          ]
        }
      ]
    }
  ],
  "careerInsights": [
    {
      "type": "strength|opportunity|recommendation",
      "title": "insight title",
      "description": "detailed insight"
    }
  ],
  "nextSteps": [
    "immediate action 1",
    "immediate action 2"
  ]
}`;

    const userPrompt = `Create a personalized learning path for this professional:

CURRENT SKILLS:
${currentSkillsText}

CAREER GOAL:
${goalText}

Provide a comprehensive, actionable learning roadmap with specific resources, realistic timelines, and hands-on projects. Focus on practical skill development and career advancement.`;

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
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let learningPath;
    try {
      let jsonStr = content.trim();
      
      const markdownMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        jsonStr = markdownMatch[1];
      } else {
        const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
      }
      
      learningPath = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response. Error:", parseError);
      console.error("Content preview:", content.substring(0, 500));
      throw new Error("Failed to parse AI learning path result");
    }

    console.log('✅ Learning path generated');
    console.log('  - Phases:', learningPath.learningPhases?.length || 0);
    console.log('  - Skill gaps:', learningPath.skillGaps?.length || 0);

    // Save learning path to database
    const { data: savedPath, error: saveError } = await supabase
      .from('learning_paths')
      .insert({
        user_id: user.id,
        goal_id: goalId || null,
        path_title: learningPath.pathTitle || 'Personalized Learning Path',
        estimated_duration: learningPath.estimatedDuration,
        path_data: learningPath,
        version: 1,
        is_active: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving learning path:', saveError);
      // Don't fail the request if saving fails, just log it
    } else {
      console.log('✅ Learning path saved to database with ID:', savedPath.id);
    }

    return new Response(
      JSON.stringify({
        ...learningPath,
        generatedAt: new Date().toISOString(),
        goalId: goalId || null,
        savedPathId: savedPath?.id || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in generate-learning-path function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to generate learning path. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});