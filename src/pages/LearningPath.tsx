import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Loader2,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  History,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Resource {
  title: string;
  type: string;
  provider: string;
  url: string;
  difficulty: string;
  estimatedHours: number;
  description: string;
}

interface Project {
  title: string;
  description: string;
  skills: string[];
  complexity: string;
}

interface Milestone {
  title: string;
  description: string;
  estimatedTime: string;
  resources: Resource[];
  practiceProjects: Project[];
}

interface Phase {
  phase: number;
  title: string;
  duration: string;
  focus: string;
  milestones: Milestone[];
}

interface SkillGap {
  skill: string;
  category: string;
  priority: string;
  currentLevel: string;
  targetLevel: string;
  reasoning: string;
}

interface LearningPathData {
  pathTitle: string;
  estimatedDuration: string;
  skillGaps: SkillGap[];
  learningPhases: Phase[];
  careerInsights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  nextSteps: string[];
  generatedAt: string;
  goalId: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
}

export default function LearningPath() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [savedPaths, setSavedPaths] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryPath, setSelectedHistoryPath] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
    fetchSavedPaths();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('career_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchSavedPaths = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPaths(data || []);

      // Load the most recent path if no path is currently loaded
      if (!learningPath && data && data.length > 0) {
        const latestPath = data[0];
        setLearningPath(latestPath.path_data as unknown as LearningPathData);
        setSelectedHistoryPath(latestPath.id);
      }
    } catch (error) {
      console.error('Error fetching saved paths:', error);
    }
  };

  const loadHistoryPath = (pathId: string) => {
    const path = savedPaths.find(p => p.id === pathId);
    if (path) {
      setLearningPath(path.path_data as unknown as LearningPathData);
      setSelectedHistoryPath(pathId);
      setShowHistory(false);
      toast({
        title: "Learning path loaded",
        description: `Loaded version from ${format(new Date(path.created_at), 'PPp')}`,
      });
    }
  };

  const generateLearningPath = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: { goalId: selectedGoalId }
      });

      if (error) throw error;

      setLearningPath(data);
      await fetchSavedPaths(); // Refresh saved paths list

      toast({
        title: "🎯 Learning Path Generated!",
        description: "Your personalized roadmap is ready and saved",
      });
    } catch (error: any) {
      console.error('Error generating learning path:', error);
      toast({
        title: "❌ Generation Failed",
        description: error.message || "Failed to generate learning path",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-muted';
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
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/goals")}>
              Goals
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
                <GraduationCap className="h-10 w-10 text-primary" />
                AI Learning Path Generator
              </h1>
              <p className="text-muted-foreground text-lg">
                Get a personalized roadmap based on your skills and career goals
              </p>
            </div>
            {savedPaths.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                History ({savedPaths.length})
              </Button>
            )}
          </div>
        </motion.div>

        {/* History Section */}
        {showHistory && savedPaths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Path History</CardTitle>
              <CardDescription>
                View and restore previous learning paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedPaths.map((path) => (
                  <Card
                    key={path.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      selectedHistoryPath === path.id ? 'border-primary' : ''
                    }`}
                    onClick={() => loadHistoryPath(path.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{path.path_title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created: {format(new Date(path.created_at), 'PPp')}
                          </p>
                          {path.estimated_duration && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {path.estimated_duration}
                            </p>
                          )}
                        </div>
                        {selectedHistoryPath === path.id && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Section */}
        {!learningPath && !showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Generate Your Learning Roadmap</CardTitle>
                <CardDescription>
                  Select a career goal to create a personalized learning path
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.length > 0 ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Select Career Goal (Optional)</label>
                    <div className="grid gap-2">
                      <Button
                        variant={selectedGoalId === null ? "default" : "outline"}
                        onClick={() => setSelectedGoalId(null)}
                        className="justify-start"
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Generate based on all skills and goals
                      </Button>
                      {goals.map((goal) => (
                        <Button
                          key={goal.id}
                          variant={selectedGoalId === goal.id ? "default" : "outline"}
                          onClick={() => setSelectedGoalId(goal.id)}
                          className="justify-start"
                        >
                          <Target className="mr-2 h-4 w-4" />
                          {goal.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-3">
                      No active career goals found. Create one first for a more targeted learning path.
                    </p>
                    <Button onClick={() => navigate('/goals')} variant="outline">
                      Create Career Goal
                    </Button>
                  </div>
                )}

                <Button
                  onClick={generateLearningPath}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Path...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Generate Learning Path
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Learning Path Display */}
        {learningPath && !showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{learningPath.pathTitle}</CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {learningPath.estimatedDuration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {learningPath.skillGaps.length} skill gaps identified
                      </span>
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setLearningPath(null);
                      setSelectedHistoryPath(null);
                    }} 
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Path
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
                <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {learningPath.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {learningPath.careerInsights.map((insight, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          {insight.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Skill Gaps Tab */}
              <TabsContent value="gaps" className="space-y-4">
                {learningPath.skillGaps.map((gap, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {gap.skill}
                            <Badge variant={getPriorityColor(gap.priority)}>
                              {gap.priority}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{gap.category}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Current: <strong>{gap.currentLevel}</strong>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Target: <strong>{gap.targetLevel}</strong>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{gap.reasoning}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Roadmap Tab */}
              <TabsContent value="roadmap" className="space-y-6">
                {learningPath.learningPhases.map((phase) => (
                  <Card key={phase.phase}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          Phase {phase.phase}
                        </Badge>
                        {phase.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {phase.duration}
                        </span>
                        <span>Focus: {phase.focus}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {phase.milestones.map((milestone, mIdx) => (
                        <div key={mIdx} className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{milestone.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                {milestone.description}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {milestone.estimatedTime}
                              </Badge>

                              {/* Resources */}
                              {milestone.resources.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h5 className="text-sm font-medium">📚 Learning Resources</h5>
                                  <div className="grid gap-2">
                                    {milestone.resources.map((resource, rIdx) => (
                                      <Card key={rIdx} className="p-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h6 className="font-medium text-sm">{resource.title}</h6>
                                              <Badge variant="outline" className="text-xs">
                                                {resource.type}
                                              </Badge>
                                              <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(resource.difficulty)} text-white`}>
                                                {resource.difficulty}
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {resource.description}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                              <span>{resource.provider}</span>
                                              <span>•</span>
                                              <span>{resource.estimatedHours}h</span>
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(resource.url, '_blank')}
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Practice Projects */}
                              {milestone.practiceProjects.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h5 className="text-sm font-medium">🛠️ Practice Projects</h5>
                                  <div className="grid gap-2">
                                    {milestone.practiceProjects.map((project, pIdx) => (
                                      <Card key={pIdx} className="p-3">
                                        <h6 className="font-medium text-sm mb-1">{project.title}</h6>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {project.description}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant="outline" className="text-xs">
                                            {project.complexity}
                                          </Badge>
                                          {project.skills.map((skill, sIdx) => (
                                            <Badge key={sIdx} variant="secondary" className="text-xs">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {mIdx < phase.milestones.length - 1 && (
                            <div className="ml-4 h-8 w-0.5 bg-border" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                {learningPath.careerInsights.map((insight, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {insight.title}
                      </CardTitle>
                      <Badge variant="outline">{insight.type}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{insight.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}