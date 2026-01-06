import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Loader2,
  FileText,
  Target,
  Users,
  Lightbulb,
  GitCompare,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LEADPhaseFeedback {
  phase: string;
  rating: "excellent" | "good" | "developing" | "needs-improvement";
  observations: string[];
  suggestions: string[];
}

interface FeedbackData {
  leadPhases: LEADPhaseFeedback[];
  teachingDelivery: {
    strengths: string[];
    areasForDevelopment: string[];
  };
  planVsDelivery?: {
    alignment: "strong" | "moderate" | "weak";
    observations: string[];
    deviations: string[];
  };
  resourceUtilization?: {
    summary: string;
    effectiveUses: string[];
    missedOpportunities: string[];
  };
  studentWorkAnalysis?: {
    summary: string;
    differentiationEvidence: string[];
    objectivesReached: boolean;
  };
  www: string[];
  ebi: string[];
}

type AnalysisMode = "quick" | "deep-dive" | "full-review";

interface FeedbackReportProps {
  feedback: FeedbackData | null;
  transcript: string;
  isLoading: boolean;
  onReset: () => void;
  mode: AnalysisMode;
}

const ratingColors = {
  excellent: "bg-success text-success-foreground",
  good: "bg-primary text-primary-foreground",
  developing: "bg-warning text-warning-foreground",
  "needs-improvement": "bg-destructive text-destructive-foreground",
};

const ratingLabels = {
  excellent: "Excellent",
  good: "Good",
  developing: "Developing",
  "needs-improvement": "Needs Improvement",
};

const alignmentColors = {
  strong: "bg-success/10 text-success border-success/20",
  moderate: "bg-warning/10 text-warning border-warning/20",
  weak: "bg-destructive/10 text-destructive border-destructive/20",
};

const alignmentLabels = {
  strong: "Strong Alignment",
  moderate: "Moderate Alignment", 
  weak: "Needs Attention",
};

