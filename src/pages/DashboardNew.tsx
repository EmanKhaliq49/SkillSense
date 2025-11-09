import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, TrendingUp, Award, Activity, FileText, Github, 
  Globe, Calendar, ArrowRight, Sparkles, Target, Sprout
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import SkillNode from "@/components/SkillNode";
import GrowthPathLine from "@/components/GrowthPathLine";

const DashboardNew = () => {
  const navigate = useNavigate();

  // Mock data - replace with real data from backend
  const stats = {
    overallScore: 78,
    skillsCount: 24,
    expertSkills: 6,
    careerInsights: 8
  };

  const skillDistribution = [
    { name: "Technical", value: 12, color: "hsl(195 85% 55%)" },
    { name: "Soft Skills", value: 7, color: "hsl(45 95% 60%)" },
    { name: "Domain", value: 3, color: "hsl(174 45% 40%)" },
    { name: "Languages", value: 2, color: "hsl(195 85% 70%)" },
  ];

  const topSkills = [
    { name: "React", confidence: 92, category: "Technical", sources: ["github", "cv"] },
    { name: "TypeScript", confidence: 88, category: "Technical", sources: ["github", "cv"] },
    { name: "System Design", confidence: 85, category: "Technical", sources: ["cv", "blog"] },
    { name: "Leadership", confidence: 82, category: "Soft Skills", sources: ["review"] },
    { name: "Python", confidence: 78, category: "Technical", sources: ["github"] },
  ];

  const pathMilestones = [
    { position: 20, label: "Foundation", completed: true },
    { position: 40, label: "Intermediate", completed: true },
    { position: 65, label: "Current", completed: true },
    { position: 85, label: "Advanced", completed: false },
  ];

  const recentActivity = [
    { 
      type: "cv", 
      icon: FileText, 
      title: "Analyzed CV: resume_2025.pdf", 
      date: "2 hours ago",
      color: "text-primary"
    },
    { 
      type: "github", 
      icon: Github, 
      title: "Skills from GitHub: skillsense-project", 
      date: "1 day ago",
      color: "text-success"
    },
    { 
      type: "blog", 
      icon: Globe, 
      title: "Analyzed blog post on React patterns", 
      date: "3 days ago",
      color: "text-accent"
    },
  ];

  const careerGoal = {
    title: "Senior Software Engineer",
    progress: 65,
    skillsNeeded: 5
  };

  const bloomVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Welcome Section - Growth Sprout */}
      <motion.div variants={bloomVariants}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-forest via-primary to-cyan-600 border-0 shadow-glow">
          <div className="absolute inset-0 bg-gradient-node opacity-30" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sprout className="h-12 w-12 text-amber-400 animate-float" />
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-white">Your skill ecosystem is thriving!</h1>
                  <p className="text-white/80">
                    Continue cultivating your professional growth path.
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-amber text-forest-dark hover:shadow-glow animate-pulse-soft shadow-node"
                onClick={() => {/* Add source dialog */}}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Cultivate New Skills
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards - Knowledge Nodes */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={bloomVariants}>
          <Card className="glass-effect hover:shadow-glow-cyan transition-all duration-300 hover:-translate-y-2 border-cyan-500/20 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Growth Score
                </CardTitle>
                <div className="relative">
                  <Activity className="h-5 w-5 text-cyan-500 group-hover:animate-pulse" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-2">
                {stats.overallScore}%
              </div>
              <Progress value={stats.overallScore} className="h-2 mb-2 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600" />
              <p className="text-xs text-muted-foreground">
                Ecosystem thriving
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={bloomVariants}>
          <Card className="glass-effect hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-amber-500/20 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Skills Discovered
                </CardTitle>
                <div className="relative">
                  <Brain className="h-5 w-5 text-amber-500 group-hover:animate-pulse" />
                  <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-amber bg-clip-text text-transparent mb-2">
                {stats.skillsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                From 4 growth sources
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={bloomVariants}>
          <Card className="glass-effect hover:shadow-node transition-all duration-300 hover:-translate-y-2 border-amber-400/20 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mastery Nodes
                </CardTitle>
                <div className="relative">
                  <Award className="h-5 w-5 text-amber-400 group-hover:animate-pulse" />
                  <div className="absolute inset-0 bg-amber-400/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-400 mb-2">
                {stats.expertSkills}
              </div>
              <p className="text-xs text-muted-foreground">
                12 advancing branches
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={bloomVariants}>
          <Card className="glass-effect hover:shadow-glow-cyan transition-all duration-300 hover:-translate-y-2 border-primary/20 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Path Insights
                </CardTitle>
                <div className="relative">
                  <TrendingUp className="h-5 w-5 text-primary group-hover:animate-pulse" />
                  <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.careerInsights}
              </div>
              <p className="text-xs text-muted-foreground">
                Growth opportunities
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill DNA Strand - Horizontal Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Skill DNA Strand
              </CardTitle>
              <CardDescription>Your knowledge distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillDistribution} layout="vertical">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }} 
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Competencies - Skill Nodes */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-500" />
                Core Competencies
              </CardTitle>
              <CardDescription>Your strongest skill nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 justify-center p-4">
                {topSkills.map((skill, idx) => (
                  <SkillNode
                    key={idx}
                    name={skill.name}
                    proficiency={skill.confidence}
                    category={skill.category}
                    sources={skill.sources}
                    isExpert={skill.confidence >= 90}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Career Goal Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pathfinder Goal - Growth Path */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500 animate-pulse" />
                Pathfinder Goal
              </CardTitle>
              <CardDescription className="text-lg font-medium">
                On the path to {careerGoal.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <GrowthPathLine 
                progress={careerGoal.progress}
                milestones={pathMilestones}
              />
              <div className="flex items-center justify-between p-4 glass-effect rounded-lg border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
                  <p className="text-2xl font-bold bg-gradient-amber bg-clip-text text-transparent">
                    {careerGoal.progress}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Skills to Master</p>
                  <Badge variant="outline" className="text-lg px-3 py-1 border-amber-500/30">
                    {careerGoal.skillsNeeded}
                  </Badge>
                </div>
              </div>
              <Button className="w-full bg-gradient-amber text-forest-dark hover:shadow-glow" onClick={() => navigate("/goals")}>
                View Detailed Path
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Discoveries */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                Recent Discoveries
              </CardTitle>
              <CardDescription>Latest growth in your ecosystem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg glass-effect hover:bg-muted/50 transition-all border border-transparent hover:border-border/50"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-node ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {activity.date}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions - Ecosystem Insights */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-cyan-500 animate-pulse" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Explore Your Skill Ecosystem</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover connections and patterns across all your growth sources
                  </p>
                </div>
              </div>
              <Button className="bg-gradient-primary text-white hover:shadow-glow-cyan" onClick={() => navigate("/skill-comparison")}>
                View Ecosystem Map
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardNew;
