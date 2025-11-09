import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, Upload, TrendingUp, Target, BookOpen, Sparkles, Award, 
  Zap, FileText, ThumbsUp, Users, Calendar, CheckCircle2, TrendingDown,
  Activity, BarChart3
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [endorsementText, setEndorsementText] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.analysisResult) {
      setAnalysisData(location.state.analysisResult);
    }
  }, [location]);

  const handleEndorseSkill = async (skillId: string) => {
    if (!endorsementText.trim()) {
      toast({
        title: "Missing endorsement",
        description: "Please provide endorsement text",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to endorse skills");
      }

      const { error } = await supabase.from("skill_endorsements").insert({
        user_skill_id: skillId,
        endorsed_by: user.id,
        endorsement_text: endorsementText,
      });

      if (error) throw error;

      toast({
        title: "✅ Endorsement added!",
        description: "Your endorsement has been recorded",
      });

      setEndorsementText("");
      setSelectedSkillId(null);
    } catch (error: any) {
      toast({
        title: "❌ Failed to endorse",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-500';
      case 'Advanced': return 'bg-primary';
      case 'Intermediate': return 'bg-accent';
      case 'Beginner': return 'bg-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Zap className="h-4 w-4" />;
      case 'Soft': return <Sparkles className="h-4 w-4" />;
      case 'Domain': return <Target className="h-4 w-4" />;
      case 'Language': return <FileText className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-destructive text-destructive-foreground',
      medium: 'bg-accent text-accent-foreground',
      low: 'bg-secondary text-secondary-foreground'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getCategoryStats = () => {
    if (!analysisData?.skills) return [];
    
    const categories = ['Technical', 'Soft', 'Domain', 'Language'];
    return categories.map(cat => ({
      name: cat,
      count: analysisData.skills.filter((s: any) => s.category === cat).length,
      avgConfidence: Math.round(
        analysisData.skills
          .filter((s: any) => s.category === cat)
          .reduce((sum: number, s: any) => sum + s.confidence, 0) /
        (analysisData.skills.filter((s: any) => s.category === cat).length || 1)
      )
    }));
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
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/guide")}>
              User Guide
            </Button>
            <Button variant="outline" onClick={() => navigate("/upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Upload CV
            </Button>
            <Button variant="outline" onClick={() => navigate("/connect")}>
              Connect Profiles
            </Button>
            <Button variant="outline" onClick={() => navigate("/sources")}>
              Add Sources
            </Button>
            <Button variant="outline" onClick={() => navigate("/skill-comparison")}>
              Compare Skills
            </Button>
            <Button variant="outline" onClick={() => navigate("/goals")}>
              Goals
            </Button>
            <Button variant="outline" onClick={() => navigate("/learning-path")}>
              Learning Path
            </Button>
            <Button variant="outline" onClick={() => navigate("/jobs")}>
              Job Match
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Your Skill Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered analysis of your professional capabilities
          </p>
        </motion.div>

        {analysisData && analysisData.isValid ? (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <Card className="border-2 hover:shadow-glow transition-all hover:-translate-y-1 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overall Score
                    </CardTitle>
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {analysisData.overallScore}%
                  </div>
                  <Progress value={analysisData.overallScore} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysisData.overallScore >= 80 ? 'Excellent' : 
                     analysisData.overallScore >= 60 ? 'Good' : 
                     analysisData.overallScore >= 40 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-glow transition-all hover:-translate-y-1 bg-gradient-to-br from-success/10 to-success/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Skills Identified
                    </CardTitle>
                    <Brain className="h-5 w-5 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {analysisData.skills.length}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{analysisData.skills.filter((s: any) => s.isExplicit).length} explicit</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>{analysisData.skills.filter((s: any) => !s.isExplicit).length} implicit</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-glow transition-all hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Expert Skills
                    </CardTitle>
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {analysisData.skills.filter((s: any) => s.proficiencyLevel === 'Expert').length}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Advanced: {analysisData.skills.filter((s: any) => s.proficiencyLevel === 'Advanced').length}</div>
                    <div>Intermediate: {analysisData.skills.filter((s: any) => s.proficiencyLevel === 'Intermediate').length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-glow transition-all hover:-translate-y-1 bg-gradient-to-br from-accent/10 to-accent/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Career Insights
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {analysisData.insights.length}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {analysisData.insights.filter((i: any) => i.category === 'strength').length} strengths
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {analysisData.insights.filter((i: any) => i.category === 'recommendation').length} growth areas
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Skill Distribution by Category
                  </CardTitle>
                  <CardDescription>Overview of your skillset across different categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {getCategoryStats().map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <Badge variant="outline">{cat.count}</Badge>
                        </div>
                        <Progress value={cat.avgConfidence} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {cat.avgConfidence}% avg confidence
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="bg-gradient-primary text-white border-0 shadow-glow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-6 w-6 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI Analysis Summary</h3>
                      <p className="text-white/90 leading-relaxed">{analysisData.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs defaultValue="skills" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="skills" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Skills Profile
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Career Insights
                  </TabsTrigger>
                </TabsList>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-6">
                  {/* All Skills with Endorsements */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Skill Inventory</CardTitle>
                      <CardDescription>All identified skills with detailed analysis and endorsements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisData.skills.map((skill: any, idx: number) => (
                          <Card key={idx} className="border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-4">
                                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getProficiencyColor(skill.proficiencyLevel)}`} />
                                
                                <div className="flex-1 min-w-0 space-y-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className="font-semibold text-lg">{skill.name}</span>
                                      {getCategoryIcon(skill.category)}
                                      <Badge variant="outline" className="text-xs">
                                        {skill.category}
                                      </Badge>
                                      <Badge
                                        variant={skill.isExplicit ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {skill.proficiencyLevel}
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-2">
                                      <Progress value={skill.confidence} className="flex-1 h-2 max-w-xs" />
                                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        {skill.confidence}% confidence
                                      </span>
                                    </div>

                                    {skill.evidence && skill.evidence.length > 0 && (
                                      <div className="mt-2 p-3 bg-card rounded-md border">
                                        <p className="text-xs font-semibold mb-1 text-muted-foreground">Evidence:</p>
                                        {skill.evidence.slice(0, 2).map((ev: string, i: number) => (
                                          <p key={i} className="text-xs text-muted-foreground italic mb-1">
                                            "{ev.substring(0, 100)}..."
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setSelectedSkillId(skill.name)}
                                      >
                                        <ThumbsUp className="h-3 w-3 mr-2" />
                                        Endorse Skill
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Endorse {skill.name}</DialogTitle>
                                        <DialogDescription>
                                          Provide feedback or endorsement for this skill
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Write your endorsement..."
                                          value={endorsementText}
                                          onChange={(e) => setEndorsementText(e.target.value)}
                                          rows={4}
                                        />
                                        <Button
                                          onClick={() => handleEndorseSkill(selectedSkillId || '')}
                                          disabled={loading}
                                          className="w-full"
                                        >
                                          {loading ? 'Submitting...' : 'Submit Endorsement'}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <Card className="border-success/20 bg-success/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-success" />
                          Your Strengths
                        </CardTitle>
                        <CardDescription>
                          Key areas where you excel
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.insights
                          .filter((i: any) => i.category === 'strength')
                          .map((insight: any, idx: number) => (
                            <Card key={idx} className="border-success/30 bg-card">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <Badge className={`${getPriorityBadge(insight.priority)} shrink-0`}>
                                    {insight.priority}
                                  </Badge>
                                  <div>
                                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {insight.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Growth Opportunities */}
                    <Card className="border-accent/20 bg-accent/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-accent" />
                          Growth Opportunities
                        </CardTitle>
                        <CardDescription>
                          Areas for development
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.insights
                          .filter((i: any) => i.category === 'recommendation')
                          .map((insight: any, idx: number) => (
                            <Card key={idx} className="border-accent/30 bg-card">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <Badge className={`${getPriorityBadge(insight.priority)} shrink-0`}>
                                    {insight.priority}
                                  </Badge>
                                  <div>
                                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {insight.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Gaps */}
                    {analysisData.insights.filter((i: any) => i.category === 'gap').length > 0 && (
                      <Card className="border-destructive/20 bg-destructive/5 lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-destructive" />
                            Areas for Development
                          </CardTitle>
                          <CardDescription>
                            Skills that need more emphasis
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            {analysisData.insights
                              .filter((i: any) => i.category === 'gap')
                              .map((insight: any, idx: number) => (
                                <Card key={idx} className="border-destructive/30 bg-card">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                      <Badge className={`${getPriorityBadge(insight.priority)} shrink-0`}>
                                        {insight.priority}
                                      </Badge>
                                      <div>
                                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {insight.description}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Skill Comparison CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-glow transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Compare Skills Across Sources</h3>
                        <p className="text-muted-foreground">
                          View side-by-side analysis of skills identified from multiple sources (CV, GitHub, reviews).
                          See consolidated confidence scores and cross-validated evidence.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate("/skill-comparison")}
                      size="lg"
                      className="shrink-0"
                    >
                      View Comparison
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Card className="border-2 border-dashed max-w-2xl mx-auto">
              <CardContent className="pt-12 pb-12">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Analysis Data</h2>
                <p className="text-muted-foreground mb-6">
                  Upload a CV to start your AI-powered skill analysis
                </p>
                <Button onClick={() => navigate("/upload")} size="lg" className="bg-primary hover:bg-primary/90">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Your CV
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
