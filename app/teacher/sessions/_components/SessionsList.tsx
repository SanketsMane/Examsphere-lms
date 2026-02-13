"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  DollarSign,
  MoreVertical,
  Video,
  Edit,
  Trash2,
  XCircle,
  RefreshCcw,
  User,
  FileText,
  CheckCircle2,
  UserX
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { updateSessionStatus } from "@/app/actions/teacher-sessions";
import Link from "next/link";
import { toast } from "sonner";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added to fetch user country - Author: Sanket

interface Session {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  scheduledAt: string;
  duration: number;
  price: number;
  status: string;
  timezone: string;
  student?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  meetingUrl?: string;
  rescheduleCount: number;
  maxReschedules: number;
  cancelledBy?: string;
  cancellationReason?: string;
  refundAmount?: number;
}

interface SessionsListProps {
  status?: string;
  filter?: 'all' | 'booked' | 'available';
}

export function SessionsList({ status, filter = 'all' }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("India");

  useEffect(() => {
    fetchSessions();
    const fetchUser = async () => {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUserCountry((session.user as any).country || "India");
      }
    };
    fetchUser();
  }, [status, filter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      
      const response = await fetch(`/api/teacher/sessions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      let filteredSessions = data.sessions;

      // Apply additional filters
      if (filter === 'booked') {
        filteredSessions = filteredSessions.filter((s: Session) => s.student !== null);
      } else if (filter === 'available') {
        filteredSessions = filteredSessions.filter((s: Session) => s.student === null);
      }

      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/teacher/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete session');
      }

      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSessionToDelete(null);
    }
  };

  const handleCancel = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/teacher/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Cancelled by teacher'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel session');
      }

      const data = await response.json();
      toast.success(`Session cancelled. ${data.refundPolicy === 'full' ? 'Full refund issued' : data.refundPolicy === 'partial' ? 'Partial refund issued' : 'No refund applicable'}`);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSessionToCancel(null);
    }
  };

  const handleStatusUpdate = async (sessionId: string, status: 'completed' | 'no_show') => {
    try {
      const result = await updateSessionStatus(sessionId, status);
      if (result.success) {
        toast.success(`Session marked as ${status}`);
        fetchSessions();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const formatCurrency = (cents: number) => {
    return formatPriceSimple(cents, userCountry);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
          <p className="text-muted-foreground mb-6">
            {filter === 'available' 
              ? "You haven't created any available session slots yet."
              : filter === 'booked'
              ? "No booked sessions at the moment."
              : "No sessions to display."}
          </p>
          <Link href="/teacher/sessions/create">
            <Button>Create Your First Session</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <Badge variant={
                          session.status === 'scheduled' ? 'default' :
                          session.status.toLowerCase() === 'completed' ? 'secondary' :
                          'destructive'
                        }>
                          {session.status}
                        </Badge>
                        {session.subject && (
                          <Badge variant="outline">{session.subject}</Badge>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/sessions/${session.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        
                        {!session.student && session.status.toLowerCase() === 'scheduled' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/sessions/${session.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {session.student && session.status === 'scheduled' && session.rescheduleCount < session.maxReschedules && (
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/sessions/${session.id}/reschedule`}>
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Reschedule
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {session.student && session.status === 'scheduled' && (
                          <>
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleStatusUpdate(session.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleStatusUpdate(session.id, 'no_show')}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Mark No-Show
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        {!session.student && session.status === 'scheduled' && (
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => setSessionToCancel(session.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Session
                          </DropdownMenuItem>
                        )}

                        {!session.student && session.status.toLowerCase() === 'scheduled' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setSessionToDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(session.scheduledAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(session.scheduledAt), 'hh:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{session.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>{formatCurrency(session.price)}</span>
                    </div>
                  </div>

                  {/* Student Info & Start Action */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {session.student ? (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.student.image} />
                          <AvatarFallback>
                            {session.student.name?.substring(0, 2).toUpperCase() || 'ST'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{session.student.name}</p>
                          <p className="text-xs text-muted-foreground">{session.student.email}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Available for booking</span>
                      </div>
                    )}
                    
                    {session.status === 'scheduled' && (
                      <Link href={`/video-call/${session.id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          <Video className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Cancellation Reason */}
                  {session.status.toLowerCase() === 'cancelled' && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-destructive flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4" />
                        Session Cancelled {session.cancelledBy ? `by ${session.cancelledBy}` : ''}
                      </p>
                      {session.cancellationReason && (
                        <p className="text-muted-foreground">Reason: {session.cancellationReason}</p>
                      )}
                      {session.refundAmount !== undefined && session.refundAmount !== null && session.refundAmount > 0 && (
                        <p className="text-muted-foreground mt-1">Refund issued: {formatCurrency(session.refundAmount)}</p>
                      )}
                    </div>
                  )}

                  {/* Time Until Session */}
                  {session.status === 'scheduled' && new Date(session.scheduledAt) > new Date() && (
                    <div className="text-xs text-muted-foreground">
                      Starts {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleDelete(sessionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!sessionToCancel} onOpenChange={() => setSessionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booked Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the session and issue a refund to the student based on the cancellation policy.
              Cancellations less than 24 hours before the session may not be refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToCancel && handleCancel(sessionToCancel)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
