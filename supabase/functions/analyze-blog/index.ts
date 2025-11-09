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
    const { blogUrl } = await req.json();

    if (!blogUrl || typeof blogUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: "Blog URL is required" }),
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching blog content from:', blogUrl);

    // Fetch blog content
    const blogResponse = await fetch(blogUrl, {
      headers: {
        'User-Agent': 'SkillSense-App'
      }
    });

    if (!blogResponse.ok) {
      throw new Error(`Failed to fetch blog: ${blogResponse.status}`);
    }

    const htmlContent = await blogResponse.text();
    
    // Simple HTML to text extraction
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to ~8000 chars for AI analysis

    if (!textContent || textContent.length < 100) {
      throw new Error('Could not extract meaningful content from the blog');
    }

    console.log('📝 Extracted', textContent.length, 'characters from blog');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert content analyzer specializing in identifying skills and expertise from written content. Analyze blog posts and articles to extract:

1. **Writing & Communication Skills**: Technical writing, storytelling, clarity, audience engagement
2. **Domain Expertise**: Technical knowledge, industry insights, specialized topics
3. **Thought Leadership**: Innovation, strategic thinking, problem-solving approaches
4. **Soft Skills**: Analytical thinking, teaching ability, knowledge sharing

Use the analyze_blog function to return structured results.`;

    const userPrompt = `Analyze this blog content and extract skills, expertise, and thought leadership:

BLOG URL: ${blogUrl}

CONTENT:
${textContent}

Identify both technical expertise shown through the content AND communication/thought leadership skills demonstrated by the writing quality.`;

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
              name: "analyze_blog",
              description: "Extract skills and insights from blog content",
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
                        proficiencyLevel: { type: "string", enum: ["Expert", "Advanced", "Intermediate", "Beginner"] }
                      },
                      required: ["name", "category", "confidence", "proficiencyLevel"]
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
        tool_choice: { type: "function", function: { name: "analyze_blog" } }
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
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_blog") {
      console.error('Unexpected AI response format:', JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return expected tool call");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store data source
    const { error: dataSourceError } = await supabase
      .from('data_sources')
      .insert({
        user_id: user.id,
        source_type: 'blog',
        source_name: new URL(blogUrl).hostname,
        source_url: blogUrl,
        raw_content: textContent,
        metadata: {
          contentLength: textContent.length,
          analyzedAt: new Date().toISOString()
        },
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ Blog analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          url: blogUrl,
          contentLength: textContent.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-blog function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze blog content. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
