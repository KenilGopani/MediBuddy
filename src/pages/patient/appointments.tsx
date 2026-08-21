import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  MapPin,
  Video,
  Phone,
  User,
  FileText,
} from "lucide-react";

export default function PatientAppointments() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByToken,
    user?.id ? { tokenIdentifier: user.id } : "skip"
  );

  const patientId = userData?._id;

  // Get all meetings for the patient
  const allMeetings = useQuery(
    api.meetings.getMeetingsForPatient,
    patientId ? { patientId } : "skip"
  );

  // Get upcoming meetings
  const upcomingMeetings = useQuery(
    api.meetings.getUpcomingMeetingsForPatient,
    patientId ? { patientId } : "skip"
  );

  // Separate past and upcoming appointments
  const now = Date.now();
  const pastMeetings =
    allMeetings?.filter((meeting) => meeting.scheduledDate < now) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-primary/10 text-primary";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no-show":
        return "bg-muted text-foreground";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "consultation":
        return <User className="h-4 w-4" />;
      case "follow-up":
        return <FileText className="h-4 w-4" />;
      case "check-up":
        return <Calendar className="h-4 w-4" />;
      case "emergency":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getLocationIcon = (location: string) => {
    if (
      location?.toLowerCase().includes("virtual") ||
      location?.toLowerCase().includes("online")
    ) {
      return <Video className="h-4 w-4" />;
    } else if (location?.toLowerCase().includes("phone")) {
      return <Phone className="h-4 w-4" />;
    } else {
      return <MapPin className="h-4 w-4" />;
    }
  };

  const AppointmentCard = ({
    meeting,
    isUpcoming = false,
  }: {
    meeting: any;
    isUpcoming?: boolean;
  }) => (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getTypeIcon(meeting.type)}
              <h3 className="font-semibold text-foreground">
                {meeting.title || "Medical Appointment"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {meeting.description || "No description provided"}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getStatusColor(meeting.status)}>
              {meeting.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {meeting.type}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(meeting.scheduledDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(meeting.scheduledDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({meeting.duration || 30} min)
            </span>
          </div>
          {meeting.location && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {getLocationIcon(meeting.location)}
              <span className="truncate">{meeting.location}</span>
            </div>
          )}
        </div>

        {meeting.notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Notes:</strong> {meeting.notes}
            </p>
          </div>
        )}

        {isUpcoming && meeting.meetingLink && (
          <div className="mt-4 pt-4 border-t">
            <Button asChild className="w-full bg-primary hover:bg-primary">
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link to="/patient/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground mb-2">
              My Appointments
            </h1>
            <p className="text-lg text-muted-foreground">
              View and manage your medical appointments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {upcomingMeetings?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled appointments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {pastMeetings.filter((m) => m.status === "completed").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Past appointments</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {allMeetings?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Upcoming Appointments</span>
                </CardTitle>
                <CardDescription>
                  Your scheduled medical appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMeetings && upcomingMeetings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting) => (
                      <AppointmentCard
                        key={meeting._id}
                        meeting={meeting}
                        isUpcoming={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No upcoming appointments
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your doctor will schedule appointments as needed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Past Appointments */}
          {pastMeetings.length > 0 && (
            <div>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Past Appointments</span>
                  </CardTitle>
                  <CardDescription>Your appointment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastMeetings
                      .sort((a, b) => b.scheduledDate - a.scheduledDate)
                      .slice(0, 10) // Show last 10 appointments
                      .map((meeting) => (
                        <AppointmentCard
                          key={meeting._id}
                          meeting={meeting}
                          isUpcoming={false}
                        />
                      ))}
                  </div>
                  {pastMeetings.length > 10 && (
                    <div className="mt-4 pt-4 border-t text-center">
                      <p className="text-sm text-muted-foreground">
                        Showing 10 most recent appointments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
