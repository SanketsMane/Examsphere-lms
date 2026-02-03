"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Clock, Calendar, Trophy, Target, Award } from "lucide-react";
import { ProgressCharts } from "./ProgressCharts";
import { LearningGoals } from "./LearningGoals";
import { AchievementShowcase } from "./AchievementShowcase";
import { CertificatesSection } from "./CertificatesSection";

/**
 * Student Progress Dashboard Component
 * Author: Sanket
 */

export function ProgressDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/student/progress");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch progress data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return <div>Failed to load progress data</div>;

    const { progress, goals, recentSessions } = data;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">Booked sessions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attended</CardTitle>
                        <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress.attendedSessions}</div>
                        <p className="text-xs text-muted-foreground">Successfully completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress.totalHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Time spent learning</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Course Comp.</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress.coursesCompleted}</div>
                        <p className="text-xs text-muted-foreground">Full courses finished</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Learning Activity</CardTitle>
                        <CardDescription>Session hours over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ProgressCharts data={recentSessions} />
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Current Level</CardTitle>
                        <CardDescription>Your learning journey</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-lg px-4 py-1">
                                {progress.currentLevel}
                            </Badge>
                            <div className="text-right">
                                <span className="text-sm font-medium text-muted-foreground">Points: </span>
                                <span className="text-lg font-bold">{progress.points}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Next Level Progress</span>
                                <span>{Math.min(100, (progress.points % 1000) / 10)}%</span>
                            </div>
                            <Progress value={(progress.points % 1000) / 10} className="h-2" />
                        </div>

                        <div className="pt-4 border-t space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Recent Achievements
                            </h4>
                            <p className="text-xs text-muted-foreground italic">Complete tasks to unlock badges!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <CardTitle>Certificates</CardTitle>
                    </div>
                    <CardDescription>Verified proof of your accomplishments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CertificatesSection 
                        studentName={data.userName || "Student"} 
                        completedCourses={[]} // Will be populated when course completion logic is added
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <CardTitle>Your Achievements</CardTitle>
                    </div>
                    <CardDescription>Badges earned throughout your learning journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AchievementShowcase achievements={data.userAchievements || []} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <CardTitle>Learning Goals & Milestones</CardTitle>
                    </div>
                    <CardDescription>Track what you want to achieve next.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LearningGoals goals={goals} />
                </CardContent>
            </Card>
        </div>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