export function FeedbackReport({
  feedback,
  transcript,
  isLoading,
  onReset,
  mode,
}: FeedbackReportProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["Launch"]);

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phase)
        ? prev.filter((p) => p !== phase)
        : [...prev, phase]
    );
  };

  const getLoadingMessage = () => {
    switch (mode) {
      case "quick":
        return "The AI is reviewing your transcript against the LEAD model framework...";
      case "deep-dive":
        return "The AI is comparing your lesson plan against your actual delivery...";
      case "full-review":
        return "The AI is analyzing your complete teaching cycle — plan, delivery, and student outcomes...";
    }
  };

  const handleDownload = () => {
    if (!feedback) return;

    let reportContent = `
POWER SKILLS SESSION ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
Mode: ${mode === "quick" ? "Quick Feedback" : mode === "deep-dive" ? "Delivery Deep Dive" : "Full Session Review"}

=====================================
WHAT WENT WELL (WWW)
=====================================
${feedback.www.map((item) => `• ${item}`).join("\n")}

=====================================
EVEN BETTER IF (EBI)
=====================================
${feedback.ebi.map((item) => `• ${item}`).join("\n")}

=====================================
LEAD MODEL ANALYSIS
=====================================
${feedback.leadPhases
  .map(
    (phase) => `
${phase.phase.toUpperCase()} - ${ratingLabels[phase.rating]}
Observations:
${phase.observations.map((o) => `• ${o}`).join("\n")}
Suggestions:
${phase.suggestions.map((s) => `• ${s}`).join("\n")}
`
  )
  .join("\n")}

=====================================
TEACHING DELIVERY
=====================================
Strengths:
${feedback.teachingDelivery.strengths.map((s) => `• ${s}`).join("\n")}

Areas for Development:
${feedback.teachingDelivery.areasForDevelopment.map((a) => `• ${a}`).join("\n")}
`;

    if (feedback.planVsDelivery) {
      reportContent += `
=====================================
PLAN VS DELIVERY COMPARISON
=====================================
Alignment: ${alignmentLabels[feedback.planVsDelivery.alignment]}

Observations:
${feedback.planVsDelivery.observations.map((o) => `• ${o}`).join("\n")}

Notable Deviations:
${feedback.planVsDelivery.deviations.map((d) => `• ${d}`).join("\n")}
`;
    }

    if (feedback.resourceUtilization) {
      reportContent += `
=====================================
RESOURCE UTILIZATION
=====================================
${feedback.resourceUtilization.summary}

Effective Uses:
${feedback.resourceUtilization.effectiveUses.map((e) => `• ${e}`).join("\n")}

Missed Opportunities:
${feedback.resourceUtilization.missedOpportunities.map((m) => `• ${m}`).join("\n")}
`;
    }

    if (feedback.studentWorkAnalysis) {
      reportContent += `
=====================================
STUDENT WORK ANALYSIS
=====================================
${feedback.studentWorkAnalysis.summary}

Differentiation Evidence:
${feedback.studentWorkAnalysis.differentiationEvidence.map((d) => `• ${d}`).join("\n")}

Learning Objectives Reached: ${feedback.studentWorkAnalysis.objectivesReached ? "Yes" : "Partially"}
`;
    }

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
          Here's your comprehensive feedback based on the LEAD model
        </p>
      </div>

      {/* WWW & EBI Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* What Went Well */}
        <div className="card-elevated p-6 border-l-4 border-l-success">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <h3 className="text-lg font-semibold text-foreground">What Went Well</h3>
          </div>
          <ul className="space-y-2">
            {feedback.www.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-foreground animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-success mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Even Better If */}
        <div className="card-elevated p-6 border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Even Better If</h3>
          </div>
          <ul className="space-y-2">
            {feedback.ebi.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-foreground animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-accent mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Plan vs Delivery Comparison - for deep-dive and full-review */}
      {feedback.planVsDelivery && (
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Plan vs Delivery Comparison</h3>
            </div>
            <span className={cn(
              "text-xs px-3 py-1 rounded-full border",
              alignmentColors[feedback.planVsDelivery.alignment]
            )}>
              {alignmentLabels[feedback.planVsDelivery.alignment]}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                What We Observed
              </h4>
              <ul className="space-y-1">
                {feedback.planVsDelivery.observations.map((obs, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Notable Deviations
              </h4>
              <ul className="space-y-1">
                {feedback.planVsDelivery.deviations.map((dev, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-accent">→</span>
                    {dev}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Resource Utilization - for full-review only */}
      {feedback.resourceUtilization && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Resource Utilization</h3>
          </div>
          
          <p className="text-foreground mb-4">{feedback.resourceUtilization.summary}</p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Effective Uses
              </h4>
              <ul className="space-y-1">
                {feedback.resourceUtilization.effectiveUses.map((use, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success">✓</span>
                    {use}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Missed Opportunities
              </h4>
              <ul className="space-y-1">
                {feedback.resourceUtilization.missedOpportunities.map((opp, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-accent">○</span>
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* LEAD Phase Analysis */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">LEAD Model Analysis</h3>
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
                      "text-xs px-2 py-1 rounded-full",
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

      {/* Student Work Analysis - for full-review only */}
      {feedback.studentWorkAnalysis && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Student Work Analysis</h3>
          </div>
          <p className="text-foreground mb-4">{feedback.studentWorkAnalysis.summary}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Learning Objectives Reached:
            </span>
            <span
              className={cn(
                "text-sm px-2 py-1 rounded-full",
                feedback.studentWorkAnalysis.objectivesReached
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              )}
            >
              {feedback.studentWorkAnalysis.objectivesReached ? "Yes" : "Partially"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Differentiation Evidence
            </h4>
            <ul className="space-y-1">
              {feedback.studentWorkAnalysis.differentiationEvidence.map((item, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Transcript Toggle - only show if we have a transcript */}
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
