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
    const { reviewText, reviewTitle, reviewDate } = await req.json();

    // Input validation
    const MAX_REVIEW_LENGTH = 75000; // 75KB
    const MIN_TEXT_LENGTH = 50;

    if (!reviewText || typeof reviewText !== 'string') {
      return new Response(
        JSON.stringify({ error: "Performance review text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewText.length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too short",
          details: `Performance review must be at least ${MIN_TEXT_LENGTH} characters`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewText.length > MAX_REVIEW_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too large",
          maxLength: MAX_REVIEW_LENGTH,
          details: `Performance review exceeds maximum allowed size of ${MAX_REVIEW_LENGTH} characters (${Math.round(MAX_REVIEW_LENGTH/1024)}KB)`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const RATE_LIMIT = 10; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'analyze-performance-review';
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

    const processedText = reviewText.slice(0, MAX_REVIEW_LENGTH);

    console.log('📊 Analyzing performance review...');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert HR analyst and performance evaluator. Provide accurate, evidence-based scoring.

OVERALL PERFORMANCE SCORE CALCULATION (0-100):
Base your score strictly on evidence in the review:

1. ACHIEVEMENT QUALITY (30 points):
   - Quantifiable results and metrics: 10 points
   - Specific accomplishments with impact: 10 points
   - Innovation or problem-solving examples: 10 points

2. SKILL DEMONSTRATION (30 points):
   - Technical skills clearly shown: 10 points
   - Leadership and collaboration examples: 10 points
   - Communication and soft skills evidenced: 10 points

3. GROWTH & DEVELOPMENT (20 points):
   - Learning and skill development: 10 points
   - Taking on new responsibilities: 10 points

4. CONSISTENCY & RELIABILITY (20 points):
   - Consistently meeting expectations: 10 points
   - Positive feedback and recognition: 10 points

SKILL CONFIDENCE SCORING (0-100):
Base scores on evidence strength:

90-100 (Outstanding):
- Multiple specific examples
- Measurable achievements demonstrating skill
- Recognized as strength by reviewer
- Mentioned in multiple contexts

75-89 (Strong):
- 2+ clear examples
- Positive feedback with context
- Demonstrated impact
- Part of core responsibilities

60-74 (Good):
- 1-2 examples with some detail
- Generally positive mention
- Applied in work context

40-59 (Adequate):
- Brief mention
- Meets expectations
- Limited detail

20-39 (Developing):
- Mentioned as area for growth
- Limited evidence
- Needs improvement noted

0-19 (Weak):
- Barely mentioned
- Negative feedback
- Insufficient evidence

PROFICIENCY LEVELS:
- Expert: Exceptional performance, mentoring others, strategic impact
- Advanced: Consistently exceeds expectations, independent complex work
- Intermediate: Meets expectations, growing capabilities
- Beginner: Developing skills, needs guidance

CRITICAL: Only score based on what's actually written in the review. No assumptions.`;

    const userPrompt = `Analyze this performance review using STRICT evidence-based scoring.

REVIEW TITLE: ${reviewTitle || 'Performance Review'}
REVIEW DATE: ${reviewDate || 'Not specified'}

REVIEW CONTENT:
${processedText}

For EACH skill:
1. Find direct evidence in the review text
2. Count mentions and context
3. Look for metrics or specific examples
4. Calculate confidence based on evidence strength
5. Assign proficiency based on performance level

For OVERALL SCORE:
1. Evaluate each category (achievement, skills, growth, consistency)
2. Award points only for evidence you see
3. Sum points for final score

Return:
1. Skills with evidence-based confidence scores (0-100)
2. Evidence quotes from the review
3. Proficiency levels based on demonstrated performance
4. Insights about strengths, gaps, recommendations
5. Overall performance score (0-100) based on the rubric

CRITICAL: Scores must match actual review content. Vague reviews = lower scores. Detailed positive feedback = higher scores.`;

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
              name: "analyze_performance_review",
              description: "Extract skills and insights from a performance review",
              parameters: {
                type: "object",
                properties: {
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string", enum: ["Technical", "Soft", "Domain", "Language"] },
                        confidence: { type: "number", minimum: 0, maximum: 100 },
                        isExplicit: { type: "boolean" },
                        evidence: { type: "array", items: { type: "string" } },
                        proficiencyLevel: { type: "string", enum: ["Beginner", "Intermediate", "Advanced", "Expert"] }
                      },
                      required: ["name", "category", "confidence", "isExplicit", "evidence", "proficiencyLevel"]
                    }
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string", enum: ["strength", "gap", "recommendation"] }
                      },
                      required: ["title", "description", "priority", "category"]
                    }
                  },
                  summary: { type: "string" },
                  overallScore: { type: "number", minimum: 0, maximum: 100 }
                },
                required: ["skills", "insights", "summary", "overallScore"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_performance_review" } }
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
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_performance_review") {
      console.error("No tool call in response:", JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return structured output");
    }

    let analysis;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", parseError);
      throw new Error("Failed to parse AI analysis result");
    }

    // Normalize scores to ensure they're in 0-100 range
    if (analysis.overallScore < 1) {
      analysis.overallScore = Math.round(analysis.overallScore * 100);
    } else if (analysis.overallScore > 100) {
      analysis.overallScore = 100;
    }
    analysis.overallScore = Math.round(analysis.overallScore);

    // Normalize skill confidence scores
    analysis.skills = analysis.skills.map((skill: any) => {
      let confidence = skill.confidence;
      if (confidence < 1) {
        confidence = Math.round(confidence * 100);
      } else if (confidence > 100) {
        confidence = 100;
      }
      return {
        ...skill,
        confidence: Math.round(confidence)
      };
    });

    // Store data source
    const { error: dataSourceError } = await supabase
      .from('data_sources')
      .insert({
        user_id: user.id,
        source_type: 'performance_review',
        source_name: reviewTitle || 'Performance Review',
        raw_content: processedText,
        metadata: {
          reviewDate: reviewDate || new Date().toISOString(),
          contentLength: processedText.length
        },
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ Performance review analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);
    console.log('  - Insights:', analysis.insights?.length || 0);

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          title: reviewTitle,
          date: reviewDate,
          contentLength: processedText.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-performance-review function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze performance review. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
