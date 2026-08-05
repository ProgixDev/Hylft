import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import * as React from "react";

const colorMap = {
  lime: { bg: "bg-lime/10", text: "text-lime" },
  blue: { bg: "bg-sky/10", text: "text-sky" },
  purple: { bg: "bg-purple/10", text: "text-purple" },
  orange: { bg: "bg-amber/10", text: "text-amber" },
} as const;

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtext?: string;
  color: keyof typeof colorMap;
  className?: string;
}

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ icon: Icon, title, value, subtext, color, className }, ref) => {
    const colors = colorMap[color];
    return (
      <Card ref={ref} className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn("rounded-full p-3", colors.bg)}>
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
              {subtext && (
                <p className="text-xs text-muted-foreground">{subtext}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

InfoCard.displayName = "InfoCard";

interface InfoCardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const InfoCardContainer: React.FC<InfoCardContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

export { InfoCard, InfoCardContainer };
