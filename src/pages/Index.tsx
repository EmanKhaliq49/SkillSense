import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, TrendingUp, Upload, Zap, CheckCircle, FileSearch, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI extracts both explicit and implicit skills from your professional data",
      color: "text-primary"
    },
    {
      icon: FileSearch,
      title: "Multi-Source Aggregation",
      description: "Connect GitHub, upload CVs, analyze blogs and performance reviews to build a comprehensive skill profile",
      color: "text-success"
    },
    {
      icon: CheckCircle,
      title: "Smart Validation",
      description: "Intelligent validation ensures high-quality skill analysis from all sources",
      color: "text-accent"
    },
    {
      icon: BarChart3,
      title: "Career Insights",
      description: "Get personalized recommendations and identify skill gaps for career growth",
      color: "text-purple-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex gap-4">
              <Button onClick={() => navigate("/guide")} variant="outline">
                User Guide
              </Button>
              <Button onClick={() => navigate("/skill-comparison")} variant="outline">
                Compare Skills
              </Button>
              <Button onClick={() => navigate("/auth")} variant="ghost">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
                <Upload className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium text-secondary-foreground mb-4">
              <Sparkles className="h-4 w-4" />
              100% In-Browser AI • No External APIs
            </div>
          </motion.div>
          
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold text-foreground leading-tight"
          >
            Unlock Your
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Hidden Potential
            </span>
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            AI-powered skill analysis from multiple sources. Upload CVs, connect GitHub repositories, 
            analyze blogs and performance reviews - our intelligent system aggregates everything to discover your complete skill profile.
          </motion.p>
          
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 shadow-glow group"
            >
              <Zap className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Start Analysis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 h-14 border-2"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Tech Stack Badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-3 justify-center pt-8"
          >
            {[
              'GitHub Analysis',
              'Blog Analysis',
              'CV Upload',
              'AI Validation',
              'Instant Results'
            ].map((tech, idx) => (
              <div
                key={idx}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-success" />
                {tech}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Intelligent Features
            </h2>
            <p className="text-xl text-muted-foreground">
              Advanced AI technology working entirely in your browser
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-card p-6 rounded-2xl border border-border hover:shadow-glow transition-all"
              >
                <div className={`bg-gradient-primary p-3 rounded-xl w-fit mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-3xl mx-auto text-center space-y-12"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Four intelligent steps to discover your complete skill profile
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
          >
            {[
              {
                step: "01",
                title: "Connect Your Sources",
                description: "Upload CV, connect GitHub for code analysis, or analyze blogs and performance reviews.",
                icon: Upload
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Advanced AI processes all sources to extract explicit and implicit skills.",
                icon: Brain
              },
              {
                step: "03",
                title: "Skill Aggregation",
                description: "Multi-source data combines into a comprehensive skill profile with evidence.",
                icon: Target
              },
              {
                step: "04",
                title: "Career Insights",
                description: "Get personalized recommendations, identify gaps, and plan your growth path.",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all"
              >
                <div className="text-6xl font-bold text-primary/20 absolute top-2 right-4">
                  {item.step}
                </div>
                <div className="relative">
                  <item.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="bg-card rounded-3xl p-12 border border-border"
        >
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {[
              { value: "5+", label: "Data Sources", icon: Target },
              { value: "AI", label: "Powered Analysis", icon: Brain },
              { value: "Real-time", label: "Instant Insights", icon: Zap }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-primary rounded-3xl p-12 text-center text-white shadow-glow"
        >
          <Sparkles className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Ready to Discover Your Full Potential?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Connect GitHub, upload CVs, and analyze your content. Get comprehensive skill analysis from all your professional sources in minutes.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-14 shadow-lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Start Free Analysis
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">SkillSense</span>
          </div>
          <p className="mb-2">Multi-Source Skill Analysis Powered by AI</p>
          <p className="text-sm">
            CV Upload • GitHub • Blogs • Performance Reviews • Goals Tracking • Learning Paths
          </p>
          <p className="text-xs mt-4">© 2025 SkillSense. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
