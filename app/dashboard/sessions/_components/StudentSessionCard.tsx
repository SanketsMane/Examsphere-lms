import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Video,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  MessageSquare,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { format, formatDistance, isPast, isWithinInterval, addMinutes } from "date-fns";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { generateRecordingSignedUrl } from "@/app/actions/video-call"; // Added for secure downloads - Author: Sanket
import { toast } from "sonner";

interface StudentSessionCardProps {
  booking: {
    id: string;
    status: string;
    amount: number;
    paymentCompletedAt: Date | null;
    cancelledAt: Date | null;
    refundAmount: number | null;
    session: {
      id: string;
      title: string;
      description: string | null;
      subject: string;
      scheduledAt: Date | null;
      duration: number;
      status: string;
      meetingUrl: string | null;
      recordingUrl: string | null;
      studentRating: number | null;
      cancelledBy: string | null;
      cancellationReason: string | null;
      teacher: {
        user: {
          id: string; // Added for messaging
          name: string;
          image: string | null;
        };
      };
    };
  };
}

export function StudentSessionCard({ booking }: StudentSessionCardProps) {
  const { session } = booking;
  const sessionDate = session.scheduledAt ? new Date(session.scheduledAt) : null;
  const now = new Date();
  
  const isUpcoming = sessionDate && sessionDate > now && booking.status === "confirmed";
  const isCompleted = session.status === "completed" || session.status === "Completed";
  const isCancelled = booking.status === "cancelled" || booking.status === "refunded";
  
  // Can join 15 minutes before until session end time
  const canJoin = sessionDate && booking.status === "confirmed" && isWithinInterval(now, {
    start: addMinutes(sessionDate, -15),
    end: addMinutes(sessionDate, session.duration)
  });

  const getStatusBadge = () => {
    if (isCancelled) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    if (booking.status === "pending") {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Payment Pending
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (canJoin) {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          <Video className="h-3 w-3 mr-1" />
          Ready to Join
        </Badge>
      );
    }
    if (isUpcoming) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-3 w-3 mr-1" />
          Upcoming
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="h-3 w-3 mr-1" />
        {session.status}
      </Badge>
    );
  };

  const handleDownloadRecording = async () => {
    try {
      const result = await generateRecordingSignedUrl(session.id);
      if (result.success && result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error(result.error || "Failed to get recording link");
      }
    } catch (error) {
      toast.error("An error occurred while fetching the recording");
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl">{session.title}</CardTitle>
              {getStatusBadge()}
            </div>
            {session.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {session.description}
              </p>
            )}
            <Badge variant="outline">{session.subject}</Badge>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
              <DollarSign className="h-5 w-5" />
              {(booking.amount / 100).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {session.duration} min
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Teacher Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session.teacher.user.image || undefined} />
            <AvatarFallback>
              {session.teacher.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{session.teacher.user.name}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span>Instructor</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Session Details */}
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {sessionDate && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(sessionDate, "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(sessionDate, "h:mm a")}</span>
              </div>
            </>
          )}
        </div>

        {/* Time Until Session */}
        {isUpcoming && sessionDate && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Session starts {formatDistance(sessionDate, now, { addSuffix: true })}
            </p>
          </div>
        )}

        {/* Cancellation Info */}
        {isCancelled && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
            <p className="font-semibold text-destructive flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4" />
              Booking Cancelled {session.cancelledBy ? `by ${session.cancelledBy}` : ''}
            </p>
            {session.cancellationReason && (
              <p className="text-muted-foreground">Reason: {session.cancellationReason}</p>
            )}
            {booking.refundAmount !== null && booking.refundAmount > 0 && (
              <p className="text-muted-foreground mt-1">
                Refunded: ${(booking.refundAmount / 100).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canJoin && session.meetingUrl && (
            <Link href={session.meetingUrl as any} className="flex-1">
              <Button className="w-full" size="lg">
                <Video className="mr-2 h-5 w-5" />
                Join Session
              </Button>
            </Link>
          )}
          
          {canJoin && !session.meetingUrl && (
            <Link href={`/video-room/${session.id}`} className="flex-1">
              <Button className="w-full" size="lg">
                <Video className="mr-2 h-5 w-5" />
                Join Session
              </Button>
            </Link>
          )}

          {isCompleted && session.recordingUrl && (
            <Button variant="outline" className="flex-1" onClick={handleDownloadRecording}>
              <Download className="mr-2 h-4 w-4" />
              Download Recording
            </Button>
          )}

          {isCompleted && !session.studentRating && (
            <Link href={`/dashboard/sessions/${session.id}/rate`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Star className="mr-2 h-4 w-4" />
                Rate Session
              </Button>
            </Link>
          )}

          {isUpcoming && !canJoin && (
            <Link href={`/dashboard/messages?createChatWith=${session.teacher.user.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Teacher
              </Button>
            </Link>
          )}

          {isUpcoming && sessionDate && (
            <CancelBookingDialog
              bookingId={booking.id}
              sessionDate={sessionDate}
              amount={booking.amount}
            >
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </CancelBookingDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
