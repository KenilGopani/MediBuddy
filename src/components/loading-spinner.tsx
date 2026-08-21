import { Logo } from "@/components/ui/logo";

export function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-background"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <Logo size={44} className="animate-pulse" />
        <p className="text-muted-foreground">Loading your workspace…</p>
      </div>
    </div>
  );
}
