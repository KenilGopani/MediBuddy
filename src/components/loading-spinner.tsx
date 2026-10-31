import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

// With a className it renders an inline spinner (e.g. inside a button);
// without one it fills the screen as the page-level loading state.
export function LoadingSpinner({ className }: { className?: string } = {}) {
  if (className) {
    return <Loader2 className={cn("animate-spin", className)} aria-hidden />;
  }
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
