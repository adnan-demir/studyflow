import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isTodo?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

const iconBg = {
  default: "bg-muted",
  success: "bg-emerald-50 dark:bg-emerald-950/30",
  warning: "bg-amber-50 dark:bg-amber-950/30",
  danger: "bg-red-50 dark:bg-red-950/30",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  isTodo = false,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={cn("text-2xl font-bold", variantStyles[variant])}>
              {value}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg[variant])}>
            <Icon className={cn("h-5 w-5", variantStyles[variant])} />
          </div>
        </div>

        {isTodo && (
          <Badge variant="outline" className="absolute right-3 top-3 text-[9px]">
            TODO
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
