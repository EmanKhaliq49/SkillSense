import { motion } from "framer-motion";

interface GrowthPathLineProps {
  progress: number;
  milestones?: Array<{ position: number; label: string; completed: boolean }>;
}

const GrowthPathLine = ({ progress, milestones = [] }: GrowthPathLineProps) => {
  return (
    <div className="relative w-full h-24">
      {/* Background path */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M 0 60 Q 25 40, 50 60 T 100 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted opacity-30"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>

      {/* Progress path */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45 95% 60%)" />
            <stop offset="100%" stopColor="hsl(195 85% 55%)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0 60 Q 25 40, 50 60 T 100 60"
          fill="none"
          stroke="url(#path-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          className="drop-shadow-glow"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>

      {/* Milestones */}
      {milestones.map((milestone, idx) => (
        <motion.div
          key={idx}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
          className="absolute"
          style={{
            left: `${milestone.position}%`,
            top: milestone.position % 2 === 0 ? "40%" : "60%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className={`w-4 h-4 rounded-full border-2 ${
            milestone.completed 
              ? "bg-amber-500 border-amber-400 shadow-glow animate-pulse-glow" 
              : "bg-card border-muted-foreground/30"
          }`} />
          <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground">
            {milestone.label}
          </span>
        </motion.div>
      ))}

      {/* Current position indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        className="absolute"
        style={{
          left: `${progress}%`,
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-gradient-amber shadow-node animate-pulse-glow" />
          <div className="absolute inset-0 rounded-full bg-amber-500/50 animate-ping" />
        </div>
      </motion.div>
    </div>
  );
};

export default GrowthPathLine;
