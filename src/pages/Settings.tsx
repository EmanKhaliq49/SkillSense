import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, User, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [privacyLevel, setPrivacyLevel] = useState<"private" | "organization" | "public">("private");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (data) {
      setProfile(data);
      setPrivacyLevel(data.privacy_default || "private");
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          job_title: profile.job_title,
          privacy_default: privacyLevel,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "✅ Settings saved",
        description: "Your preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  if (authLoading || !profile) {
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
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account and privacy preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={profile.job_title || ""}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your skill profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup 
                  value={privacyLevel} 
                  onValueChange={(value) => setPrivacyLevel(value as "private" | "organization" | "public")}
                >
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="private" id="private" />
                    <div className="flex-1">
                      <Label htmlFor="private" className="font-semibold cursor-pointer">
                        Private
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Only you can see your complete skill profile
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="organization" id="organization" />
                    <div className="flex-1">
                      <Label htmlFor="organization" className="font-semibold cursor-pointer">
                        Organization
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Visible to members of your organization for team analysis
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="public" id="public" />
                    <div className="flex-1">
                      <Label htmlFor="public" className="font-semibold cursor-pointer">
                        Public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Visible to everyone, including recruiters and job matching
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Show in job matching</div>
                    <div className="text-sm text-muted-foreground">
                      Allow your profile to be matched with relevant job opportunities
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Anonymous team analysis</div>
                    <div className="text-sm text-muted-foreground">
                      Contribute to team insights without revealing your identity
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between"
          >
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>

            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
