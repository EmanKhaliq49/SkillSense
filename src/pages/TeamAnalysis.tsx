import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Users, TrendingUp, AlertCircle, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const TeamAnalysis = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const teamStats = {
    totalMembers: 12,
    totalSkills: 45,
    criticalGaps: 3,
    experts: 5
  };

  const skillCoverage = [
    { category: "Technical Skills", coverage: 85, color: "bg-primary" },
    { category: "Soft Skills", coverage: 70, color: "bg-accent" },
    { category: "Domain Knowledge", coverage: 65, color: "bg-success" },
    { category: "Business Skills", coverage: 55, color: "bg-purple-500" },
  ];

  const criticalGaps = [
    { skill: "Cloud Architecture", severity: "high", count: 0, needed: 2 },
    { skill: "Machine Learning", severity: "medium", count: 1, needed: 3 },
    { skill: "Cybersecurity", severity: "high", count: 0, needed: 2 },
  ];

  const teamExperts = [
    { name: "Sarah Johnson", skills: ["React", "TypeScript", "Leadership"], count: 8 },
    { name: "Mike Chen", skills: ["Python", "Data Analysis", "AWS"], count: 7 },
    { name: "Emily Davis", skills: ["UI/UX Design", "Project Management"], count: 6 },
  ];

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/jobs")}>
              Job Matching
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Team Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Organization-wide skill insights and gap analysis
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamStats.totalMembers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Skills
                </CardTitle>
                <Brain className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamStats.totalSkills}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Critical Gaps
                </CardTitle>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamStats.criticalGaps}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Experts
                </CardTitle>
                <Award className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamStats.experts}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Coverage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Skill Coverage by Category
                </CardTitle>
                <CardDescription>
                  Overall team capabilities across skill categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {skillCoverage.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.coverage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all`}
                        style={{ width: `${item.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Team Experts */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Top Experts
                </CardTitle>
                <CardDescription>
                  Team members with the most verified skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamExperts.map((expert, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{expert.name}</h4>
                      <Badge variant="secondary">{expert.count} skills</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expert.skills.map((skill, sidx) => (
                        <Badge key={sidx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Critical Gaps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Critical Skill Gaps
                </CardTitle>
                <CardDescription>
                  Skills needed to strengthen the team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criticalGaps.map((gap, idx) => (
                  <div key={idx} className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{gap.skill}</h4>
                        <p className="text-sm text-muted-foreground">
                          Current: {gap.count} | Needed: {gap.needed}
                        </p>
                      </div>
                      <Badge
                        variant="destructive"
                        className={gap.severity === 'high' ? '' : 'bg-orange-500'}
                      >
                        {gap.severity}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <strong>Recommendation:</strong> Hire or train {gap.needed - gap.count} team member(s) with this skill
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalysis;
