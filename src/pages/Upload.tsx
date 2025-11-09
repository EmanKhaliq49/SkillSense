import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, FileText, Upload as UploadIcon, CheckCircle2, Loader2, 
  AlertCircle, Sparkles, TrendingUp, Target, BookOpen, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ocrService } from "@/services/ocrService";
import { supabase } from "@/integrations/supabase/client";

interface ProcessingState {
  stage: 'idle' | 'uploading' | 'ocr' | 'validation' | 'analysis' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface AnalysisResult {
  isValid: boolean;
  skills: any[];
  insights: any[];
  summary: string;
  overallScore: number;
  extractedText: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateProgress = (stage: ProcessingState['stage'], progress: number, message: string) => {
    setProcessingState({ stage, progress, message });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setSelectedFile(files[0]);
    setAnalysisResult(null);
  };

  const processDocument = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      // Stage 1: Upload & Read
      updateProgress('uploading', 10, 'Reading document...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: OCR Processing
      updateProgress('ocr', 25, 'Extracting text with OCR...');
      const ocrResult = await ocrService.processDocument(selectedFile);
      
      // Stage 3: CV Validation
      updateProgress('validation', 50, 'Validating CV format...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!ocrResult.isCV) {
        updateProgress('error', 0, 'Document does not appear to be a valid CV/Resume');
        toast({
          title: "❌ Invalid Document",
          description: "This doesn't appear to be a CV or Resume. Please upload a valid CV.",
          variant: "destructive",
        });
        
        setAnalysisResult({
          isValid: false,
          skills: [],
          insights: [],
          summary: 'The uploaded document does not appear to be a CV or Resume. Please ensure you upload a document that contains professional experience, skills, and education.',
          overallScore: 0,
          extractedText: ocrResult.text.slice(0, 500) + '...'
        });
        return;
      }

      // Stage 4: AI Analysis (Backend)
      updateProgress('analysis', 75, 'Analyzing skills with AI...');
      
      const { data: aiAnalysis, error: aiError } = await supabase.functions.invoke('analyze-cv', {
        body: {
          cvText: ocrResult.text,
          extractedSkills: ocrResult.extractedData.skills
        }
      });

      if (aiError) {
        throw new Error(aiError.message || 'AI analysis failed');
      }

      if (!aiAnalysis || !aiAnalysis.skills) {
        throw new Error('Invalid AI response');
      }

      // Stage 5: Complete
      updateProgress('complete', 100, 'Analysis complete!');
      
      setAnalysisResult({
        isValid: true,
        skills: aiAnalysis.skills,
        insights: aiAnalysis.insights,
        summary: aiAnalysis.summary,
        overallScore: aiAnalysis.overallScore,
        extractedText: ocrResult.text.slice(0, 500) + '...'
      });

      toast({
        title: "✅ Analysis Complete!",
        description: `Identified ${aiAnalysis.skills.length} skills with ${aiAnalysis.overallScore}% confidence`,
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      updateProgress('error', 0, error.message || 'An error occurred');
      
      toast({
        title: "❌ Processing Failed",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    }
  };

  const getStageColor = (stage: ProcessingState['stage']) => {
    switch (stage) {
      case 'complete': return 'text-success';
      case 'error': return 'text-destructive';
      case 'idle': return 'text-muted-foreground';
      default: return 'text-primary';
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
            <Button variant="outline" onClick={() => navigate("/sources")}>
              Add Sources
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

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              AI-Powered CV Analysis
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload your CV for instant skill extraction and career insights
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Upload Your CV
                </CardTitle>
                <CardDescription>
                  PDF, Image, or Text format supported • OCR-enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-all hover:shadow-glow">
                  <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary font-semibold text-lg">Click to upload</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      or drag and drop your CV here
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={processingState.stage !== 'idle' && processingState.stage !== 'complete' && processingState.stage !== 'error'}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-3">
                    PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-4 bg-secondary rounded-lg"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Processing Status */}
                <AnimatePresence>
                  {processingState.stage !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${getStageColor(processingState.stage)}`}>
                          {processingState.message}
                        </span>
                        {processingState.stage !== 'complete' && processingState.stage !== 'error' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {processingState.stage === 'complete' && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        {processingState.stage === 'error' && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <Progress value={processingState.progress} className="h-2" />
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${processingState.progress >= 10 ? 'bg-success' : 'bg-muted'}`} />
                          <span>Document Upload</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${processingState.progress >= 25 ? 'bg-success' : 'bg-muted'}`} />
                          <span>OCR Text Extraction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${processingState.progress >= 50 ? 'bg-success' : 'bg-muted'}`} />
                          <span>CV Validation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${processingState.progress >= 75 ? 'bg-success' : 'bg-muted'}`} />
                          <span>AI Skill Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${processingState.progress >= 100 ? 'bg-success' : 'bg-muted'}`} />
                          <span>Complete</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  onClick={processDocument}
                  disabled={!selectedFile || (processingState.stage !== 'idle' && processingState.stage !== 'complete' && processingState.stage !== 'error')}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  {processingState.stage === 'idle' || processingState.stage === 'complete' || processingState.stage === 'error' ? (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Analyze with AI
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            {analysisResult ? (
              <>
                {/* Validation Status */}
                <Card className={`border-2 ${analysisResult.isValid ? 'border-success' : 'border-destructive'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      {analysisResult.isValid ? (
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {analysisResult.isValid ? '✅ Valid CV Detected' : '❌ Invalid Document'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {analysisResult.isValid 
                            ? 'Document successfully validated and analyzed' 
                            : 'Please upload a proper CV/Resume'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {analysisResult.isValid && (
                  <>
                    {/* Overall Score */}
                    <Card className="bg-gradient-primary text-white border-0 shadow-glow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Sparkles className="h-8 w-8 mx-auto mb-2" />
                          <h3 className="text-sm font-medium mb-2 text-white/80">Overall Score</h3>
                          <div className="text-5xl font-bold mb-2">
                            {analysisResult.overallScore}%
                          </div>
                          <p className="text-sm text-white/90">
                            {analysisResult.skills.length} skills identified
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-success" />
                          <div className="text-2xl font-bold">
                            {analysisResult.insights.filter(i => i.category === 'strength').length}
                          </div>
                          <p className="text-xs text-muted-foreground">Strengths</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <Target className="h-6 w-6 mx-auto mb-2 text-accent" />
                          <div className="text-2xl font-bold">
                            {analysisResult.insights.filter(i => i.category === 'recommendation').length}
                          </div>
                          <p className="text-xs text-muted-foreground">Recommendations</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Skills Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {analysisResult.skills.slice(0, 5).map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <Badge variant={skill.isExplicit ? "default" : "secondary"}>
                              {skill.confidence}%
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Button 
                      onClick={() => navigate("/dashboard", { state: { analysisResult } })}
                      className="w-full bg-primary hover:bg-primary/90 h-12"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      View Full Analysis
                    </Button>
                  </>
                )}

                {!analysisResult.isValid && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {analysisResult.summary}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Upload and analyze your CV to see results here
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Features Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">OCR Technology</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract text from images and scanned documents automatically
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">AI Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically detects and validates CV format and structure
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Skill Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify explicit and implicit skills with confidence scores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Upload;
