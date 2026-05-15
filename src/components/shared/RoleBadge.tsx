import { cn } from "../../lib/utils";

interface RoleBadgeProps {
  role: "doctor" | "patient";
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        role === "doctor"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
        className
      )}
    >
      {role === "doctor" ? "👨‍⚕️" : "🧑‍🦰"}
      {role === "doctor" ? "Doctor" : "Patient"}
    </span>
  );
}
