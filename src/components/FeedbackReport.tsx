import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  FileText,
  Target,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedPhase } from "./PhaseSelector";

interface CategoryFeedback {
  name: string;
  rating: number;
  whatsWorking: string;
  growthEdge: string;
  tryThis: string;
}

interface LEADPhaseFeedback {
  phase: string;
  rating: "exemplary" | "solid" | "developing" | "emerging";
  observations: string[];
  suggestions: string[];
}

interface FeedbackData {
  categories: CategoryFeedback[];
  leadPhases: LEADPhaseFeedback[];
  overallSummary: string;
  topStrength: string;
  priorityGrowthArea: string;
}

type AnalysisMode = "quick" | "deep-dive" | "full-review";

interface FeedbackReportProps {
  feedback: FeedbackData | null;
  transcript: string;
  isLoading: boolean;
  onReset: () => void;
  mode: AnalysisMode;
  selectedPhases: SelectedPhase[];
}

const ratingLabels: Record<string, string> = {
  exemplary: "⭐⭐⭐⭐ Exemplary Strength",
  solid: "⭐⭐⭐ Solid Foundation",
  developing: "⭐⭐ Developing Skill",
  emerging: "⭐ Emerging Focus",
};

const ratingColors: Record<string, string> = {
  exemplary: "bg-success/10 text-success border-success/30",
  solid: "bg-primary/10 text-primary border-primary/30",
  developing: "bg-warning/10 text-warning border-warning/30",
  emerging: "bg-accent/10 text-accent border-accent/30",
};

const starRatingLabels: Record<number, string> = {
  4: "Exemplary Strength",
  3: "Solid Foundation",
  2: "Developing Skill",
  1: "Emerging Focus",
};

const starRatingColors: Record<number, string> = {
  4: "text-success",
  3: "text-primary",
  2: "text-warning",
  1: "text-accent",
};

export function FeedbackReport({
  feedback,
  transcript,
  isLoading,
  onReset,
  mode,
  selectedPhases,
}: FeedbackReportProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phase)
        ? prev.filter((p) => p !== phase)
        : [...prev, phase]
    );
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i <= count ? starRatingColors[count] : "text-muted-foreground/30"
            )}
            fill={i <= count ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  const getLoadingMessage = () => {
    const phaseText = selectedPhases.includes("full")
      ? "all LEAD phases"
      : selectedPhases.join(", ");
    return `The AI is analyzing your session focusing on ${phaseText} using the STAR framework...`;
  };

  const handleDownload = () => {
    if (!feedback) return;

    let reportContent = `
POWER SKILLS SESSION ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
Mode: ${mode === "quick" ? "Quick Feedback" : mode === "deep-dive" ? "Delivery Deep Dive" : "Full Session Review"}

=====================================
OVERALL SUMMARY
=====================================
${feedback.overallSummary}

Top Strength: ${feedback.topStrength}
Priority Growth Area: ${feedback.priorityGrowthArea}

=====================================
CATEGORY ANALYSIS (STAR Framework)
=====================================
${feedback.categories.map((cat) => `
${cat.name} - ${starRatingLabels[cat.rating]} ${"⭐".repeat(cat.rating)}

What's Working:
${cat.whatsWorking}

Growth Edge:
${cat.growthEdge}

Try This:
${cat.tryThis}
`).join("\n")}

=====================================
LEAD PHASE ANALYSIS
=====================================
${feedback.leadPhases.map((phase) => `
${phase.phase.toUpperCase()} - ${ratingLabels[phase.rating]}

Observations:
${phase.observations.map((o) => `• ${o}`).join("\n")}

Suggestions:
${phase.suggestions.map((s) => `• ${s}`).join("\n")}
`).join("\n")}
`;

    if (transcript) {
      reportContent += `
=====================================
ANONYMIZED TRANSCRIPT
=====================================
${transcript}
`;
    }

    const blob = new Blob([reportContent.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Analyzing Your Session
          </h3>
          <p className="text-muted-foreground max-w-md">
            {getLoadingMessage()}
          </p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="section-fade-in space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Session Analysis Complete
        </h2>
        <p className="text-muted-foreground">
          Your personalized feedback using the STAR framework
        </p>
      </div>

      {/* Overall Summary */}
      <div className="card-elevated p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <p className="text-foreground mb-4">{feedback.overallSummary}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm font-medium text-success mb-1">Top Strength</p>
            <p className="text-sm text-foreground">{feedback.topStrength}</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm font-medium text-accent mb-1">Priority Growth Area</p>
            <p className="text-sm text-foreground">{feedback.priorityGrowthArea}</p>
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Teaching Practice Analysis</h3>
          </div>
        </div>
        <div className="divide-y divide-border">
          {feedback.categories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{category.name}</span>
                  {renderStars(category.rating)}
                  <span className={cn("text-xs", starRatingColors[category.rating])}>
                    {starRatingLabels[category.rating]}
                  </span>
                </div>
                {expandedCategories.includes(category.name) ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {expandedCategories.includes(category.name) && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                  <div className="p-3 bg-success/5 rounded-lg border border-success/10">
                    <h4 className="text-sm font-medium text-success mb-2">
                      What's Working
                    </h4>
                    <p className="text-sm text-foreground">{category.whatsWorking}</p>
                  </div>
                  <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                    <h4 className="text-sm font-medium text-accent mb-2">
                      Growth Edge
                    </h4>
                    <p className="text-sm text-foreground">{category.growthEdge}</p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Try This
                    </h4>
                    <p className="text-sm text-foreground">{category.tryThis}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LEAD Phase Analysis */}
      {feedback.leadPhases.length > 0 && (
        <div className="card-elevated overflow-hidden">
          <div className="p-4 bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">LEAD Phase Analysis</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {feedback.leadPhases.map((phase) => (
              <div key={phase.phase}>
                <button
                  onClick={() => togglePhase(phase.phase)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {phase.phase[0]}
                    </span>
                    <span className="font-medium text-foreground">{phase.phase}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        ratingColors[phase.rating]
                      )}
                    >
                      {ratingLabels[phase.rating]}
                    </span>
                  </div>
                  {expandedPhases.includes(phase.phase) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {expandedPhases.includes(phase.phase) && (
                  <div className="px-4 pb-4 pl-16 space-y-4 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Observations
                      </h4>
                      <ul className="space-y-1">
                        {phase.observations.map((obs, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {phase.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Suggestions
                        </h4>
                        <ul className="space-y-1">
                          {phase.suggestions.map((sug, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-accent">→</span>
                              {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Toggle */}
      {transcript && (
        <div className="card-elevated overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">View Anonymized Transcript</span>
            </div>
            {showTranscript ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {showTranscript && (
            <div className="p-4 border-t border-border animate-fade-in">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button onClick={handleDownload} variant="outline" size="lg">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
        <Button onClick={onReset} variant="secondary" size="lg">
          <RotateCcw className="w-5 h-5" />
          Start New Analysis
        </Button>
      </div>

      {/* Privacy Reminder */}
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>Reminder:</strong> No data has been stored. All analysis data will be 
          cleared when you close this browser tab.
        </p>
      </div>
    </div>
  );
}
