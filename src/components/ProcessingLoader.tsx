import { Loader2, Clock } from "lucide-react";
import { RotatingInsight } from "@/components/RotatingInsight";

interface ProcessingLoaderProps {
  title: string;
  message: string;
  elapsed?: number;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export function ProcessingLoader({ title, message, elapsed }: ProcessingLoaderProps) {
  return (
    <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        {elapsed !== undefined && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-mono px-3 py-1 rounded-full flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(elapsed)}
          </div>
        )}
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-heading font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {message}
        </p>
      </div>
      <RotatingInsight />
    </div>
  );
}
