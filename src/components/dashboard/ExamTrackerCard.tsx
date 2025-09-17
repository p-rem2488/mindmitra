import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Calendar, Target, Trophy, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddExamModal from "./AddExamModal";

interface Exam {
  id: string;
  subject: string;
  date: string;
  max_marks: number;
  target_marks: number;
  obtained_marks: number | null;
  created_at: string;
}

interface ExamTrackerCardProps {
  userId: string;
  onWellnessPointsUpdate: () => void;
}

const ExamTrackerCard = ({ userId, onWellnessPointsUpdate }: ExamTrackerCardProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, [userId]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      console.error("Error fetching exams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExamAdded = () => {
    fetchExams();
    onWellnessPointsUpdate();
    setIsModalOpen(false);
  };

  const getTimeUntilExam = (examDate: string) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Past";
    if (diffDays === 0) return "Today!";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const getProgressPercentage = (obtained: number | null, target: number) => {
    if (obtained === null) return 0;
    return Math.min((obtained / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const upcomingExams = exams.filter(exam => new Date(exam.date) >= new Date());
  const completedExams = exams.filter(exam => exam.obtained_marks !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="h-full shadow-xl border-0 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-6 h-6 text-primary" />
              📚 Exam Tracker
            </CardTitle>
            <Button 
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Exam
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{upcomingExams.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming Exams</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{completedExams.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No exams added yet</p>
              <p className="text-sm">Add your first exam to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {exams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{exam.subject}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant={getTimeUntilExam(exam.date) === "Past" ? "secondary" : "default"}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeUntilExam(exam.date)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-500" />
                        Target: {exam.target_marks}/{exam.max_marks}
                      </div>
                      {exam.obtained_marks !== null && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          Scored: {exam.obtained_marks}/{exam.max_marks}
                        </div>
                      )}
                    </div>

                    {exam.obtained_marks !== null ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress vs Target</span>
                          <span>
                            {Math.round(getProgressPercentage(exam.obtained_marks, exam.target_marks))}%
                          </span>
                        </div>
                        <Progress 
                          value={getProgressPercentage(exam.obtained_marks, exam.target_marks)}
                          className="h-2"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target Progress</span>
                          <span>{Math.round((exam.target_marks / exam.max_marks) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(exam.target_marks / exam.max_marks) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExamAdded={handleExamAdded}
        userId={userId}
      />
    </motion.div>
  );
};

export default ExamTrackerCard;