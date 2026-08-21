import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/clerk-react";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { Highlighter, Mic, SearchCheck, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import React from "react";

function DashboardButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const userData = useQuery(
    api.users.getUserByToken,
    user?.id ? { tokenIdentifier: user.id } : "skip"
  );
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Ensure user exists in Convex database
  React.useEffect(() => {
    const createUserIfNeeded = async () => {
      if (user?.id && userData === null) {
        try {
          // User exists in Clerk but not in Convex, create them
          await createOrUpdateUser({});
          navigate("/role-selection");
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    };

    createUserIfNeeded();
  }, [user, userData, createOrUpdateUser, navigate]);

  const handleClick = () => {
    if (!userData) {
      // User not in database yet
      createOrUpdateUser({})
        .then(() => {
          navigate("/role-selection");
        })
        .catch((error) => {
          console.error("Error creating user:", error);
        });
    } else if (userData.role === "doctor") {
      navigate("/doctor/dashboard");
    } else if (userData.role === "patient") {
      navigate("/patient/dashboard");
    } else {
      // User exists but doesn't have a role
      navigate("/role-selection");
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant={variant === "primary" ? "default" : "secondary"}
      className="h-12 px-7 text-base"
    >
      Open your dashboard
    </Button>
  );
}

const FEATURES = [
  {
    icon: Mic,
    title: "Listens during the visit",
    description:
      "Record the consultation and get a transcript in seconds, without typing notes mid-conversation.",
  },
  {
    icon: Highlighter,
    title: "Picks out what matters",
    description:
      "Conditions, medications, allergies and vitals are pulled from the transcript and filed in the patient's profile.",
  },
  {
    icon: SearchCheck,
    title: "Finds trials that fit",
    description:
      "Matches are ranked against live ClinicalTrials.gov listings by condition, age, medication and location.",
  },
  {
    icon: ShieldCheck,
    title: "Patient decides",
    description:
      "Trial details reach a patient as a notification. Nothing leaves their record until they consent.",
  },
] as const;

function VisitDemo() {
  const marked = (delay: number) =>
    ({ "--marker-delay": `${delay}s` }) as React.CSSProperties;
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_hsl(var(--primary)/0.45)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span
              className="h-2.5 w-2.5 rounded-full bg-signal motion-safe:animate-[live-pulse_1.6s_ease-in-out_infinite]"
              aria-hidden
            />
            Recording · 04:12
          </div>
          <span className="text-sm text-muted-foreground">Follow-up visit</span>
        </div>
        <div className="space-y-4 px-5 py-5 text-[1.05rem] leading-8">
          <p>
            <span className="font-bold">Doctor</span> How's the{" "}
            <span className="marker marker-sweep" style={marked(0.5)}>
              chest tightness
            </span>{" "}
            since we changed your dose?
          </p>
          <p>
            <span className="font-bold">Patient</span> Better, but I still get
            it climbing stairs. I'm on{" "}
            <span className="marker marker-sweep" style={marked(1.1)}>
              metformin 500 mg
            </span>{" "}
            and I'm{" "}
            <span className="marker marker-sweep" style={marked(1.7)}>
              allergic to penicillin
            </span>
            .
          </p>
        </div>
      </div>

      <div className="relative ml-6 sm:ml-12 -mt-3 rounded-2xl bg-primary text-primary-foreground p-5 shadow-[0_24px_50px_-26px_hsl(var(--primary)/0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold leading-snug">
              Type 2 diabetes with stable angina
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Phase 3 · Adults 40–75 · 12 km away
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-marker px-3 py-1.5 text-center text-foreground">
            <p className="font-display text-2xl font-extrabold leading-none">
              87%
            </p>
            <p className="text-xs font-bold">match</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-primary-foreground/80">
          Waiting for the patient's consent before the sponsor sees anything.
        </p>
      </div>
    </div>
  );
}

function App() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const userData = useQuery(
    api.users.getUserByToken,
    isUserLoaded && user?.id ? { tokenIdentifier: user.id } : "skip"
  );
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Auto-redirect to role selection for users without a role
  React.useEffect(() => {
    const handleRedirection = async () => {
      if (isUserLoaded && user?.id) {
        if (userData === null) {
          // Create the user and redirect to role selection
          try {
            await createOrUpdateUser({});
            navigate("/role-selection");
          } catch (error) {
            console.error("Error creating user:", error);
          }
        } else if (userData && !userData.role) {
          // User exists but has no role, redirect to role selection
          navigate("/role-selection");
        }
      }
    };

    handleRedirection();
  }, [isUserLoaded, user, userData, createOrUpdateUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="container mx-auto px-4 pt-16 pb-20 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="max-w-xl">
              <h1 className="font-display text-5xl font-extrabold leading-[1.03] sm:text-6xl">
                Every visit can lead to the right trial.
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                MediBuddy listens to the consultation, files the medical
                details, and checks them against open clinical trials, so
                doctors keep talking to patients instead of typing.
              </p>

              {!isUserLoaded ? (
                <div className="mt-8 h-12 w-44 rounded-lg bg-muted animate-pulse" />
              ) : (
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Unauthenticated>
                    <SignInButton mode="modal">
                      <Button size="lg" className="h-12 px-7 text-base">
                        Create your account
                      </Button>
                    </SignInButton>
                  </Unauthenticated>
                  <Authenticated>
                    <DashboardButton />
                  </Authenticated>
                </div>
              )}
            </div>

            <VisitDemo />
          </div>
        </section>

        <section className="border-y border-border bg-secondary/50">
          <div className="container mx-auto px-4 py-16">
            <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
              From a spoken visit to a consented match, in four steps
            </h2>
            <ol className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => (
                <li key={feature.title} className="flex flex-col gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-display text-xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;
