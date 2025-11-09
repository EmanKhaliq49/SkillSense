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
    const { githubUsername } = await req.json();

    if (!githubUsername || typeof githubUsername !== 'string') {
      return new Response(
        JSON.stringify({ error: "GitHub username is required" }),
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
    const RATE_LIMIT = 5; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'analyze-github';
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

    // Validate username format (GitHub usernames are alphanumeric with hyphens, max 39 chars)
    const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    if (!usernamePattern.test(githubUsername)) {
      console.error('❌ Invalid GitHub username format:', githubUsername);
      return new Response(
        JSON.stringify({ 
          error: "Invalid GitHub username format",
          details: "GitHub usernames can only contain alphanumeric characters and hyphens, and cannot begin or end with a hyphen."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching GitHub profile:', githubUsername);

    // Prepare GitHub API headers with optional token to avoid rate limits
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")?.trim();
    const ghHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SkillSense-App',
    };
    if (GITHUB_TOKEN) {
      ghHeaders['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    // Fetch user profile
    const profileResponse = await fetch(`https://api.github.com/users/${githubUsername}`, {
      headers: ghHeaders
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        console.error('❌ GitHub user not found:', githubUsername);
        return new Response(
          JSON.stringify({ 
            error: "GitHub user not found",
            details: `No GitHub user found with username "${githubUsername}". Please check the username and try again.`
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await profileResponse.text();
      console.error('❌ GitHub API error:', profileResponse.status, errorText);
      if (profileResponse.status === 403 && /rate limit/i.test(errorText)) {
        return new Response(
          JSON.stringify({ 
            error: "GitHub rate limit exceeded",
            details: "Authenticated requests have higher limits. Configure a GitHub token to continue."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ 
          error: `GitHub API error: ${profileResponse.status}`,
          details: "Failed to analyze GitHub profile. Please try again."
        }),
        { status: profileResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = await profileResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=30`,
      {
        headers: ghHeaders
      }
    );

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error('❌ GitHub repos error:', reposResponse.status, errorText);
      if (reposResponse.status === 403 && /rate limit/i.test(errorText)) {
        return new Response(
          JSON.stringify({ 
            error: "GitHub rate limit exceeded",
            details: "Authenticated requests have higher limits. Configure a GitHub token to continue."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ 
          error: `GitHub API error: ${reposResponse.status}`,
          details: "Failed to fetch repositories."
        }),
        { status: reposResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const repos = await reposResponse.json();

    console.log('📚 Found', repos.length, 'repositories');

    // Extract languages and topics from repositories
    const languages = new Set<string>();
    const topics = new Set<string>();
    let totalStars = 0;
    let totalForks = 0;

    for (const repo of repos) {
      if (repo.language) languages.add(repo.language);
      if (repo.topics) repo.topics.forEach((topic: string) => topics.add(topic));
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
    }

    // Build profile text for AI analysis
    const githubProfileText = `
GitHub Profile Analysis for ${profile.name || githubUsername}
Bio: ${profile.bio || 'No bio available'}
Location: ${profile.location || 'Not specified'}
Company: ${profile.company || 'Not specified'}

Profile Stats:
- Public Repositories: ${profile.public_repos}
- Followers: ${profile.followers}
- Following: ${profile.following}
- Total Stars Received: ${totalStars}
- Total Forks: ${totalForks}

Programming Languages Used: ${Array.from(languages).join(', ')}
Repository Topics: ${Array.from(topics).join(', ')}

Top Repositories:
${repos.slice(0, 10).map((repo: any) => 
  `- ${repo.name}: ${repo.description || 'No description'} (${repo.language || 'N/A'}) - ⭐${repo.stargazers_count}`
).join('\n')}
    `.trim();

    console.log('🤖 Analyzing GitHub profile with AI...');

    // Use Lovable AI for skill extraction
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert developer skill analyzer. Analyze GitHub profiles to extract technical skills, proficiency levels, and provide career insights.

Identify:
1. Programming languages and frameworks
2. Development tools and platforms
3. Software engineering practices
4. Domains of expertise
5. Collaboration and contribution patterns

Use the analyze_github function to return structured results.`;

    const userPrompt = `Analyze this GitHub profile and extract all technical skills:

${githubProfileText}

Focus on programming languages, frameworks, tools, and practices evident from the repositories and profile.`;

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
              name: "analyze_github",
              description: "Extract skills and insights from GitHub profile",
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
        tool_choice: { type: "function", function: { name: "analyze_github" } }
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

    if (!toolCall || toolCall.function.name !== "analyze_github") {
      console.error('Unexpected AI response format:', JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return expected tool call");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store data source
    const { error: dataSourceError } = await supabase
      .from('data_sources')
      .insert({
        user_id: user.id,
        source_type: 'github',
        source_name: githubUsername,
        source_url: profile.html_url,
        raw_content: githubProfileText,
        metadata: {
          profile,
          languages: Array.from(languages),
          topics: Array.from(topics),
          totalStars,
          totalForks,
          repoCount: repos.length
        },
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ GitHub analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);
    console.log('  - Languages:', Array.from(languages).join(', '));

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          username: githubUsername,
          profileUrl: profile.html_url,
          languages: Array.from(languages),
          topics: Array.from(topics),
          stats: {
            repos: profile.public_repos,
            stars: totalStars,
            forks: totalForks
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-github function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze GitHub profile. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
