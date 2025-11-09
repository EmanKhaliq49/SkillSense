import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Upload, 
  Target, 
  TrendingUp, 
  Users, 
  Briefcase,
  BookOpen,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

const UserGuide = () => {
  const navigate = useNavigate();

  const guides = [
    {
      icon: Upload,
      title: "Upload CV",
      route: "/upload",
      description: "Start by uploading your CV or resume",
      steps: [
        "Click 'Choose File' to select your CV (PDF, DOCX, or TXT)",
        "The AI will analyze your skills, experience, and qualifications",
        "Your skills are automatically extracted and saved to your profile",
        "You can also connect external data sources like GitHub or blog"
      ]
    },
    {
      icon: Target,
      title: "Dashboard",
      route: "/dashboard",
      description: "View your complete skill profile and insights",
      steps: [
        "See your overall skill score and profile summary",
        "Browse all identified skills organized by category",
        "View AI-generated insights about your strengths",
        "Track your skill development over time",
        "Manage privacy settings for sharing your profile"
      ]
    },
    {
      icon: Briefcase,
      title: "Job Matching",
      route: "/jobs",
      description: "Find jobs that match your skills",
      steps: [
        "View your top skills from CV analysis",
        "See automatically matched jobs ranked by compatibility",
        "Paste job descriptions for custom analysis",
        "Get detailed match scores with matching and missing skills",
        "Track applications with status (Interested, Applied, Rejected)",
        "Filter jobs by application status"
      ]
    },
    {
      icon: BookOpen,
      title: "Learning Path",
      route: "/learning-path",
      description: "Create personalized learning plans",
      steps: [
        "Set career goals with target skills and timeline",
        "AI generates customized learning paths for each goal",
        "Get recommended resources, courses, and tutorials",
        "Track your progress through learning milestones",
        "Update goals as you develop new skills"
      ]
    },
    {
      icon: TrendingUp,
      title: "Career Goals",
      route: "/goals",
      description: "Define and track your career objectives",
      steps: [
        "Create new career goals with descriptions",
        "Set target completion dates",
        "Add target skills you want to develop",
        "Monitor progress toward each goal",
        "Update or delete goals as priorities change"
      ]
    },
    {
      icon: Users,
      title: "Team Analysis",
      route: "/team",
      description: "Analyze team skills and identify gaps",
      steps: [
        "View aggregated skills across your organization",
        "Identify skill gaps and areas needing development",
        "See team member profiles and their expertise",
        "Get recommendations for team skill development",
        "Export team analytics for reporting"
      ]
    }
  ];

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
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            User Guide
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn how to make the most of SkillSense
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <strong>Upload Your CV:</strong> Start by uploading your resume to extract your skills automatically
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <strong>Review Your Dashboard:</strong> Check your skill profile and AI-generated insights
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <strong>Find Matching Jobs:</strong> Browse auto-matched job opportunities based on your skills
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <strong>Create Learning Paths:</strong> Set goals and get personalized learning recommendations
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <motion.div
                key={guide.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {guide.title}
                    </CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="space-y-2 text-sm">
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <Button
                      onClick={() => navigate(guide.route)}
                      variant="outline"
                      className="w-full"
                    >
                      Go to {guide.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
              <CardDescription>Get the most out of SkillSense</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Keep your CV updated:</strong> Re-upload your CV when you gain new skills or experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Connect multiple data sources:</strong> Link GitHub, blogs, and other platforms for comprehensive analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Track job applications:</strong> Use status tracking to organize your job search</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Set realistic goals:</strong> Break down large career objectives into smaller, achievable goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Review insights regularly:</strong> Check your dashboard for AI recommendations on skill development</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default UserGuide;
