import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Github, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export default function ConnectSources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [githubUsername, setGithubUsername] = useState("");
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [githubResult, setGithubResult] = useState<any>(null);

  const extractGithubUsername = (input: string): string | null => {
    const trimmed = input.trim();
    
    // If it's a URL, extract username
    const urlPatterns = [
      /github\.com\/([^\/\?#]+)/i,  // Matches github.com/username or github.com/username/repo
      /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/  // Valid GitHub username pattern
    ];
    
    // Try URL pattern first
    const urlMatch = trimmed.match(urlPatterns[0]);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    
    // Check if it's a valid username format
    const usernameMatch = trimmed.match(urlPatterns[1]);
    if (usernameMatch) {
      return trimmed;
    }
    
    return null;
  };

  const handleGithubAnalysis = async () => {
    if (!githubUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a GitHub username or profile URL",
        variant: "destructive",
      });
      return;
    }

    const extractedUsername = extractGithubUsername(githubUsername);
    
    if (!extractedUsername) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid GitHub username (e.g., 'octocat') or URL (e.g., 'github.com/octocat')",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingGithub(true);
    setGithubResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-github', {
        body: { githubUsername: extractedUsername }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.skills) {
        throw new Error('Invalid response from GitHub analysis');
      }

      setGithubResult(data);

      toast({
        title: "✅ GitHub Analysis Complete!",
        description: `Found ${data.skills.length} skills from your GitHub profile`,
      });

      // Navigate to dashboard with results after a short delay
      setTimeout(() => {
        navigate("/dashboard", { state: { analysisResult: data, source: 'github' } });
      }, 2000);

    } catch (error: any) {
      console.error('GitHub analysis error:', error);
      
      // Try to parse error details from the response
      let errorMessage = "Failed to analyze GitHub profile";
      let errorTitle = "❌ Analysis Failed";
      
      if (error.message?.includes("404")) {
        errorTitle = "❌ User Not Found";
        errorMessage = `GitHub user "${extractedUsername}" not found. Please check the username and try again.`;
      } else if (error.context?.error) {
        errorMessage = error.context.error;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingGithub(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/upload")}>
              Upload CV
            </Button>
            <Button variant="outline" onClick={() => navigate("/sources")}>
              Add Sources
            </Button>
            <Button variant="outline" onClick={() => navigate("/goals")}>
              Goals
            </Button>
            <Button variant="outline" onClick={() => navigate("/learning-path")}>
              Learning Path
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Connect Your GitHub Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            Import skills from your GitHub repositories and contributions
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* GitHub Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-6 w-6 text-foreground" />
                  GitHub Analysis
                </CardTitle>
                <CardDescription>
                  Extract skills from your repositories and contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-username">GitHub Username or URL</Label>
                  <Input
                    id="github-username"
                    placeholder="octocat or github.com/octocat"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    disabled={isAnalyzingGithub}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your GitHub username or paste your profile URL
                  </p>
                </div>

                <Button 
                  onClick={handleGithubAnalysis}
                  disabled={isAnalyzingGithub || !githubUsername.trim()}
                  className="w-full"
                >
                  {isAnalyzingGithub ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Github className="mr-2 h-4 w-4" />
                      Analyze GitHub Profile
                    </>
                  )}
                </Button>

                {githubResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-success/10 border border-success rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-success mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Analysis Complete!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Found {githubResult.skills?.length || 0} skills
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Redirecting to dashboard...
                    </p>
                  </motion.div>
                )}

                <div className="text-xs text-muted-foreground mt-4">
                  <p>✓ Analyzes programming languages</p>
                  <p>✓ Extracts frameworks & tools</p>
                  <p>✓ Evaluates contribution patterns</p>
                  <p>✓ Identifies expertise areas</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>GitHub Analysis Benefits</CardTitle>
              <CardDescription>
                Comprehensive skill extraction from your code contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                📄 <strong>CV Analysis:</strong> Upload your resume for detailed skill extraction and career insights
              </p>
              <p>
                💻 <strong>GitHub:</strong> Analyzes your code repositories, programming languages, frameworks, and open-source contributions
              </p>
              <p>
                📝 <strong>Blogs & Articles:</strong> Extract technical skills from your published content
              </p>
              <p>
                📊 <strong>Performance Reviews:</strong> Import professional assessments for comprehensive skill tracking
              </p>
              <p className="pt-3 text-xs">
                All data is processed securely with AI and stored in your private profile. You control what information is shared.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
