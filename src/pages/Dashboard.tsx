import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MentalHealthCard from "@/components/dashboard/MentalHealthCard";
import ExamTrackerCard from "@/components/dashboard/ExamTrackerCard";

interface DashboardProps {
  user: any;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [wellnessPoints, setWellnessPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWellnessPoints();
  }, [user]);

  const fetchWellnessPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("wellness_points")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setWellnessPoints(data?.wellness_points || 0);
    } catch (error: any) {
      console.error("Error fetching wellness points:", error);
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        try {
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              name: user.user_metadata?.name || user.email,
              email: user.email,
              wellness_points: 0,
            });

          if (createError) throw createError;
          setWellnessPoints(0);
        } catch (createError: any) {
          console.error("Error creating profile:", createError);
          toast({
            title: "Error",
            description: "Failed to initialize user profile",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWellnessPointsUpdate = () => {
    fetchWellnessPoints();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <DashboardHeader user={user} wellnessPoints={wellnessPoints} />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.name || "Student"}! 👋
          </h2>
          <p className="text-muted-foreground">
            How are you feeling today? Let's track your mental wellness and academic progress.
          </p>
        </motion.div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MentalHealthCard 
            userId={user.id} 
            onWellnessPointsUpdate={handleWellnessPointsUpdate}
          />
          
          <ExamTrackerCard 
            userId={user.id}
            onWellnessPointsUpdate={handleWellnessPointsUpdate}
          />
        </div>

        {/* Additional Motivation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border"
        >
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              💪 Daily Motivation
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              "Success is not final, failure is not fatal: it is the courage to continue that counts. 
              Keep track of your mental wellness and academic goals - you're doing great!"
            </p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span>🎯 Stay focused</span>
              <span>•</span>
              <span>🧘‍♀️ Practice mindfulness</span>
              <span>•</span>
              <span>📚 Achieve your goals</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;