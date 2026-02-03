"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star } from "lucide-react";

/**
 * Achievement Showcase Component
 * Author: Sanket
 */

interface AchievementShowcaseProps {
    achievements: any[];
}

export function AchievementShowcase({ achievements }: AchievementShowcaseProps) {
    if (achievements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Award className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground font-medium">No achievements yet</p>
                <p className="text-xs text-muted-foreground">Start attending sessions to unlock rewards!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {achievements.map((ua) => (
                <div 
                    key={ua.id} 
                    className="flex flex-col items-center text-center p-4 border rounded-xl bg-gradient-to-b from-white to-muted/20 hover:shadow-md transition-shadow"
                >
                    <div className="relative mb-3">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Trophy className="h-8 w-8 text-primary shadow-sm" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white">
                            <Star className="h-3 w-3 text-white fill-white" />
                        </div>
                    </div>
                    <h4 className="text-sm font-bold leading-tight">{ua.achievement.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{ua.achievement.description}</p>
                    <div className="mt-2 text-[10px] text-primary font-medium">
                        {new Date(ua.unlockedAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
