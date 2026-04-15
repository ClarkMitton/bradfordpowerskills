import { useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComparisonData } from "./SessionCompare";

interface ComparisonReportProps {
  result: ComparisonData;
  onReset: () => void;
}

interface Section {
  key: keyof ComparisonData;
  icon: string;
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
}

const SECTIONS: Section[] = [
  {
    key: "embedding",
    icon: "🔒",
    title: "Becoming Part of Your Practice",
    color: "text-emerald-700",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
  },
  {
    key: "growth",
    icon: "↑",
    title: "New Growth Since Your Last Session",
    color: "text-blue-700",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/5",
    iconBg: "bg-blue-500/10",
  },
  {
    key: "resolved",
    icon: "✓",
    title: "Patterns That Appear to Have Shifted",
    color: "text-purple-700",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    iconBg: "bg-purple-500/10",
  },
  {
    key: "persistent",
    icon: "🔄",
    title: "Your Continued Development Focus",
    color: "text-amber-700",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    iconBg: "bg-amber-500/10",
  },
  {
    key: "standardEnglishTrajectory",
    icon: "📖",
    title: "Standard English Trajectory",
    color: "text-indigo-700",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-500/5",
    iconBg: "bg-indigo-500/10",
  },
];

export function ComparisonReport({ result, onReset }: ComparisonReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded] = useState(true);

  const getSectionContent = (key: keyof ComparisonData): string | null => {
    if (key === "sessionA" || key === "sessionB") return null;
    const value = result[key];
    if (!value || typeof value !== "string") return null;
    return value;
  };

  const visibleSections = SECTIONS.filter((s) => getSectionContent(s.key) !== null);

  const handleDownloadHtml = useCallback(async () => {
    if (!containerRef.current) return;

    const timestamp = Date.now();
    const safeJson = JSON.stringify({ ...result, _generatedAt: timestamp }).replace(/<\/script>/gi, "<\\/script>");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PowerED Teaching Journey Report</title>
  <script type="application/json" id="powered-comparison-data">${safeJson}<\/script>
</head>
<body>
${containerRef.current.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `powered-journey-${timestamp}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div ref={containerRef} className="section-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-full">
          <span className="text-lg">↑</span>
          <span className="font-medium">Journey Analysis Complete</span>
        </div>
        <h2 className="text-3xl font-heading font-semibold text-foreground">
          Your Teaching Journey
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          A reflection across two sessions
        </p>
      </div>

      {/* Session MVP side-by-side intro */}
      <div className="card-elevated p-6 bg-gradient-to-r from-primary/5 via-background to-accent/5 border-primary/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center mb-4">
          Your sessions at a glance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-xl border border-border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Session 1 (Earlier)</p>
            <p className="text-sm font-semibold text-foreground">{result.sessionA.mvpMoment}</p>
          </div>
          <div className="flex items-center justify-center sm:hidden">
            <span className="text-muted-foreground text-xl">↓</span>
          </div>
          <div className="hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10">
            <span className="text-primary text-xl font-bold">→</span>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-1">
            <p className="text-xs text-primary font-medium">Session 2 (Later)</p>
            <p className="text-sm font-semibold text-foreground">{result.sessionB.mvpMoment}</p>
          </div>
        </div>
      </div>

      {/* Comparison sections */}
      {visibleSections.length > 0 ? (
        <div className="space-y-4">
          {visibleSections.map((section) => {
            const content = getSectionContent(section.key);
            if (!content) return null;
            return (
              <div
                key={section.key}
                className={cn(
                  "card-elevated p-6 border",
                  section.bgColor,
                  section.borderColor
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg",
                      section.iconBg
                    )}
                  >
                    {section.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className={cn("font-semibold text-base", section.color)}>
                      {section.title}
                    </h3>
                    <p className="text-foreground leading-relaxed text-sm sm:text-base">
                      {content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center space-y-2">
          <p className="text-foreground font-medium">Comparison generated</p>
          <p className="text-muted-foreground text-sm">
            The AI found limited direct comparisons between these two sessions. This can happen when the sessions cover very different content or learner groups.
          </p>
        </div>
      )}

      {/* Closing line */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-6 text-center space-y-2">
        <p className="text-foreground font-medium text-lg">
          Remember: progress in teaching is rarely linear. Every session is data.
        </p>
        <p className="text-muted-foreground text-sm">
          Use this reflection to inform your next steps — and then record another session to see how you continue to grow.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button onClick={handleDownloadHtml} size="lg" className="gap-2">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="w-5 h-5" />
          Start New Analysis
        </Button>
      </div>

      {/* Privacy reminder */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>Privacy Note:</strong> No data has been stored. All session data will be cleared when you close this browser tab.
        </p>
      </div>
    </div>
  );
}
