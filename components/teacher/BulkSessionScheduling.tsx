"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileDown, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { validateSessionsBatch, createSessionsBatch } from "@/app/actions/bulk-sessions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatPriceSimple, getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

/**
 * Bulk Session Scheduling Component
 * Author: Sanket
 */

interface SessionRow {
    title: string;
    description?: string;
    subject: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm (24h)
    duration: number;
    price: number;
    isFreeTrialEligible?: boolean;
    isValid?: boolean;
    errors?: string[];
}

export function BulkSessionScheduling() {
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const currencyConfig = getCurrencyConfig(userCountry);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const parsedData = results.data.map((row: any) => ({
                    title: row.Title,
                    description: row.Description,
                    subject: row.Subject,
                    date: row.Date,
                    time: row.Time,
                    duration: parseInt(row.Duration) || 60,
                    price: parseInt(row.Price) || 500,
                    isFreeTrialEligible: row.IsFreeTrial === "true" || row.IsFreeTrial === "1",
                }));

                await runValidation(parsedData);
            },
            error: (error) => {
                toast.error("Failed to parse CSV file");
                console.error(error);
            }
        });
    };

    const runValidation = async (data: SessionRow[]) => {
        setValidating(true);
        try {
            // Convert date/time to ISO strings for server action
            const preparedData = data.map(s => {
                const [year, month, day] = s.date.split("-").map(Number);
                const [hour, minute] = s.time.split(":").map(Number);
                const date = new Date(year, month - 1, day, hour, minute);
                return {
                    ...s,
                    scheduledAt: date.toISOString()
                };
            });

            const result = await validateSessionsBatch(preparedData);
            if (result.success && result.results) {
                setSessions(result.results);
                toast.success(`Validated ${result.results.length} sessions`);
            } else {
                toast.error(result.error || "Validation failed");
            }
        } catch (error) {
            toast.error("An error occurred during validation");
        } finally {
            setValidating(false);
        }
    };

    const handleCreate = async () => {
        const validSessions = sessions.filter(s => s.isValid);
        if (validSessions.length === 0) {
            toast.error("No valid sessions to create");
            return;
        }

        setLoading(true);
        try {
            const result = await createSessionsBatch(validSessions);
            if (result.success) {
                toast.success(`Successfully created ${result.count} sessions!`);
                router.push("/teacher/sessions");
            } else {
                toast.error(result.error || "Failed to create sessions");
            }
        } catch (error) {
            toast.error("An error occurred while creating sessions");
        } finally {
            setLoading(false);
        }
    };

    const downloadSampleCSV = () => {
        const csv = Papa.unparse([
            {
                Title: "Introduction to Calculus",
                Description: "Beginners guide to limits and derivatives",
                Subject: "Mathematics",
                Date: "2025-06-15",
                Time: "10:00",
                Duration: "60",
                Price: "1000",
                IsFreeTrial: "false"
            },
            {
                Title: "Physics Laboratory",
                Description: "Hands-on experiment review",
                Subject: "Physics",
                Date: "2025-06-16",
                Time: "14:30",
                Duration: "90",
                Price: "1200",
                IsFreeTrial: "true"
            }
        ]);
        
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bulk_sessions_sample.csv");
        link.click();
    };

    const clearSelection = () => {
        setSessions([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const allValid = sessions.length > 0 && sessions.every(s => s.isValid);
    const someValid = sessions.some(s => s.isValid);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Bulk Schedule Sessions</CardTitle>
                            <CardDescription>Upload a CSV file to schedule multiple sessions at once.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Sample CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div 
                            className="border-2 border-dashed rounded-xl p-12 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer bg-muted/5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Upload Your CSV</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Click here or drag and drop your session data file
                                </p>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept=".csv" 
                                className="hidden" 
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Total Sessions: {sessions.length}</span>
                                        <span className="text-xs text-green-600 font-bold">Valid: {sessions.filter(s => s.isValid).length}</span>
                                    </div>
                                    {sessions.some(s => !s.isValid) && (
                                        <span className="text-xs text-destructive font-bold">Errors Found: {sessions.filter(s => !s.isValid).length}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={clearSelection} disabled={loading}>
                                        <X className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button 
                                        onClick={handleCreate} 
                                        disabled={!someValid || loading || validating}
                                        className="gap-2"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        {loading ? "Creating..." : `Create ${sessions.filter(s => s.isValid).length} Sessions`}
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Status</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((session, idx) => (
                                            <TableRow key={idx} className={!session.isValid ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                                                <TableCell>
                                                    {session.isValid ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <div className="group relative">
                                                            <AlertCircle className="h-5 w-5 text-destructive cursor-help" />
                                                            <div className="absolute left-full ml-2 top-0 bg-destructive text-white p-2 rounded shadow-lg text-xs w-48 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                {session.errors?.join(", ")}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{session.title}</TableCell>
                                                <TableCell className="text-sm">{session.subject}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {session.date} {session.time}
                                                </TableCell>
                                                <TableCell className="text-sm">{session.duration}m</TableCell>
                                                <TableCell className="text-sm font-mono">
                                                    {formatPriceSimple(session.price, userCountry)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {validating && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm z-10 transition-all rounded-xl">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm font-semibold text-primary">Validating sessions...</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileDown className="h-4 w-4 text-blue-600" />
                            CSV Format Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2">
                        <p>Your CSV must include the following headers exactly:</p>
                        <ul className="list-disc pl-4 space-y-1 font-mono">
                            <li><strong>Title</strong> (min 5 chars)</li>
                            <li><strong>Subject</strong> (Mathematics, Physics, etc.)</li>
                            <li><strong>Date</strong> (Format: YYYY-MM-DD)</li>
                            <li><strong>Time</strong> (Format: HH:mm, e.g. 14:30)</li>
                            <li><strong>Price</strong> (Minimum {formatPriceSimple(100, userCountry)})</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Validation Logic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-1">
                        <p>• Automatically checks for time conflicts with your existing schedule.</p>
                        <p>• Ensures sessions are scheduled in the future.</p>
                        <p>• Invalid sessions will be skipped during the creation process.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
