import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamAdded: () => void;
  userId: string;
}

const AddExamModal = ({ isOpen, onClose, onExamAdded, userId }: AddExamModalProps) => {
  const [formData, setFormData] = useState({
    subject: "",
    date: null as Date | null,
    maxMarks: "",
    targetMarks: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.date || !formData.maxMarks || !formData.targetMarks) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const maxMarks = parseInt(formData.maxMarks);
    const targetMarks = parseInt(formData.targetMarks);

    if (targetMarks > maxMarks) {
      toast({
        title: "Error",
        description: "Target marks cannot be higher than maximum marks",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("exams")
        .insert({
          user_id: userId,
          subject: formData.subject,
          date: formData.date.toISOString().split('T')[0],
          max_marks: maxMarks,
          target_marks: targetMarks,
        });

      if (error) throw error;

      // Update wellness points by fetching current points and incrementing
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("wellness_points")
        .eq("user_id", userId)
        .single();

      const newPoints = (currentProfile?.wellness_points || 0) + 2;
      
      await supabase
        .from("profiles")
        .update({ wellness_points: newPoints })
        .eq("user_id", userId);

      toast({
        title: "Exam added successfully!",
        description: "+2 wellness points for staying organized!",
      });

      setFormData({
        subject: "",
        date: null,
        maxMarks: "",
        targetMarks: "",
      });

      onExamAdded();
    } catch (error: any) {
      console.error("Error adding exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add exam",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: "",
      date: null,
      maxMarks: "",
      targetMarks: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Exam</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics, Physics, etc."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Exam Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date || undefined}
                  onSelect={(date) => setFormData({ ...formData, date })}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMarks">Maximum Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                placeholder="100"
                min="1"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMarks">Target Marks</Label>
              <Input
                id="targetMarks"
                type="number"
                placeholder="85"
                min="1"
                value={formData.targetMarks}
                onChange={(e) => setFormData({ ...formData, targetMarks: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Exam"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExamModal;