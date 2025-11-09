import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Github, FileText, Globe, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MySkills = () => {
  const [loading] = useState(false);

  // Mock data - replace with real data from your backend
  const skills = [
    {
      name: "React",
      category: "Technical",
      proficiency: "Expert",
      proficiencyLevel: 5,
      sources: ["github", "cv"],
      endorsements: 3,
    },
    {
      name: "Communication",
      category: "Soft Skills",
      proficiency: "Advanced",
      proficiencyLevel: 4,
      sources: ["review"],
      endorsements: 2,
    },
    {
      name: "TypeScript",
      category: "Technical",
      proficiency: "Advanced",
      proficiencyLevel: 4,
      sources: ["github", "cv"],
      endorsements: 2,
    },
    {
      name: "Leadership",
      category: "Soft Skills",
      proficiency: "Intermediate",
      proficiencyLevel: 3,
      sources: ["review"],
      endorsements: 1,
    },
  ];

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github": return <Github className="h-3 w-3" />;
      case "cv": return <FileText className="h-3 w-3" />;
      case "blog": return <Globe className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getProficiencyDots = (level: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className={`w-2 h-2 rounded-full ${
              dot <= level ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const filterSkillsByCategory = (category: string) => {
    if (category === "all") return skills;
    return skills.filter((skill) => skill.category === category);
  };

  interface SkillType {
    name: string;
    category: string;
    proficiency: string;
    proficiencyLevel: number;
    sources: string[];
    endorsements: number;
  }

  const SkillTable = ({ skills }: { skills: SkillType[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Skill</TableHead>
          <TableHead>Proficiency</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Endorsements</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            </TableRow>
          ))
        ) : (
          skills.map((skill, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.name}</span>
                  {skill.proficiencyLevel === 5 && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit">
                    {skill.proficiency}
                  </Badge>
                  {getProficiencyDots(skill.proficiencyLevel)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {skill.sources.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-muted"
                    >
                      {getSourceIcon(source)}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{skill.endorsements}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>View History</DropdownMenuItem>
                    <DropdownMenuItem>Export</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Skills</h1>
        <p className="text-muted-foreground">
          Detailed view of all your identified skills across sources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Inventory</CardTitle>
          <CardDescription>
            Browse and manage your complete skill profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Skills</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="soft">Soft Skills</TabsTrigger>
              <TabsTrigger value="domain">Domain</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <SkillTable skills={filterSkillsByCategory("all")} />
            </TabsContent>

            <TabsContent value="technical" className="mt-6">
              <SkillTable skills={filterSkillsByCategory("Technical")} />
            </TabsContent>

            <TabsContent value="soft" className="mt-6">
              <SkillTable skills={filterSkillsByCategory("Soft Skills")} />
            </TabsContent>

            <TabsContent value="domain" className="mt-6">
              <SkillTable skills={filterSkillsByCategory("Domain")} />
            </TabsContent>

            <TabsContent value="languages" className="mt-6">
              <SkillTable skills={filterSkillsByCategory("Languages")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MySkills;
