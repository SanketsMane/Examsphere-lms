"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitSessionFeedback } from "@/app/actions/session-feedback";

/**
 * Session Feedback Form Component
 * Author: Sanket
 */

interface FeedbackFormProps {
    sessionId: string;
    onSuccess?: () => void;
    initialRating?: number;
    initialComment?: string;
}

export function FeedbackForm({ sessionId, onSuccess, initialRating = 0, initialComment = "" }: FeedbackFormProps) {
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState(initialComment);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitSessionFeedback({
                sessionId,
                rating,
                comment
            });

            if (result.success) {
                toast.success("Thank you for your feedback!");
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Failed to submit feedback");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <p className="text-sm font-medium">How was your session?</p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="bg-transparent border-none p-0 focus:outline-none"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                        >
                            <Star
                                className={`h-8 w-8 transition-colors ${
                                    star <= (hover || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Any additional comments? (Optional)</p>
                <Textarea
                    placeholder="Tell us what you liked or how we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
            >
                {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
        </div>
    );
}
