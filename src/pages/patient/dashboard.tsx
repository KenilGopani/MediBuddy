import React from "react";
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
  User,
  Bell,
  FileText,
  Calendar,
  Heart,
  Pill,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Activity,
} from "lucide-react";

export default function PatientDashboard() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByToken,
    user?.id ? { tokenIdentifier: user.id } : "skip"
  );

  // Query for patient data, notifications, and trial matches
  const patientId = userData?._id;

  // Fetch notifications
  const notifications = useQuery(
    api.notifications.getPatientNotifications,
    patientId ? { patientId } : "skip"
  );

  // Get unread notification count
  const unreadCount =
    useQuery(
      api.notifications.getUnreadNotificationCount,
      patientId ? { patientId } : "skip"
    ) || 0;

  // Get action required notification count
  const actionRequiredCount =
    useQuery(
      api.notifications.getActionRequiredNotificationCount,
      patientId ? { patientId } : "skip"
    ) || 0;

  // Get consultation count
  const consultations =
    useQuery(
      api.consultations.listConsultationsForPatient,
      patientId ? { patientId } : "skip"
    ) || [];

  // Get shared consultations count
  const sharedConsultations =
    useQuery(
      api.consultations.listSharedConsultationsForPatient,
      patientId ? { patientId } : "skip"
    ) || [];

  // Get upcoming appointments
  const upcomingMeetings = useQuery(
    api.meetings.getUpcomingMeetingsForPatient,
    patientId ? { patientId } : "skip"
  );

  // Get medical profile completion percentage
  const profileCompletionPercentage = useQuery(
    api.medicalProfile.getProfileCompletionPercentage,
    patientId ? { patientId } : "skip"
  );

  // Get medical profile data
  const medicalProfileData = useQuery(
    api.medicalProfile.getMedicalProfile,
    patientId ? { patientId } : "skip"
  );

  // Format notifications for display
  const formattedNotifications =
    notifications?.slice(0, 3).map((notification) => {
      // Determine notification type based on status
      let type = "new_match";
      if (notification.consentStatus === "approved") {
        type = "approved";
      } else if (
        notification.consentStatus === "pending" &&
        notification.notificationStatus === "viewed"
      ) {
        type = "consent_required";
      }

      return {
        id: notification.id,
        title: getNotificationTitle(notification),
        description: getNotificationDescription(notification),
        type,
        date: new Date(notification.matchDate).toISOString().split("T")[0],
        status:
          notification.notificationStatus === "viewed" ? "read" : "unread",
        trialPhase: notification.trialPhase,
      };
    }) || [];

  // Format active trials (approved/enrolled matches)
  const activeTrials =
    notifications
      ?.filter(
        (notification) =>
          notification.consentStatus === "approved" ||
          notification.consentStatus === "enrolled"
      )
      .slice(0, 2)
      .map((trial) => ({
        id: trial.id,
        title: trial.trialTitle,
        phase: trial.trialPhase,
        sponsor: trial.trialSponsor,
        status: trial.consentStatus,
        nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Mock date 7 days from now
        progress: trial.consentStatus === "enrolled" ? 60 : 25, // Mock progress
      })) || [];

  // Helper functions for notification formatting
  function getNotificationTitle(notification) {
    if (
      notification.consentStatus === "pending" &&
      notification.notificationStatus !== "viewed"
    ) {
      return "New Clinical Trial Match Found";
    } else if (notification.consentStatus === "approved") {
      return "Trial Participation Approved";
    } else {
      return "Consent Form Required";
    }
  }

  function getNotificationDescription(notification) {
    if (
      notification.consentStatus === "pending" &&
      notification.notificationStatus !== "viewed"
    ) {
      return `${notification.trialTitle} - ${notification.relevanceScore}% match`;
    } else if (notification.consentStatus === "approved") {
      return `${notification.trialTitle} - Your doctor has approved your participation`;
    } else {
      return `Please review and sign the consent form for ${notification.trialTitle}`;
    }
  }

  // Calculate patient stats
  const patientStats = {
    activeTrials: activeTrials.length,
    pendingNotifications: unreadCount,
    completedConsultations: consultations.filter(
      (c) => c.status === "completed"
    ).length,
    sharedReports: sharedConsultations.length,
    upcomingAppointments: upcomingMeetings?.length || 0,
  };

  // Format medical profile from user data
  const medicalProfile = {
    conditions: userData?.conditions?.map((c) => c.name) || [],
    medications: userData?.medications || [],
    allergies: userData?.allergies || [],
    lastUpdated: userData?.updatedAt
      ? new Date(userData.updatedAt).toISOString().split("T")[0]
      : "N/A",
    // Additional profile data
    profileData: medicalProfileData || null,
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_match":
        return <Star className="h-4 w-4 text-primary" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "consent_required":
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800";
      case "screening":
        return "bg-primary/10 text-primary";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-foreground mb-2">
              Welcome, {userData?.name?.split(" ")[0] || "Patient"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Your personalized health dashboard and clinical trial information
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link to="/patient/active-trials">
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Trials
                  </CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-4xl font-extrabold text-foreground">
                    {patientStats.activeTrials}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently participating
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/patient/notifications">
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Notifications
                  </CardTitle>
                  <Bell className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-4xl font-extrabold text-foreground">
                    {patientStats.pendingNotifications}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/patient/appointments">
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Appointments
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-4xl font-extrabold text-foreground">
                    {patientStats.upcomingAppointments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link to="/patient/reports">
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Medical Reports</CardTitle>
                      <CardDescription>
                        View shared consultation reports
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/patient/consent">
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Consent Forms</CardTitle>
                      <CardDescription>
                        Review and sign trial consent forms
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Medical Profile */}
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <span>Medical Profile</span>
                    </CardTitle>
                    <CardDescription>
                      Your current medical information • Last updated{" "}
                      {medicalProfile.lastUpdated}
                    </CardDescription>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Profile Completion
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {profileCompletionPercentage || 0}%
                        </span>
                      </div>
                      <Progress
                        value={profileCompletionPercentage || 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <Link to="/patient/medical-profile">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-foreground">
                      Conditions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalProfile.conditions.length > 0 ? (
                      medicalProfile.conditions.map((condition, index) => (
                        <Badge
                          key={index}
                          variant="destructive"
                          className="text-sm"
                        >
                          {condition}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No conditions recorded
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Current Medications
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalProfile.medications.length > 0 ? (
                      medicalProfile.medications.map((medication, index) => (
                        <Badge
                          key={index}
                          className="bg-primary/10 text-primary text-sm"
                        >
                          {medication}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No medications recorded
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-foreground">
                      Allergies
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalProfile.allergies.length > 0 ? (
                      medicalProfile.allergies.map((allergy, index) => (
                        <Badge
                          key={index}
                          className="bg-orange-100 text-orange-800 text-sm"
                        >
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No allergies recorded
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link to="/patient/medical-profile">
                    <Button className="w-full">
                      Complete Medical Profile for Better Trial Matching
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
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
                <div className="space-y-4">
                  {upcomingMeetings && upcomingMeetings.length > 0 ? (
                    upcomingMeetings.map((meeting) => (
                      <div
                        key={meeting._id}
                        className="p-4 rounded-lg bg-muted border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {meeting.title || "Medical Appointment"}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {meeting.description || "No description provided"}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    meeting.scheduledDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    meeting.scheduledDate
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>{meeting.duration || 30} minutes</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline" className="text-xs">
                              {meeting.type || "consultation"}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary">
                              {meeting.status}
                            </Badge>
                          </div>
                        </div>
                        {meeting.location && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              <strong>Location:</strong> {meeting.location}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your doctor will schedule appointments as needed
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
