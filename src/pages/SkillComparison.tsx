import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Upload, FileText, Github, TrendingUp, Activity,
  GitBranch, Award, Zap, AlertCircle, CheckCircle2, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SkillSource {
  source_type: string;
  source_name: string;
  confidence: number;
  proficiency: string;
  evidence: string[];
  analyzed_at: string;
}

interface ComparisonSkill {
  skill_id: string;
  skill_name: string;
  category: string;
  sources: SkillSource[];
  avg_confidence: number;
  highest_proficiency: string;
  total_evidence: number;
  consistency_score: number;
}

const SkillComparison = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skills, setSkills] = useState<ComparisonSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view skill comparisons",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Fetch user skills with framework data
      const { data: userSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          id,
          skill_id,
          confidence_score,
          proficiency_level,
          evidence,
          created_at,
          skill_framework (
            id,
            name,
            category
          )
        `)
        .eq('user_id', user.id);

      if (skillsError) throw skillsError;

      // Fetch skill history with data source info
      const { data: skillHistory, error: historyError } = await supabase
        .from('skill_history')
        .select(`
          skill_id,
          confidence_score,
          proficiency_level,
          data_source_id,
          recorded_at,
          data_sources (
            source_type,
            source_name,
            processed_at
          )
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (historyError) throw historyError;

      // Group skills by skill_id and aggregate sources
      const skillMap = new Map<string, ComparisonSkill>();

      // Process current user_skills
      userSkills?.forEach((skill: any) => {
        if (!skill.skill_framework) return;

        const skillId = skill.skill_id;
        const existing = skillMap.get(skillId);

        const currentSource: SkillSource = {
          source_type: 'current',
          source_name: 'Current Profile',
          confidence: skill.confidence_score || 0,
          proficiency: skill.proficiency_level || 'Intermediate',
          evidence: skill.evidence || [],
          analyzed_at: skill.created_at
        };

        if (existing) {
          existing.sources.push(currentSource);
        } else {
          skillMap.set(skillId, {
            skill_id: skillId,
            skill_name: skill.skill_framework.name,
            category: skill.skill_framework.category,
            sources: [currentSource],
            avg_confidence: 0,
            highest_proficiency: skill.proficiency_level || 'Intermediate',
            total_evidence: (skill.evidence || []).length,
            consistency_score: 100
          });
        }
      });

      // Process skill history
      skillHistory?.forEach((history: any) => {
        if (!history.data_sources) return;

        const skillId = history.skill_id;
        const existing = skillMap.get(skillId);

        const historySource: SkillSource = {
          source_type: history.data_sources.source_type,
          source_name: history.data_sources.source_name,
          confidence: history.confidence_score || 0,
          proficiency: history.proficiency_level || 'Intermediate',
          evidence: [],
          analyzed_at: history.recorded_at
        };

        if (existing) {
          // Check if we already have this source
          const sourceExists = existing.sources.some(
            s => s.source_type === historySource.source_type && 
                 s.source_name === historySource.source_name
          );
          if (!sourceExists) {
            existing.sources.push(historySource);
          }
        }
      });

      // Calculate aggregated metrics
      const comparisonSkills = Array.from(skillMap.values()).map(skill => {
        const confidences = skill.sources.map(s => s.confidence);
        const avgConfidence = confidences.length > 0 
          ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
          : 0;

        // Calculate consistency (how similar are the confidence scores)
        const variance = confidences.length > 1
          ? confidences.reduce((acc, val) => acc + Math.pow(val - avgConfidence, 2), 0) / confidences.length
          : 0;
        const consistencyScore = Math.max(0, 100 - Math.round(Math.sqrt(variance)));

        // Determine highest proficiency
        const proficiencyOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        const proficiencies = skill.sources.map(s => s.proficiency);
        const highestProficiency = proficiencies.reduce((highest, current) => {
          return proficiencyOrder.indexOf(current) > proficiencyOrder.indexOf(highest) 
            ? current : highest;
        }, 'Beginner');

        return {
          ...skill,
          avg_confidence: avgConfidence,
          highest_proficiency: highestProficiency,
          consistency_score: consistencyScore
        };
      });

      // Sort by average confidence
      comparisonSkills.sort((a, b) => b.avg_confidence - a.avg_confidence);

      setSkills(comparisonSkills);
    } catch (error: any) {
      console.error('Error loading comparison data:', error);
      toast({
        title: "❌ Failed to load comparison data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'cv': return <FileText className="h-4 w-4" />;
      case 'performance_review': return <Award className="h-4 w-4" />;
      case 'github': return <Github className="h-4 w-4" />;
      case 'blog': return <TrendingUp className="h-4 w-4" />;
      case 'current': return <Activity className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'cv': return 'bg-primary/10 text-primary border-primary/20';
      case 'performance_review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'github': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'blog': return 'bg-accent/10 text-accent border-accent/20';
      case 'current': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'text-purple-500';
      case 'Advanced': return 'text-primary';
      case 'Intermediate': return 'text-accent';
      case 'Beginner': return 'text-muted-foreground';
      default: return 'text-muted';
    }
  };

  const getConsistencyBadge = (score: number) => {
    if (score >= 90) return { label: 'Very Consistent', variant: 'default' as const };
    if (score >= 70) return { label: 'Consistent', variant: 'secondary' as const };
    if (score >= 50) return { label: 'Moderate', variant: 'outline' as const };
    return { label: 'Variable', variant: 'destructive' as const };
  };

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(skills.map(s => s.category)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading skill comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Skill Comparison
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Add CV
            </Button>
            <Button variant="outline" onClick={() => navigate("/sources")}>
              Add Sources
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
            Multi-Source Skill Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Compare and consolidate skills identified across all your data sources
          </p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-2 hover:shadow-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Skills Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{skills.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Across {new Set(skills.flatMap(s => s.sources.map(src => src.source_type))).size} sources
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Multi-Source Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {skills.filter(s => s.sources.length > 1).length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Verified by multiple sources
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {skills.length > 0 
                  ? Math.round(skills.reduce((sum, s) => sum + s.consistency_score, 0) / skills.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Score alignment across sources
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expert Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {skills.filter(s => s.highest_proficiency === 'Expert').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Highest proficiency level
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat === 'all' ? 'All Skills' : cat}
                  {cat !== 'all' && (
                    <Badge variant="outline" className="ml-2">
                      {skills.filter(s => s.category === cat).length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Skills Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredSkills.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Skills Found</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your CV or connect data sources to start tracking skills
                </p>
                <Button onClick={() => navigate("/upload")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CV
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSkills.map((skill, idx) => (
              <motion.div
                key={skill.skill_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Card className="border-2 hover:shadow-glow transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">{skill.skill_name}</CardTitle>
                          <Badge variant="outline">{skill.category}</Badge>
                          <Badge className={getProficiencyColor(skill.highest_proficiency)}>
                            {skill.highest_proficiency}
                          </Badge>
                        </div>
                        <CardDescription>
                          Identified by {skill.sources.length} source{skill.sources.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-foreground mb-1">
                          {skill.avg_confidence}%
                        </div>
                        <Badge {...getConsistencyBadge(skill.consistency_score)}>
                          {getConsistencyBadge(skill.consistency_score).label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Overall Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Consolidated Confidence</span>
                        <span className="text-sm text-muted-foreground">
                          {skill.avg_confidence}% (±{Math.round(100 - skill.consistency_score)}%)
                        </span>
                      </div>
                      <Progress value={skill.avg_confidence} className="h-3" />
                    </div>

                    {/* Source Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Source Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {skill.sources.map((source, srcIdx) => (
                          <Card key={srcIdx} className={`border ${getSourceColor(source.source_type)}`}>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-3">
                                {getSourceIcon(source.source_type)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {source.source_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(source.analyzed_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs">Confidence</span>
                                    <span className="text-xs font-semibold">{source.confidence}%</span>
                                  </div>
                                  <Progress value={source.confidence} className="h-1.5" />
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span>Proficiency</span>
                                  <Badge variant="outline" className="text-xs py-0">
                                    {source.proficiency}
                                  </Badge>
                                </div>

                                {source.evidence.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-semibold mb-1">Evidence:</p>
                                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                                      "{source.evidence[0].substring(0, 80)}..."
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Insights */}
                    {skill.sources.length > 1 && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold mb-1">Cross-Validated Skill</p>
                            <p className="text-muted-foreground">
                              This skill has been identified across {skill.sources.length} different sources
                              with {skill.consistency_score >= 70 ? 'consistent' : 'varying'} confidence levels.
                              {skill.consistency_score >= 90 && ' Strong evidence suggests this is a core strength.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SkillComparison;
