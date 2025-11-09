import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Globe, FileText, Loader2, CheckCircle2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export default function DataSources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Blog state
  const [blogUrl, setBlogUrl] = useState("");
  const [isAnalyzingBlog, setIsAnalyzingBlog] = useState(false);
  const [blogResult, setBlogResult] = useState<any>(null);

  // Performance review state
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isAnalyzingReview, setIsAnalyzingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  const handleBlogAnalysis = async () => {
    if (!blogUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a blog or article URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(blogUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com/article)",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingBlog(true);
    setBlogResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-blog', {
        body: { blogUrl: blogUrl.trim() }
      });

      if (error) throw error;
      if (!data || !data.skills) throw new Error('Invalid response from blog analysis');

      setBlogResult(data);

      toast({
        title: "✅ Blog Analysis Complete!",
        description: `Found ${data.skills.length} skills from your content`,
      });

      setTimeout(() => {
        navigate("/dashboard", { state: { analysisResult: data, source: 'blog' } });
      }, 2000);

    } catch (error: any) {
      console.error('Blog analysis error:', error);
      toast({
        title: "❌ Analysis Failed",
        description: error.message || "Failed to analyze blog content",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingBlog(false);
    }
  };

  const handleReviewAnalysis = async () => {
    if (!reviewText.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter performance review content",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.length < 50) {
      toast({
        title: "Content Too Short",
        description: "Please enter at least 50 characters of review content",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingReview(true);
    setReviewResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-performance-review', {
        body: {
          reviewText: reviewText.trim(),
          reviewTitle: reviewTitle.trim() || 'Performance Review',
          reviewDate: reviewDate || new Date().toISOString().split('T')[0]
        }
      });

      if (error) throw error;
      if (!data || !data.skills) throw new Error('Invalid response from review analysis');

      setReviewResult(data);

      toast({
        title: "✅ Review Analysis Complete!",
        description: `Identified ${data.skills.length} skills and ${data.insights?.length || 0} insights`,
      });

      setTimeout(() => {
        navigate("/dashboard", { state: { analysisResult: data, source: 'performance_review' } });
      }, 2000);

    } catch (error: any) {
      console.error('Review analysis error:', error);
      toast({
        title: "❌ Analysis Failed",
        description: error.message || "Failed to analyze performance review",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingReview(false);
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
            <Button variant="outline" onClick={() => navigate("/connect")}>
              Connect Profiles
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

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Add More Data Sources
          </h1>
          <p className="text-muted-foreground text-lg">
            Enrich your skill profile with blogs and performance reviews
          </p>
        </motion.div>

        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="blog">
              <Globe className="h-4 w-4 mr-2" />
              Blog/Article Analysis
            </TabsTrigger>
            <TabsTrigger value="review">
              <FileText className="h-4 w-4 mr-2" />
              Performance Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    Blog & Article Analysis
                  </CardTitle>
                  <CardDescription>
                    Extract writing skills and domain expertise from your published content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="blog-url">Blog or Article URL</Label>
                    <Input
                      id="blog-url"
                      type="url"
                      placeholder="https://yourblog.com/article"
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      disabled={isAnalyzingBlog}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full URL of your blog post or article
                    </p>
                  </div>

                  <Button 
                    onClick={handleBlogAnalysis}
                    disabled={isAnalyzingBlog || !blogUrl.trim()}
                    className="w-full"
                  >
                    {isAnalyzingBlog ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Content...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Analyze Blog Content
                      </>
                    )}
                  </Button>

                  {blogResult && (
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
                        Found {blogResult.skills?.length || 0} skills from your content
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Redirecting to dashboard...
                      </p>
                    </motion.div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                    <p className="font-semibold mb-2">What we analyze:</p>
                    <p>✓ Technical expertise shown in the content</p>
                    <p>✓ Writing and communication skills</p>
                    <p>✓ Thought leadership and innovation</p>
                    <p>✓ Domain knowledge and specialization</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="review">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Performance Review Analysis
                  </CardTitle>
                  <CardDescription>
                    Extract skills and insights from performance feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="review-title">Review Title (Optional)</Label>
                      <Input
                        id="review-title"
                        placeholder="e.g., Q4 2024 Performance Review"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        disabled={isAnalyzingReview}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-date">Review Date (Optional)</Label>
                      <Input
                        id="review-date"
                        type="date"
                        value={reviewDate}
                        onChange={(e) => setReviewDate(e.target.value)}
                        disabled={isAnalyzingReview}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-text">Performance Review Content *</Label>
                      <Textarea
                        id="review-text"
                        placeholder="Paste your performance review feedback here..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        disabled={isAnalyzingReview}
                        rows={12}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {reviewText.length} characters • Minimum 50 characters required
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleReviewAnalysis}
                    disabled={isAnalyzingReview || reviewText.length < 50}
                    className="w-full"
                  >
                    {isAnalyzingReview ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Review...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Analyze Performance Review
                      </>
                    )}
                  </Button>

                  {reviewResult && (
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
                        Identified {reviewResult.skills?.length || 0} skills and {reviewResult.insights?.length || 0} insights
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Redirecting to dashboard...
                      </p>
                    </motion.div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                    <p className="font-semibold mb-2">What we extract:</p>
                    <p>✓ Praised strengths and competencies</p>
                    <p>✓ Leadership and collaboration skills</p>
                    <p>✓ Areas for improvement and growth</p>
                    <p>✓ Soft skills like communication and initiative</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Why Add More Data Sources?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Comprehensive Skill Profile:</strong> The more data sources you connect, the more accurate and complete your skill profile becomes.
              </p>
              <p>
                <strong>Hidden Skills Discovery:</strong> Different sources reveal different types of skills - blogs show thought leadership, reviews show soft skills.
              </p>
              <p>
                <strong>Career Progress Tracking:</strong> By analyzing performance reviews over time, track your skill evolution and career growth.
              </p>
              <p>
                <strong>Better Recommendations:</strong> More data means more personalized learning paths and career insights tailored to you.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
