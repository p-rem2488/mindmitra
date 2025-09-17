import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Wind, Heart, Lightbulb, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MoodRing from "./MoodRing";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MentalHealthCardProps {
  userId: string;
  onWellnessPointsUpdate: () => void;
}

const MentalHealthCard = ({ userId, onWellnessPointsUpdate }: MentalHealthCardProps) => {
  const [journalText, setJournalText] = useState("");
  const [currentMood, setCurrentMood] = useState("Calm");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! I'm MindMitra, your mental health companion. How are you feeling today? Feel free to share your thoughts or just say hello!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLatestMood();
  }, [userId]);

  const fetchLatestMood = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("mood_name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentMood(data[0].mood_name || "Calm");
      }
    } catch (error) {
      console.error("Error fetching mood:", error);
    }
  };

  const analyzeMood = (text: string): { mood: string; score: number } => {
    const lowerText = text.toLowerCase();
    
    const moodKeywords = {
      Happy: ["happy", "joy", "excited", "great", "awesome", "wonderful", "amazing", "fantastic", "good", "positive", "cheerful"],
      Calm: ["calm", "peaceful", "relaxed", "serene", "tranquil", "quiet", "content", "balanced", "zen", "steady"],
      Motivated: ["motivated", "determined", "focused", "energetic", "productive", "driven", "ambitious", "goal", "achieve", "success"],
      Stressed: ["stressed", "anxious", "worried", "overwhelmed", "pressure", "deadline", "exam", "nervous", "tense", "frustrated"],
      Lonely: ["lonely", "alone", "isolated", "sad", "depressed", "empty", "disconnected", "missing", "solitary", "withdrawn"]
    };

    let maxScore = 0;
    let detectedMood = "Calm";

    Object.entries(moodKeywords).forEach(([mood, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 1;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        detectedMood = mood;
      }
    });

    const moodScoreMap = { Calm: 1, Motivated: 2, Happy: 3, Stressed: 4, Lonely: 5 };
    return { 
      mood: detectedMood, 
      score: moodScoreMap[detectedMood as keyof typeof moodScoreMap] 
    };
  };

  const handleJournalSubmit = async () => {
    if (!journalText.trim()) return;

    setIsLoading(true);
    try {
      const { mood, score } = analyzeMood(journalText);
      
      // Save journal entry
      const { error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          content: journalText,
          mood_score: score,
          mood_name: mood,
        });

      if (journalError) throw journalError;

      // Update wellness points by fetching current points and incrementing
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("wellness_points")
        .eq("user_id", userId)
        .single();

      const newPoints = (currentProfile?.wellness_points || 0) + 5;
      
      const { error: pointsError } = await supabase
        .from("profiles")
        .update({ wellness_points: newPoints })
        .eq("user_id", userId);

      if (pointsError) throw pointsError;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: journalText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Generate AI response
      const response = await supabase.functions.invoke("chat-assistant", {
        body: { message: journalText, mood: mood },
      });

      if (response.error) throw response.error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentMood(mood);
      setJournalText("");
      onWellnessPointsUpdate();

      toast({
        title: "Journal saved!",
        description: `Mood detected: ${mood}. +5 wellness points earned!`,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save journal entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    const actionMessages = {
      breathing: "Starting a 5-minute breathing exercise. Breathe in for 4 counts, hold for 4, breathe out for 6. Focus on your breath and let go of any tension.",
      meditation: "Beginning guided meditation. Find a comfortable position, close your eyes, and focus on the present moment. You're doing great by taking this time for yourself.",
      mindfulness: "Here's a mindfulness prompt: Take a moment to notice 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This grounds you in the present moment."
    };

    const aiMessage: Message = {
      id: Date.now().toString(),
      type: "assistant",
      content: actionMessages[action as keyof typeof actionMessages],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);

    // Update wellness points for completing exercises
    try {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("wellness_points")
        .eq("user_id", userId)
        .single();

      const newPoints = (currentProfile?.wellness_points || 0) + 3;
      
      await supabase
        .from("profiles")
        .update({ wellness_points: newPoints })
        .eq("user_id", userId);
      
      onWellnessPointsUpdate();
      
      toast({
        title: "Great job!",
        description: "+3 wellness points for practicing self-care!",
      });
    } catch (error) {
      console.error("Error updating points:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full shadow-xl border-0 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-primary" />
            🧠 Mental Health Companion
          </CardTitle>
          
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <MoodRing mood={currentMood} size={100} />
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="How are you feeling today? Share your thoughts..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="min-h-[80px] resize-none border-2 focus:border-primary/50"
                maxLength={500}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {journalText.length}/500 characters
                </span>
                <Button 
                  onClick={handleJournalSubmit}
                  disabled={!journalText.trim() || isLoading}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "Analyzing..." : "Share"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Chat Messages */}
          <div className="bg-muted/30 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-4"
                      : "bg-background border shadow-sm mr-4"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("breathing")}
                className="gap-2 h-auto py-3 text-left justify-start"
              >
                <Wind className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">Breathing Exercise</div>
                  <div className="text-xs text-muted-foreground">5 min session</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("meditation")}
                className="gap-2 h-auto py-3 text-left justify-start"
              >
                <Heart className="w-4 h-4 text-pink-500" />
                <div>
                  <div className="font-medium">Guided Meditation</div>
                  <div className="text-xs text-muted-foreground">Relax & focus</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("mindfulness")}
                className="gap-2 h-auto py-3 text-left justify-start"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="font-medium">Mindfulness Prompt</div>
                  <div className="text-xs text-muted-foreground">Present moment</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MentalHealthCard;