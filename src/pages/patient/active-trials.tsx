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
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
} from "lucide-react";

export default function ActiveTrialsPage() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByToken,
    user?.id ? { tokenIdentifier: user.id } : "skip"
  );

  const patientId = userData?._id;

  // Fetch notifications to get active trials
  const notifications = useQuery(
    api.notifications.getPatientNotifications,
    patientId ? { patientId } : "skip"
  );

  // Filter for active trials (approved/enrolled)
  const activeTrials =
    notifications
      ?.filter(
        (notification) =>
          notification.consentStatus === "approved" ||
          notification.consentStatus === "enrolled"
      )
      .map((trial) => ({
        id: trial.id,
        title: trial.trialTitle,
        sponsor: trial.trialSponsor,
        phase: trial.trialPhase,
        status: trial.consentStatus,
        matchDate: trial.matchDate,
        relevanceScore: trial.relevanceScore,
        // Mock additional data
        progress: trial.consentStatus === "enrolled" ? 65 : 25,
        nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalParticipants: Math.floor(Math.random() * 500) + 100,
        studyDuration: "12 months",
        location: "Stanford Medical Center",
        coordinator: {
          name: "Dr. Sarah Johnson",
          phone: "(650) 555-0123",
          email: "s.johnson@stanford.edu",
        },
        recentUpdates: [
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            title: "Lab Results Received",
            description:
              "Your recent blood work has been processed and reviewed.",
          },
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            title: "Medication Reminder",
            description: "Continue taking study medication as prescribed.",
          },
        ],
        upcomingTasks: [
          "Complete weekly health survey",
          "Schedule follow-up appointment",
          "Review medication compliance log",
        ],
      })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return (
          <Badge className="bg-green-100 text-green-800">
            Actively Enrolled
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-primary/10 text-primary">
            Approved - Pending Enrollment
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-foreground">Unknown Status</Badge>
        );
    }
  };

  const getPhaseBadge = (phase: string) => {
    const colors = {
      I: "bg-yellow-100 text-yellow-800",
      II: "bg-primary/10 text-primary",
      III: "bg-accent text-accent-foreground",
      IV: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[phase] || "bg-muted text-foreground"}>
        Phase {phase}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link to="/patient/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground mb-2">
              Active Clinical Trials
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your participation in clinical trials and upcoming
              activities
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Trials
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {activeTrials.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently participating
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Enrolled
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {
                    activeTrials.filter((trial) => trial.status === "enrolled")
                      .length
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">Fully enrolled</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Tasks
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {activeTrials.reduce(
                    (total, trial) => total + trial.upcomingTasks.length,
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tasks to complete</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Next Appointment
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-extrabold text-foreground">
                  {activeTrials.length > 0 ? "7" : "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Days away</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Trials List */}
          <div className="space-y-8">
            {activeTrials.length > 0 ? (
              activeTrials.map((trial) => (
                <Card key={trial.id} className="bg-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl">
                            {trial.title}
                          </CardTitle>
                          {getStatusBadge(trial.status)}
                          {getPhaseBadge(trial.phase)}
                        </div>
                        <CardDescription className="text-base">
                          Sponsored by {trial.sponsor}
                        </CardDescription>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                          <span>Match: {trial.relevanceScore}%</span>
                          <span>
                            Started:{" "}
                            {new Date(trial.matchDate).toLocaleDateString()}
                          </span>
                          <span>Duration: {trial.studyDuration}</span>
                        </div>
                      </div>
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Trial Progress */}
                      <div className="lg:col-span-2">
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">
                              Trial Progress
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {trial.progress}% Complete
                            </span>
                          </div>
                          <Progress value={trial.progress} className="h-2" />
                        </div>

                        {/* Recent Updates */}
                        <div className="mb-6">
                          <h4 className="font-medium text-foreground mb-3">
                            Recent Updates
                          </h4>
                          <div className="space-y-3">
                            {trial.recentUpdates.map((update, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3 p-3 rounded-lg bg-muted"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm text-foreground">
                                      {update.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {update.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {update.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Upcoming Tasks */}
                        <div>
                          <h4 className="font-medium text-foreground mb-3">
                            Upcoming Tasks
                          </h4>
                          <div className="space-y-2">
                            {trial.upcomingTasks.map((task, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 p-3 rounded-lg border border-border"
                              >
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-foreground">
                                  {task}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto"
                                >
                                  Mark Complete
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Trial Information */}
                      <div className="space-y-6">
                        {/* Next Appointment */}
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/25">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <h5 className="font-medium text-primary">
                              Next Appointment
                            </h5>
                          </div>
                          <p className="text-sm text-primary mb-1">
                            {trial.nextAppointment.toLocaleDateString()}
                          </p>
                          <p className="text-sm text-primary">
                            {trial.nextAppointment.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Location */}
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h5 className="font-medium text-foreground">
                              Study Location
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trial.location}
                          </p>
                        </div>

                        {/* Study Info */}
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h5 className="font-medium text-foreground">
                              Study Information
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {trial.totalParticipants} total participants
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {trial.studyDuration}
                          </p>
                        </div>

                        {/* Coordinator */}
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <h5 className="font-medium text-foreground">
                              Study Coordinator
                            </h5>
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            {trial.coordinator.name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            {trial.coordinator.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trial.coordinator.email}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button className="w-full bg-primary hover:bg-primary">
                            <FileText className="h-4 w-4 mr-2" />
                            View Study Details
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Coordinator
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card">
                <CardContent className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Active Trials
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You're not currently participating in any clinical trials.
                  </p>
                  <Link to="/patient/notifications">
                    <Button className="bg-primary hover:bg-primary">
                      Browse Available Trials
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
