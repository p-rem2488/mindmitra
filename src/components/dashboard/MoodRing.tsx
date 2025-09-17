import { motion } from "framer-motion";

interface MoodRingProps {
  mood: string;
  size?: number;
}

const MOOD_COLORS = {
  Calm: "#0077FF",
  Motivated: "#00C851", 
  Happy: "#FFDD00",
  Stressed: "#FF3D00",
  Lonely: "#9B59B6",
};

const MoodRing = ({ mood, size = 120 }: MoodRingProps) => {
  const color = MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || "#6B7280";
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <motion.div
        className="relative rounded-full border-4 border-background shadow-lg"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.div
          className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        
        <motion.div
          className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5,
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xl font-bold text-white drop-shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {mood === "Happy" ? "😊" : 
             mood === "Calm" ? "😌" :
             mood === "Motivated" ? "💪" :
             mood === "Stressed" ? "😰" :
             mood === "Lonely" ? "😔" : "😐"}
          </motion.span>
        </div>
      </motion.div>
      
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-lg font-semibold text-foreground">{mood}</p>
        <p className="text-sm text-muted-foreground">Current Mood</p>
      </motion.div>
    </div>
  );
};

export default MoodRing;