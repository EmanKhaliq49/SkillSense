import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Github, FileText, Globe, Award } from "lucide-react";

interface SkillNodeProps {
  name: string;
  proficiency: number;
  category: string;
  sources: string[];
  isExpert?: boolean;
  onClick?: () => void;
}

const SkillNode = ({ name, proficiency, category, sources, isExpert, onClick }: SkillNodeProps) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github": return <Github className="h-3 w-3" />;
      case "cv": return <FileText className="h-3 w-3" />;
      case "blog": return <Globe className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Technical": return "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30";
      case "Soft Skills": return "from-amber-500/20 to-amber-600/20 border-amber-500/30";
      case "Domain": return "from-primary/20 to-primary/30 border-primary/30";
      default: return "from-muted/20 to-muted/30 border-border";
    }
  };

  const size = isExpert ? "large" : proficiency >= 70 ? "medium" : "small";
  const sizeClasses = {
    large: "w-40 h-40",
    medium: "w-32 h-32",
    small: "w-24 h-24"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative cursor-pointer ${sizeClasses[size]} flex-shrink-0`}
    >
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-node opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`}
        style={{ 
          background: proficiency >= 80 
            ? 'radial-gradient(circle, hsl(45 95% 60% / 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsl(195 85% 55% / 0.3) 0%, transparent 70%)'
        }}
      />

      {/* Node */}
      <div 
        className={`relative group glass-effect rounded-full ${sizeClasses[size]} flex flex-col items-center justify-center gap-2 border-2 bg-gradient-to-br ${getCategoryColor(category)} hover:shadow-glow transition-all duration-300`}
      >
        {isExpert && (
          <Award className="absolute -top-2 -right-2 h-6 w-6 text-amber-500 animate-pulse-soft" />
        )}

        <span className="text-sm font-semibold text-center px-2 line-clamp-2">
          {name}
        </span>

        {/* Proficiency ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted opacity-20"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${proficiency * 2.8}, 1000`}
            className={proficiency >= 80 ? "text-amber-500" : "text-cyan-500"}
          />
        </svg>

        <div className="absolute bottom-2 flex gap-1">
          {sources.map((source, idx) => (
            <div 
              key={idx}
              className="w-5 h-5 rounded-full bg-card/50 backdrop-blur flex items-center justify-center"
            >
              {getSourceIcon(source)}
            </div>
          ))}
        </div>

        <Badge 
          variant="secondary" 
          className="absolute -bottom-3 text-xs bg-card/80 backdrop-blur"
        >
          {proficiency}%
        </Badge>
      </div>
    </motion.div>
  );
};

export default SkillNode;
