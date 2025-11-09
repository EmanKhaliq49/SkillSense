import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Target, Plus, Trash2, CheckCircle, Clock, Pause, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Goal {
  id: string;
  title: string;
  description: string;
  target_skills: string[];
  timeline: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress: number;
  target_date: string;
  created_at: string;
}

export default function Goals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    target_skills: "",
    timeline: "3-months",
    target_date: ""
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('career_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data as Goal[]) || []);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      const skills = newGoal.target_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('career_goals').insert({
        user_id: user.id,
        title: newGoal.title,
        description: newGoal.description,
        target_skills: skills,
        timeline: newGoal.timeline,
        target_date: newGoal.target_date || null,
        status: 'active',
        progress: 0
      });

      if (error) throw error;

      toast({
        title: "✅ Goal Created!",
        description: "Your career goal has been added",
      });

      setIsDialogOpen(false);
      setNewGoal({
        title: "",
        description: "",
        target_skills: "",
        timeline: "3-months",
        target_date: ""
      });
      fetchGoals();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('career_goals')
        .update({ progress, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (error) throw error;
      
      fetchGoals();
      toast({
        title: "Progress Updated",
        description: `Goal progress set to ${progress}%`,
      });
    } catch (error: any) {
      console.error('Error updating progress:', error);
    }
  };

  const updateGoalStatus = async (goalId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('career_goals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (error) throw error;
      
      fetchGoals();
      toast({
        title: "Status Updated",
        description: `Goal status changed to ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('career_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      
      fetchGoals();
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed",
      });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'paused': return 'bg-muted';
      case 'archived': return 'bg-muted-foreground';
      default: return 'bg-primary';
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
            <Button variant="outline" onClick={() => navigate("/learning-path")}>
              Learning Path
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Career Goals
              </h1>
              <p className="text-muted-foreground text-lg">
                Set and track your professional development objectives
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>
                    Define a career goal and track your progress towards it
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-title">Goal Title *</Label>
                    <Input
                      id="goal-title"
                      placeholder="e.g., Master React and TypeScript"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="goal-description">Description *</Label>
                    <Textarea
                      id="goal-description"
                      placeholder="Describe your goal and why it's important..."
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-skills">Target Skills</Label>
                    <Input
                      id="target-skills"
                      placeholder="React, TypeScript, Node.js (comma-separated)"
                      value={newGoal.target_skills}
                      onChange={(e) => setNewGoal({ ...newGoal, target_skills: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline</Label>
                      <Select value={newGoal.timeline} onValueChange={(value) => setNewGoal({ ...newGoal, timeline: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-month">1 Month</SelectItem>
                          <SelectItem value="3-months">3 Months</SelectItem>
                          <SelectItem value="6-months">6 Months</SelectItem>
                          <SelectItem value="1-year">1 Year</SelectItem>
                          <SelectItem value="long-term">Long-term</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-date">Target Date</Label>
                      <Input
                        id="target-date"
                        type="date"
                        value={newGoal.target_date}
                        onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleCreateGoal} className="w-full">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Goals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first career goal
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{goal.title}</CardTitle>
                          <Badge variant="outline" className={`${getStatusColor(goal.status)} text-white`}>
                            {getStatusIcon(goal.status)}
                            <span className="ml-1">{goal.status}</span>
                          </Badge>
                        </div>
                        <CardDescription>{goal.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.target_skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Target Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {goal.target_skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="text-muted-foreground">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Select value={goal.progress.toString()} onValueChange={(value) => updateGoalProgress(goal.id, parseInt(value))}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Update Progress" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="25">25%</SelectItem>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="100">100%</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={goal.status} onValueChange={(value) => updateGoalStatus(goal.id, value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>

                      {goal.target_date && (
                        <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
