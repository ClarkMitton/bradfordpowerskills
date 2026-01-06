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
  Star,
  Sparkles,
  Heart,
  TrendingUp
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
  exemplary: "Exemplary Strength",
  solid: "Solid Foundation",
  developing: "Developing Skill",
  emerging: "Emerging Focus",
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

// Helper to highlight timestamps and quotes in text
const formatTextWithEvidence = (text: string) => {
  // Match timestamps like [MM:SS] or [M:SS]
  const timestampRegex = /\[(\d{1,2}:\d{2})\]/g;
  // Match quoted text
  const quoteRegex = /"([^"]+)"/g;
  
  let result = text;
  
  // Replace timestamps with styled badges
  result = result.replace(timestampRegex, '<span class="timestamp-badge">[$1]</span>');
  
  // Replace quotes with styled text
  result = result.replace(quoteRegex, '<span class="quote-text">"$1"</span>');
  
  return result;
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
              "w-5 h-5",
              i <= count ? "text-yellow-500" : "text-muted-foreground/30"
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
    return `The AI is carefully reviewing your session, focusing on ${phaseText}. This usually takes about 30 seconds...`;
  };

  const handleDownload = () => {
    if (!feedback) return;

    const modeText = mode === "quick" ? "Quick Feedback" : mode === "deep-dive" ? "Delivery Deep Dive" : "Full Session Review";
    const date = new Date().toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Analysis Report - ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1a1a2e; 
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      padding-bottom: 30px;
      border-bottom: 3px solid #6366f1;
    }
    .header h1 { 
      color: #6366f1; 
      font-size: 28px; 
      margin-bottom: 8px;
      font-weight: 600;
    }
    .header .subtitle { 
      color: #64748b; 
      font-size: 14px; 
    }
    .celebration { 
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
      border: 1px solid #86efac;
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 30px;
      text-align: center;
    }
    .celebration h2 { 
      color: #16a34a; 
      font-size: 18px; 
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .celebration p { 
      color: #166534; 
      font-size: 15px;
    }
    .summary-box { 
      background: #f8fafc; 
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 30px;
    }
    .summary-box p { 
      font-size: 15px; 
      color: #334155;
      margin-bottom: 20px;
    }
    .highlight-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
    }
    .highlight-card { 
      padding: 16px; 
      border-radius: 8px; 
    }
    .highlight-card.strength { 
      background: #f0fdf4; 
      border: 1px solid #86efac; 
    }
    .highlight-card.growth { 
      background: #fef3c7; 
      border: 1px solid #fcd34d; 
    }
    .highlight-card h4 { 
      font-size: 12px; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
      margin-bottom: 8px; 
    }
    .highlight-card.strength h4 { color: #16a34a; }
    .highlight-card.growth h4 { color: #d97706; }
    .highlight-card p { 
      font-size: 14px; 
      color: #334155;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section-title { 
      font-size: 18px; 
      font-weight: 600; 
      color: #1a1a2e; 
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .category { 
      background: #fff; 
      border: 1px solid #e2e8f0; 
      border-radius: 10px; 
      margin-bottom: 16px;
      overflow: hidden;
    }
    .category-header { 
      padding: 16px 20px; 
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .category-name { 
      font-size: 16px; 
      font-weight: 600; 
      color: #1a1a2e; 
    }
    .stars { 
      color: #eab308; 
      font-size: 16px;
      margin-top: 4px;
    }
    .rating-label { 
      font-size: 13px; 
      color: #64748b;
      margin-top: 2px;
    }
    .category-content { 
      padding: 20px; 
    }
    .feedback-section { 
      margin-bottom: 16px; 
      padding: 14px;
      border-radius: 8px;
    }
    .feedback-section:last-child { margin-bottom: 0; }
    .feedback-section.working { background: #f0fdf4; }
    .feedback-section.growth { background: #fef3c7; }
    .feedback-section.try { background: #eff6ff; }
    .feedback-section h5 { 
      font-size: 13px; 
      font-weight: 600; 
      margin-bottom: 8px;
    }
    .feedback-section.working h5 { color: #16a34a; }
    .feedback-section.growth h5 { color: #d97706; }
    .feedback-section.try h5 { color: #2563eb; }
    .feedback-section p { 
      font-size: 14px; 
      color: #334155;
    }
    .timestamp { 
      display: inline-block;
      background: #dbeafe; 
      color: #1e40af; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 13px;
      font-weight: 500;
    }
    .quote { 
      font-style: italic; 
      color: #4b5563;
      border-left: 3px solid #6366f1;
      padding-left: 12px;
      margin: 8px 0;
      display: block;
    }
    .lead-phase { 
      background: #fff; 
      border: 1px solid #e2e8f0; 
      border-radius: 10px; 
      padding: 20px;
      margin-bottom: 16px;
    }
    .lead-phase h4 { 
      font-size: 16px; 
      font-weight: 600; 
      color: #6366f1;
      margin-bottom: 12px;
    }
    .lead-phase ul { 
      padding-left: 20px; 
      margin-bottom: 12px;
    }
    .lead-phase li { 
      font-size: 14px; 
      color: #334155;
      margin-bottom: 6px;
    }
    .transcript { 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
      border-radius: 10px; 
      padding: 20px;
    }
    .transcript h4 { 
      font-size: 14px; 
      font-weight: 600; 
      color: #64748b;
      margin-bottom: 12px;
    }
    .transcript-content { 
      font-size: 13px; 
      color: #475569;
      white-space: pre-wrap;
      line-height: 1.7;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer p { 
      font-size: 13px; 
      color: #64748b;
    }
    .encouragement { 
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin-top: 30px;
    }
    .encouragement p { 
      font-size: 15px; 
      color: #4338ca;
      font-weight: 500;
    }
    @media print {
      body { padding: 20px; }
      .category, .lead-phase { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✨ Your Session Analysis Report</h1>
    <p class="subtitle">${modeText} • ${date}</p>
  </div>

  <div class="celebration">
    <h2>🌟 Well Done on Reflecting on Your Practice!</h2>
    <p>Taking time to review and improve your teaching shows real dedication to your students' success.</p>
  </div>

  <div class="summary-box">
    <p>${feedback.overallSummary}</p>
    <div class="highlight-grid">
      <div class="highlight-card strength">
        <h4>🏆 Top Strength</h4>
        <p>${feedback.topStrength}</p>
      </div>
      <div class="highlight-card growth">
        <h4>🎯 Priority Growth Area</h4>
        <p>${feedback.priorityGrowthArea}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">⭐ Your Teaching Practice Analysis</h3>
    ${feedback.categories.map(cat => `
    <div class="category">
      <div class="category-header">
        <div class="category-name">${cat.name}</div>
        <div class="stars">${'★'.repeat(cat.rating)}${'☆'.repeat(4 - cat.rating)}</div>
        <div class="rating-label">${starRatingLabels[cat.rating]}</div>
      </div>
      <div class="category-content">
        <div class="feedback-section working">
          <h5>✓ What's Working Well</h5>
          <p>${cat.whatsWorking}</p>
        </div>
        <div class="feedback-section growth">
          <h5>→ Your Growth Edge</h5>
          <p>${cat.growthEdge}</p>
        </div>
        <div class="feedback-section try">
          <h5>💡 Try This Next Time</h5>
          <p>${cat.tryThis}</p>
        </div>
      </div>
    </div>
    `).join('')}
  </div>

  ${feedback.leadPhases.length > 0 ? `
  <div class="section">
    <h3 class="section-title">📚 LEAD Phase Analysis</h3>
    ${feedback.leadPhases.map(phase => `
    <div class="lead-phase">
      <h4>${phase.phase} - ${ratingLabels[phase.rating]}</h4>
      <strong style="font-size: 13px; color: #64748b;">Observations:</strong>
      <ul>
        ${phase.observations.map(obs => `<li>${obs}</li>`).join('')}
      </ul>
      ${phase.suggestions.length > 0 ? `
      <strong style="font-size: 13px; color: #64748b;">Suggestions:</strong>
      <ul>
        ${phase.suggestions.map(sug => `<li>${sug}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${transcript ? `
  <div class="section">
    <div class="transcript">
      <h4>📝 Anonymized Transcript</h4>
      <div class="transcript-content">${transcript}</div>
    </div>
  </div>
  ` : ''}

  <div class="encouragement">
    <p>Remember: Great teaching is a journey, not a destination. Every lesson is an opportunity to grow! 💪</p>
  </div>

  <div class="footer">
    <p>Generated by Power Skills Session Analysis</p>
    <p style="margin-top: 8px; font-size: 12px; color: #94a3b8;">This report was generated using AI analysis. All student names have been anonymized for privacy.</p>
  </div>
</body>
</html>
`;

    // Open in new window for easy print-to-PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-heading font-semibold text-foreground">
            Analysing Your Session
          </h3>
          <p className="text-muted-foreground max-w-md">
            {getLoadingMessage()}
          </p>
          <p className="text-sm text-muted-foreground/70">
            Looking for specific moments and quotes to give you targeted feedback...
          </p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="section-fade-in space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-full">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Analysis Complete!</span>
        </div>
        <h2 className="text-3xl font-heading font-semibold text-foreground">
          Great Work Reflecting on Your Practice
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Here's your personalised feedback with specific moments from your session
        </p>
      </div>

      {/* Overall Summary - Warm Card */}
      <div className="card-elevated p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <p className="text-lg text-foreground leading-relaxed mb-6">{feedback.overallSummary}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-5 bg-success/10 rounded-xl border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-success" />
              <p className="text-sm font-semibold text-success">Your Top Strength</p>
            </div>
            <p className="text-foreground">{feedback.topStrength}</p>
          </div>
          <div className="p-5 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-600">Priority Growth Area</p>
            </div>
            <p className="text-foreground">{feedback.priorityGrowthArea}</p>
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="card-elevated overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Your Teaching Strengths & Growth Areas</h3>
              <p className="text-sm text-muted-foreground">Click each category to see detailed feedback with specific moments</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {feedback.categories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground text-left">{category.name}</span>
                  <div className="flex items-center gap-2">
                    {renderStars(category.rating)}
                    <span className={cn("text-sm font-medium", starRatingColors[category.rating])}>
                      {starRatingLabels[category.rating]}
                    </span>
                  </div>
                </div>
                {expandedCategories.includes(category.name) ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {expandedCategories.includes(category.name) && (
                <div className="px-5 pb-6 space-y-4 animate-fade-in">
                  <div className="p-4 bg-success/5 rounded-xl border border-success/15">
                    <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                      <span className="text-base">✓</span> What's Working Well
                    </h4>
                    <p 
                      className="text-foreground leading-relaxed evidence-text"
                      dangerouslySetInnerHTML={{ __html: formatTextWithEvidence(category.whatsWorking) }}
                    />
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
                    <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                      <span className="text-base">→</span> Your Growth Edge
                    </h4>
                    <p 
                      className="text-foreground leading-relaxed evidence-text"
                      dangerouslySetInnerHTML={{ __html: formatTextWithEvidence(category.growthEdge) }}
                    />
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <span className="text-base">💡</span> Try This Next Time
                    </h4>
                    <p 
                      className="text-foreground leading-relaxed evidence-text"
                      dangerouslySetInnerHTML={{ __html: formatTextWithEvidence(category.tryThis) }}
                    />
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
          <div className="p-5 bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">LEAD Phase Analysis</h3>
                <p className="text-sm text-muted-foreground">How you performed in each lesson phase</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {feedback.leadPhases.map((phase) => (
              <div key={phase.phase}>
                <button
                  onClick={() => togglePhase(phase.phase)}
                  className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {phase.phase[0]}
                    </span>
                    <span className="font-semibold text-foreground text-lg">{phase.phase}</span>
                    <span
                      className={cn(
                        "text-sm px-3 py-1.5 rounded-full border font-medium",
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
                  <div className="px-5 pb-6 pl-20 space-y-4 animate-fade-in">
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Observations
                      </h4>
                      <ul className="space-y-2">
                        {phase.observations.map((obs, i) => (
                          <li 
                            key={i} 
                            className="text-foreground flex items-start gap-3 evidence-text"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span dangerouslySetInnerHTML={{ __html: formatTextWithEvidence(obs) }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    {phase.suggestions.length > 0 && (
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/15">
                        <h4 className="text-sm font-semibold text-accent mb-3">
                          Suggestions for Next Time
                        </h4>
                        <ul className="space-y-2">
                          {phase.suggestions.map((sug, i) => (
                            <li 
                              key={i} 
                              className="text-foreground flex items-start gap-3 evidence-text"
                            >
                              <span className="text-accent mt-1">→</span>
                              <span dangerouslySetInnerHTML={{ __html: formatTextWithEvidence(sug) }} />
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
            className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">View Anonymised Transcript</span>
            </div>
            {showTranscript ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {showTranscript && (
            <div className="p-5 border-t border-border animate-fade-in">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-secondary/20 p-4 rounded-lg">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button onClick={handleDownload} size="lg" className="gap-2">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="w-5 h-5" />
          Start New Analysis
        </Button>
      </div>

      {/* Encouragement Footer */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-6 text-center space-y-2">
        <p className="text-foreground font-medium">
          Remember: Great teaching is a journey, not a destination. 
        </p>
        <p className="text-muted-foreground text-sm">
          Every lesson is an opportunity to grow. Keep up the fantastic work! 💪
        </p>
      </div>

      {/* Privacy Reminder */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>Privacy Note:</strong> No data has been stored. All analysis data will be 
          cleared when you close this browser tab.
        </p>
      </div>
    </div>
  );
}