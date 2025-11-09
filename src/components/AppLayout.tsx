import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Brain, LayoutDashboard, Target, Briefcase, Users, Upload, BookOpen, BarChart3, Menu, Sparkles, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "My Skills", path: "/skill-comparison" },
    { icon: Target, label: "Career Goals", path: "/goals" },
    { icon: Briefcase, label: "Job Matches", path: "/jobs" },
    { icon: Users, label: "Team Matrix", path: "/team" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    navigate("/auth");
  };

  const handleAddSource = (source: string) => {
    toast({
      title: "Source Added",
      description: `${source} source has been processed successfully`,
    });
    setIsAddSourceOpen(false);
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar-background to-forest-dark border-r border-sidebar-border relative overflow-hidden">
      {/* Neural network pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, hsl(45 95% 60% / 0.1) 1px, transparent 1px),
                           radial-gradient(circle at 70% 60%, hsl(195 85% 55% / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="relative">
            <Brain className="h-8 w-8 text-amber-500 group-hover:text-amber-400 transition-colors" />
            <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block">
              SkillSense
            </span>
            <span className="text-xs text-white/70">Growth Ecosystem</span>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 p-4 space-y-2">
        {navItems.map((item, idx) => {
          const active = isActive(item.path);
          return (
            <div key={item.path} className="relative">
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-amber rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Button
                variant="ghost"
                className={`relative w-full justify-start gap-3 ${
                  active
                    ? "text-forest-dark font-semibold"
                    : "text-white/95 hover:bg-sidebar-accent/50 hover:text-white"
                }`}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
              >
                <item.icon className={`h-5 w-5 ${active ? "animate-pulse" : ""}`} />
                {item.label}
                {active && (
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-forest-dark animate-pulse" />
                )}
              </Button>
            </div>
          );
        })}
      </nav>

      <div className="relative p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <Button
          variant="ghost"
          className="w-full gap-2 text-white/95 hover:bg-sidebar-accent/50 hover:text-white border border-sidebar-border/50 hover:border-amber-500/30"
          onClick={() => navigate("/guide")}
        >
          <BookOpen className="h-4 w-4" />
          Growth Guide
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed h-screen">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar isMobile />
                </SheetContent>
              </Sheet>

              <div className="lg:hidden flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="font-bold text-foreground">SkillSense</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Cultivate Skills Button */}
              <Dialog open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-amber text-forest-dark hover:shadow-glow animate-pulse-soft">
                    <Upload className="h-4 w-4" />
                    Cultivate Skills
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl glass-effect border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Cultivate New Skills
                    </DialogTitle>
                    <DialogDescription>
                      Connect a growth source to expand your skill ecosystem
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="cv" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="cv">CV/Resume</TabsTrigger>
                      <TabsTrigger value="github">GitHub</TabsTrigger>
                      <TabsTrigger value="blog">Blog/URL</TabsTrigger>
                      <TabsTrigger value="review">Review</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cv" className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, DOCX (Max 10MB)
                        </p>
                      </div>
                      <Button onClick={() => handleAddSource("CV")} className="w-full">
                        Upload & Analyze
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="github" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub Username</Label>
                        <Input id="github" placeholder="yourusername" />
                      </div>
                      <Button onClick={() => handleAddSource("GitHub")} className="w-full">
                        Connect & Analyze
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="blog" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="url">Blog or Website URL</Label>
                        <Input id="url" type="url" placeholder="https://yourblog.com" />
                      </div>
                      <Button onClick={() => handleAddSource("Blog")} className="w-full">
                        Analyze URL
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="review" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="review">Performance Review Text</Label>
                        <Textarea 
                          id="review" 
                          placeholder="Paste your performance review text here..."
                          className="min-h-[150px]"
                        />
                      </div>
                      <Button onClick={() => handleAddSource("Performance Review")} className="w-full">
                        Analyze Review
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">My Account</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
