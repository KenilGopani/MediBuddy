import { Logo } from "@/components/ui/logo";

const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Support", href: "/support" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-secondary/60">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="font-display text-lg font-extrabold">
                MediBuddy AI
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Turns the conversation you were already having into notes, a
              report, and trials worth asking about. Nothing is shared without
              the patient's say-so.
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="font-display text-base font-bold">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediBuddy AI
        </p>
      </div>
    </footer>
  );
}
