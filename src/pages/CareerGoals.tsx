import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const CareerGoals = () => {
  const [goal, setGoal] = useState("Senior Software Engineer");

  // Mock data - replace with real data
  const requiredSkills = [
    { name: "System Design", status: "missing", priority: "high" },
    { name: "Team Leadership", status: "developing", priority: "high", progress: 40 },
    { name: "Cloud Architecture", status: "missing", priority: "medium" },
    { name: "Mentoring", status: "developing", priority: "medium", progress: 60 },
    { name: "Strategic Planning", status: "missing", priority: "low" },
  ];

  const recommendations = [
    {
      title: "Focus on System Design",
      description: "Essential for senior roles. Start with distributed systems fundamentals.",
      priority: "high"
    },
    {
      title: "Develop Leadership Skills",
      description: "Lead a small project team or mentor junior developers.",
      priority: "high"
    },
    {
      title: "Learn Cloud Architecture",
      description: "AWS or Azure certification would strengthen your profile.",
      priority: "medium"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-success text-success-foreground">Complete</Badge>;
      case "developing":
        return <Badge variant="secondary">Developing</Badge>;
      case "missing":
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-destructive/10 text-destructive border-destructive/20",
      medium: "bg-accent/10 text-accent border-accent/20",
      low: "bg-muted text-muted-foreground border-border"
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Career Goals</h1>
        <p className="text-muted-foreground">
          Set your career target and identify skill gaps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Goal Setting */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  My Career Goal
                </CardTitle>
                <CardDescription>
                  Define where you want to be in your career
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Position</label>
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <Button className="w-full">Update Goal</Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Required Skills
                </CardTitle>
                <CardDescription>
                  Skills needed for your target position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requiredSkills.map((skill, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{skill.name}</span>
                        {getStatusBadge(skill.status)}
                      </div>
                      {skill.status === "developing" && (
                        <div className="space-y-1">
                          <Progress value={skill.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {skill.progress}% Complete
                          </p>
                        </div>
                      )}
                      <Badge variant="outline" className={`mt-2 ${getPriorityBadge(skill.priority)}`}>
                        {skill.priority} priority
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Gap Analysis */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Your Skill Gap
                </CardTitle>
                <CardDescription>
                  Skills you need to develop or acquire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-background rounded-lg border">
                    <div className="text-5xl font-bold text-destructive mb-2">
                      {requiredSkills.filter(s => s.status === "missing").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Missing Skills</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-accent mb-1">
                        {requiredSkills.filter(s => s.status === "developing").length}
                      </div>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-success mb-1">
                        {requiredSkills.filter(s => s.status === "complete").length}
                      </div>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">25%</span>
                    </div>
                    <Progress value={25} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions for your career path
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-background rounded-lg border hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <Badge variant="outline" className={getPriorityBadge(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View Full Learning Path
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CareerGoals;
