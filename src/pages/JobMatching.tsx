import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Briefcase, Target, TrendingUp, Search, Sparkles, Check, X, Star, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ocrService } from "@/services/ocrService";

const JobMatching = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [hasSkills, setHasSkills] = useState<boolean | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [jobApplications, setJobApplications] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvFileName, setCvFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sampleJobDescription = `Senior Full Stack Developer

About the Role:
We are seeking an experienced Full Stack Developer to join our growing engineering team. You will be responsible for building scalable web applications and contributing to our product architecture.

Key Responsibilities:
• Design and develop full-stack web applications using modern frameworks
• Write clean, maintainable, and well-documented code
• Collaborate with cross-functional teams to define and ship new features
• Optimize application performance and ensure scalability
• Participate in code reviews and mentor junior developers
• Troubleshoot and debug production issues

Required Skills & Qualifications:
• 5+ years of professional software development experience
• Strong proficiency in JavaScript/TypeScript and React
• Experience with Node.js and RESTful API development
• Solid understanding of database design (SQL and NoSQL)
• Experience with Git version control and CI/CD pipelines
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Bachelor's degree in Computer Science or related field

Preferred Skills:
• Experience with cloud platforms (AWS, Google Cloud, or Azure)
• Knowledge of Docker and Kubernetes
• Familiarity with GraphQL
• Experience with testing frameworks (Jest, Cypress)
• Understanding of microservices architecture
• Previous experience in Agile/Scrum environments

What We Offer:
• Competitive salary and equity package
• Flexible remote work options
• Professional development opportunities
• Health and wellness benefits
• Collaborative and innovative team culture`;

  const fillSampleJob = () => {
    setJobDescription(sampleJobDescription);
    toast({
      title: "Sample Job Loaded",
      description: "Example job description added. Click Analyze Match to test!",
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadJobs();
      checkUserSkills();
      loadJobApplications();
    }
  }, [user]);

  // Auto-match jobs when skills are loaded
  useEffect(() => {
    if (userSkills.length > 0 && jobs.length > 0) {
      calculateJobMatches();
    }
  }, [userSkills, jobs]);

  // Recheck skills when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        checkUserSkills();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Realtime subscription for skills updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up realtime subscription for user_skills...');
    
    const channel = supabase
      .channel('user_skills_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_skills',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('✨ New skill detected via realtime:', payload);
          toast({
            title: "Skills Updated!",
            description: "Your profile has been updated with new skills from your CV.",
          });
          checkUserSkills();
          loadJobApplications();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from realtime channel');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkUserSkills = async () => {
    console.log('🔍 Checking user skills...');
    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        *,
        skill_framework (
          name,
          category
        )
      `)
      .eq('user_id', user?.id as string)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching user skills:', error);
    }

    console.log('✅ Skills check result:', { hasData: data && data.length > 0, count: data?.length });
    setHasSkills(data && data.length > 0);
    if (data && data.length > 0) {
      setUserSkills(data);
    }
  };

  const calculateJobMatches = () => {
    setLoadingMatches(true);
    console.log('🎯 Calculating job matches...');
    
    const userSkillNames = userSkills
      .map(s => s.skill_framework?.name?.toLowerCase())
      .filter(Boolean);

    const jobsWithScores = jobs.map(job => {
      const requiredSkills = (job.required_skills || []).map((s: string) => s.toLowerCase());
      const preferredSkills = (job.preferred_skills || []).map((s: string) => s.toLowerCase());
      
      const matchingRequired = requiredSkills.filter((s: string) => 
        userSkillNames.some(userSkill => userSkill.includes(s) || s.includes(userSkill))
      );
      
      const matchingPreferred = preferredSkills.filter((s: string) => 
        userSkillNames.some(userSkill => userSkill.includes(s) || s.includes(userSkill))
      );

      const missingRequired = requiredSkills.filter((s: string) => 
        !matchingRequired.includes(s)
      );

      // Calculate match score
      const requiredWeight = 0.7;
      const preferredWeight = 0.3;
      
      const requiredScore = requiredSkills.length > 0 
        ? (matchingRequired.length / requiredSkills.length) * 100 
        : 100;
      
      const preferredScore = preferredSkills.length > 0 
        ? (matchingPreferred.length / preferredSkills.length) * 100 
        : 100;

      const matchScore = Math.round(
        (requiredScore * requiredWeight) + (preferredScore * preferredWeight)
      );

      return {
        ...job,
        matchScore,
        matchingSkills: [...matchingRequired, ...matchingPreferred],
        missingSkills: missingRequired
      };
    });

    const sortedJobs = jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    // Apply status filter
    let filteredJobs = sortedJobs;
    if (statusFilter !== "all") {
      filteredJobs = sortedJobs.filter(job => {
        const app = jobApplications[job.id];
        if (statusFilter === "none") return !app;
        return app?.status === statusFilter;
      });
    }
    
    setMatchedJobs(filteredJobs);
    setLoadingMatches(false);
    
    console.log('✅ Job matches calculated:', filteredJobs.length);
  };

  const getStatusBadge = (jobId: string) => {
    const app = jobApplications[jobId];
    if (!app) return null;

    const statusConfig = {
      interested: { icon: Star, color: "bg-blue-500", text: "Interested" },
      applied: { icon: Check, color: "bg-green-500", text: "Applied" },
      rejected: { icon: X, color: "bg-red-500", text: "Rejected" }
    };

    const config = statusConfig[app.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("is_active", true)
      .limit(10);

    if (data) {
      setJobs(data);
    }
  };

  const loadJobApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*");

    if (data) {
      const applicationsMap = data.reduce((acc, app) => {
        acc[app.job_id] = app;
        return acc;
      }, {} as Record<string, any>);
      setJobApplications(applicationsMap);
    }
  };

  const updateJobStatus = async (jobId: string, status: 'interested' | 'applied' | 'rejected') => {
    const existingApp = jobApplications[jobId];
    
    try {
      if (existingApp) {
        const { error } = await supabase
          .from("job_applications")
          .update({ 
            status,
            applied_date: status === 'applied' ? new Date().toISOString() : existingApp.applied_date,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingApp.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_applications")
          .insert([{
            job_id: jobId,
            user_id: user?.id as string,
            status,
            applied_date: status === 'applied' ? new Date().toISOString() : null
          }]);

        if (error) throw error;
      }

      await loadJobApplications();
      
      toast({
        title: "Status Updated",
        description: `Job marked as ${status}`,
      });
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const runDemoAnalysis = () => {
    setAnalyzing(true);
    setIsDemoMode(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setMatchResult({
        matchScore: 78,
        matchingSkills: [
          "JavaScript",
          "React",
          "TypeScript",
          "Node.js",
          "REST APIs",
          "Git",
          "Agile Development",
          "Problem Solving"
        ],
        missingSkills: [
          "GraphQL",
          "Docker",
          "Kubernetes",
          "AWS Services"
        ],
        recommendations: [
          "Strong foundation in core technologies - your JavaScript and React skills align well with this role",
          "Consider learning GraphQL to enhance your API development capabilities",
          "Docker and Kubernetes knowledge would strengthen your DevOps skills for this position",
          "AWS certification would be valuable for cloud infrastructure requirements",
          "Your Agile experience is a great asset for the team collaboration aspects"
        ],
        jobRequirements: {
          technical: ["JavaScript", "React", "TypeScript", "GraphQL", "Docker", "AWS"],
          soft: ["Team collaboration", "Problem solving", "Communication"],
          experience: "3-5 years"
        }
      });
      setAnalyzing(false);
    }, 1500);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    setUploadingCV(true);
    setCvFileName(file.name);

    try {
      // Extract text robustly (PDF/TXT, images fallback) for accurate skills
      const { text } = await ocrService.processDocument(file);

      toast({
        title: "Processing CV...",
        description: "Extracting skills from your CV. This may take a moment.",
      });

      const { data, error } = await supabase.functions.invoke('analyze-cv', {
        body: { cvText: text }
      });

      if (error) {
        console.error('Error analyzing CV:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.details || data.error);
      }

      toast({
        title: "CV Analyzed Successfully!",
        description: `Found ${data.skills?.length || 0} skills. You can now analyze job descriptions.`,
      });

      // Refresh skills
      await checkUserSkills();
      
      // Clear the result if there was a previous one
      setMatchResult(null);
    } catch (error) {
      console.error('Failed to analyze CV:', error);
      toast({
        title: "CV Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to extract skills from CV.",
        variant: "destructive",
      });
      setCvFileName("");
    } finally {
      setUploadingCV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const analyzeJobMatch = async () => {
    console.log('🎯 Starting job match analysis...');
    console.log('📝 Job description length:', jobDescription.length);
    console.log('✨ Has skills:', hasSkills);
    
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please paste a job description to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (hasSkills === false) {
      toast({
        title: "No Skills Found",
        description: "Upload your CV first to get personalized matches, or click 'Try Demo' to see how it works.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setIsDemoMode(false);
    
    try {
      console.log('📞 Calling analyze-job-match edge function...');
      
      const { data, error } = await supabase.functions.invoke('analyze-job-match', {
        body: { jobDescription }
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Error from edge function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Error in response data:', data);
        throw new Error(data.details || data.error);
      }

      console.log('✅ Analysis successful:', data);
      setMatchResult(data);
      toast({
        title: "Analysis Complete!",
        description: `Match score: ${data.matchScore}% - ${data.matchingSkills?.length || 0} matching skills found`,
      });
    } catch (error) {
      console.error('💥 Failed to analyze job match:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze job match. Please try again.",
        variant: "destructive",
      });
      
      // Show partial result with error message
      setMatchResult({
        matchScore: 0,
        matchingSkills: [],
        missingSkills: [],
        recommendations: [
          `Error: ${error instanceof Error ? error.message : "Failed to analyze job match."}`,
          "Please make sure you have uploaded your CV first.",
          "If the problem persists, try refreshing the page or uploading your CV again."
        ]
      });
    } finally {
      setAnalyzing(false);
      console.log('🏁 Analysis complete');
    }
  };

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
            <Button variant="outline" onClick={() => navigate("/guide")}>
              User Guide
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/team")}>
              Team Analysis
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
            Job Matching
          </h1>
          <p className="text-muted-foreground text-lg">
            Find roles that match your skill profile
          </p>
        </motion.div>

        {/* User Skills Overview */}
        {hasSkills === true && userSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Your Top Skills
                </CardTitle>
                <CardDescription>
                  Based on your CV analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill) => (
                    <Badge 
                      key={skill.id} 
                      variant="default"
                      className="text-sm py-1.5 px-3"
                    >
                      {skill.skill_framework?.name || 'Unknown Skill'}
                      {skill.proficiency_level && (
                        <span className="ml-2 opacity-70 text-xs">
                          {skill.proficiency_level}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
                {userSkills.length >= 10 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Showing top 10 skills. View all in your Dashboard.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analyze Job Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Analyze Job Description
                </CardTitle>
                <CardDescription>
                  Paste a job description to see how well you match
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSkills === false && (
                  <div className="space-y-3 mb-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3 mb-3">
                        <Upload className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">Upload Your CV</h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Upload your CV to extract skills and get personalized job matches
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingCV}
                            size="sm"
                            className="w-full"
                          >
                            {uploadingCV ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <FileText className="mr-2 h-4 w-4" />
                                Choose CV File
                              </>
                            )}
                          </Button>
                          {cvFileName && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Last uploaded: {cvFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        Or try demo mode to see how job matching works
                      </p>
                      <Button
                        onClick={runDemoAnalysis}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={analyzing || uploadingCV}
                      >
                        Try Demo
                      </Button>
                    </div>
                  </div>
                )}
                {hasSkills === true && (
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-primary text-white rounded-lg shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">CV Analyzed Successfully!</div>
                          <div className="text-sm opacity-90">
                            {userSkills.length} skills extracted - Ready to analyze jobs
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={checkUserSkills}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-accent/50 rounded-lg border-2 border-primary/30">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Ready to Analyze!</h4>
                          <p className="text-xs text-muted-foreground">
                            Paste any job description below and click "Analyze Match" to see how well you match with the role, what skills you have, and what to learn next.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Job Description</label>
                    <Button
                      onClick={fillSampleJob}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={uploadingCV}
                    >
                      <FileText className="mr-1.5 h-3 w-3" />
                      Load Sample Job
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Paste the full job description here (requirements, responsibilities, qualifications, etc.)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px] text-sm"
                  />
                </div>
                
                {jobDescription.trim() && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {jobDescription.length} characters
                  </div>
                )}
                
                <Button
                  onClick={analyzeJobMatch}
                  disabled={analyzing || uploadingCV || !jobDescription.trim()}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Analyzing Your Match...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze Match
                    </>
                  )}
                </Button>
                
                {!jobDescription.trim() && hasSkills === true && (
                  <p className="text-xs text-center text-muted-foreground">
                    👆 Paste a job description above to get your personalized match analysis
                  </p>
                )}

                {matchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {isDemoMode && (
                      <div className="p-3 bg-accent/50 text-accent-foreground rounded-lg border border-accent text-sm">
                        <strong>Demo Mode:</strong> This is sample data. Upload your CV for personalized results.
                      </div>
                    )}
                    <div className="p-4 bg-gradient-primary text-white rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1">Match Score</div>
                        <div className="text-4xl font-bold">{matchResult.matchScore}%</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Matching Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.matchingSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Skills to Develop</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                      {matchResult.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 text-primary mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Jobs - Now with Auto-Matching */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      {hasSkills ? "Auto-Matched Jobs" : "Available Jobs"}
                    </CardTitle>
                    <CardDescription>
                      {hasSkills 
                        ? "Jobs ranked by how well they match your skills"
                        : "Sign in and upload your CV for personalized matches"}
                    </CardDescription>
                  </div>
                  {hasSkills && matchedJobs.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Filter: {statusFilter === "all" ? "All" : statusFilter === "none" ? "No Status" : statusFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                          All Jobs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("none")}>
                          No Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("interested")}>
                          Interested
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("applied")}>
                          Applied
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                          Rejected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingMatches ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing job matches...</p>
                  </div>
                ) : hasSkills && matchedJobs.length > 0 ? (
                  matchedJobs.map((job, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{job.title}</h4>
                            {getStatusBadge(job.id)}
                          </div>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          {job.location && (
                            <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                          )}
                        </div>
                        <Badge 
                          variant={job.matchScore >= 70 ? "default" : job.matchScore >= 50 ? "secondary" : "outline"}
                          className="text-lg font-bold px-3 py-1"
                        >
                          {job.matchScore}%
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        {job.matchingSkills && job.matchingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Matching Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {job.matchingSkills.slice(0, 5).map((skill: string, i: number) => (
                                <Badge key={i} variant="default" className="text-xs">{skill}</Badge>
                              ))}
                              {job.matchingSkills.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{job.matchingSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {job.missingSkills && job.missingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Skills to Develop</p>
                            <div className="flex flex-wrap gap-1">
                              {job.missingSkills.slice(0, 3).map((skill: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                              ))}
                              {job.missingSkills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.missingSkills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => updateJobStatus(job.id, 'interested')}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Interested
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => updateJobStatus(job.id, 'applied')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Applied
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => updateJobStatus(job.id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                  ))
                ) : jobs.length > 0 ? (
                  jobs.map((job, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      {job.location && (
                        <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                      )}
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        View Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No jobs available yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back soon for new opportunities
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobMatching;
