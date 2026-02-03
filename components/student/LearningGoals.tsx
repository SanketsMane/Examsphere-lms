"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { createLearningGoal, addMilestone, toggleMilestone } from "@/app/actions/learning-goals";
import { toast } from "sonner";

/**
 * Learning Goals Component
 * Author: Sanket
 */

interface LearningGoalsProps {
    goals: any[];
}

export function LearningGoals({ goals }: LearningGoalsProps) {
    const [newGoal, setNewGoal] = useState("");
    const [creating, setCreating] = useState(false);
    const [addingMilestoneTo, setAddingMilestoneTo] = useState<string | null>(null);
    const [milestoneTitle, setMilestoneTitle] = useState("");

    const handleCreateGoal = async () => {
        if (!newGoal.trim()) return;
        setCreating(true);
        try {
            const res = await createLearningGoal({ title: newGoal });
            if (res.success) {
                setNewGoal("");
                toast.success("Goal created!");
            } else {
                toast.error(res.error);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleAddMilestone = async (goalId: string) => {
        if (!milestoneTitle.trim()) return;
        try {
            const res = await addMilestone(goalId, milestoneTitle);
            if (res.success) {
                setMilestoneTitle("");
                setAddingMilestoneTo(null);
                toast.success("Milestone added!");
            }
        } catch (error) {
            toast.error("Failed to add milestone");
        }
    };

    const handleToggleMilestone = async (id: string, completed: boolean) => {
        try {
            await toggleMilestone(id, completed);
        } catch (error) {
            toast.error("Failed to update milestone");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Input
                    placeholder="E.g., Complete Advanced React Course"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGoal()}
                />
                <Button onClick={handleCreateGoal} disabled={creating || !newGoal.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                </Button>
            </div>

            <div className="space-y-4">
                {goals.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground italic">No goals set yet. Start by adding one above!</p>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{goal.title}</h3>
                                <Badge variant={goal.status === 'completed' ? 'success' : 'secondary'}>
                                    {goal.status}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                {goal.milestones.map((ms: any) => (
                                    <div key={ms.id} className="flex items-center gap-3 pl-2">
                                        <Checkbox 
                                            id={ms.id} 
                                            checked={ms.isCompleted} 
                                            onCheckedChange={(checked) => handleToggleMilestone(ms.id, checked === true)}
                                        />
                                        <label 
                                            htmlFor={ms.id} 
                                            className={`text-sm ${ms.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                                        >
                                            {ms.title}
                                        </label>
                                    </div>
                                ))}
                                
                                {addingMilestoneTo === goal.id ? (
                                    <div className="flex gap-2 pl-2 mt-2">
                                        <Input
                                            className="h-8"
                                            placeholder="Milestone title..."
                                            value={milestoneTitle}
                                            onChange={(e) => setMilestoneTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(goal.id)}
                                            autoFocus
                                        />
                                        <Button size="sm" className="h-8 px-2" onClick={() => handleAddMilestone(goal.id)}>
                                            Add
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setAddingMilestoneTo(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-primary hover:text-primary h-8 p-0 pl-2"
                                        onClick={() => setAddingMilestoneTo(goal.id)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Milestone
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'success' | 'secondary' | 'outline' }) {
    const colors = {
        success: "bg-green-100 text-green-800 border-green-200",
        secondary: "bg-blue-100 text-blue-800 border-blue-200",
        outline: "border-muted text-muted-foreground"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[variant]}`}>
            {children}
        </span>
    );
}
