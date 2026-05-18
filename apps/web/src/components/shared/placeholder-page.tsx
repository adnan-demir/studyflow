import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlaceholderPageProps {
  title: string;
  description: string;
  phase?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backHref?: string;
  backLabel?: string;
  bullets?: string[];
}

export function PlaceholderPage({
  title,
  description,
  phase = "Phase 2",
  icon: Icon = Construction,
  backHref,
  backLabel = "Go back",
  bullets,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>

      <Badge variant="outline" className="mb-4 text-xs">
        Coming in {phase}
      </Badge>

      <h2 className="mb-3 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>

      {bullets && bullets.length > 0 && (
        <ul className="mb-8 space-y-1.5 text-left text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              {b}
            </li>
          ))}
        </ul>
      )}

      {backHref && (
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
