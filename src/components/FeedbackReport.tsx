import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Target,
  Star,
  Sparkles,
  Heart,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedPhase } from "./PhaseSelector";
import { PedagogicalTooltip, PEDAGOGICAL_TERMS } from "./PedagogicalTooltip";

interface ResearchSuggestion {
  technique: string;
  howToImplement: string;
  whyItWorks: string;
  example: string;
}

interface CategoryFeedback {
  name: string;
  rating: number;
  summary?: string;
  whatsWorking: string;
  evidenceStrengths?: string[];
  toMakeStronger?: string;
  growthEdge?: string; // Legacy support
  areasForDevelopment?: string[];
  missedOpportunities?: string[];
  tryThisNext?: string;
  tryThis?: string; // Legacy support
  researchSuggestion?: ResearchSuggestion;
}

interface SessionMvp {
  moment: string;
  pedagogyHighlight: string;
}

interface ComparativeData {
  previousRating: number;
  ratingChange: number;
  improvementNotes: string;
  focusAreas: string[];
}

interface LEADPhaseFeedback {
  phase: string;
  rating: "exemplary" | "solid" | "developing" | "emerging";
  observations: string[];
  suggestions: string[];
}

type OfstedGradeType = "exceptional" | "strong_standard" | "expected_standard" | "needs_attention" | "urgent_improvement";

interface OfstedGrade {
  grade: OfstedGradeType;
  summary: string;
  strengths: string[];
  areasForDevelopment?: string[];
  caveat?: string;
}

interface FeedbackData {
  sessionMvp?: SessionMvp;
  categories: CategoryFeedback[];
  leadPhases: LEADPhaseFeedback[];
  ofstedGrade?: OfstedGrade;
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
  onRetry?: () => void;
  error?: string | null;
  mode: AnalysisMode;
  selectedPhases: SelectedPhase[];
}

const ratingLabels: Record<string, string> = {
  exemplary: "Exemplary Practice",
  solid: "Solid Foundation",
  developing: "Developing Practice",
  emerging: "Emerging Practice",
};

const ratingColors: Record<string, string> = {
  exemplary: "bg-success/10 text-success border-success/30",
  solid: "bg-primary/10 text-primary border-primary/30",
  developing: "bg-warning/10 text-warning border-warning/30",
  emerging: "bg-accent/10 text-accent border-accent/30",
};

const starRatingLabels: Record<number, string> = {
  4: "Exemplary Practice",
  3: "Solid Foundation",
  2: "Developing Practice",
  1: "Emerging Practice",
};

const starRatingColors: Record<number, string> = {
  4: "text-success",
  3: "text-primary",
  2: "text-warning",
  1: "text-accent",
};

// Helper to highlight quotes in text (non-pedagogical formatting)
const formatQuotesOnly = (text: string) => {
  const quoteRegex = /"([^"]+)"/g;
  return text.replace(quoteRegex, '<span class="quote-text">"$1"</span>');
};

// Strip inline bracket explanations after pedagogical terms OR any italic phrase.
// This ensures tooltips carry the meaning instead of inline brackets.
// Examples we remove:
// - cold calling (randomly selecting students)
// - *wait time* (the pause after asking a question)
// - *diagnostic questioning* (probing to understand thinking)
// - retrieval practice [brief explanation]
const stripPedagogicalExplanations = (text: string, terms: string[]) => {
  if (!text) return text;

  let result = text;

  // First: Strip brackets after ANY italic phrase *something* (...) or *something* [...]
  // This catches ALL pedagogical terms the AI might italicise, even ones not in our dictionary
  const italicBracketPattern = /(\*[^*]+\*)\s*(?:\([^)]+\)|\[[^\]]+\])/g;
  result = result.replace(italicBracketPattern, '$1');

  // Second: Strip brackets after known terms (non-italicised)
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  const escaped = sortedTerms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const termPattern = new RegExp(
    `\\b(${escaped})\\b\\s*(?:\\([^)]+\\)|\\[[^\\]]+\\])`,
    "gi"
  );
  result = result.replace(termPattern, '$1');

  return result;
};

// Render text with pedagogical tooltips for both standalone terms and *italic* wrapped terms
const renderWithTooltips = (text: string): React.ReactNode => {
  const terms = Object.keys(PEDAGOGICAL_TERMS);
  const cleaned = stripPedagogicalExplanations(text, terms);

  const parts: React.ReactNode[] = [];
  let key = 0;

  // First, split by italic markers *term* which often contain pedagogical terms
  // Pattern matches: *any text* (italic markers from AI)
  const italicPattern = /\*([^*]+)\*/g;

  // Create pattern for known pedagogical terms (for non-italic matches)
  const termPattern = new RegExp(
    `\\b(${terms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b`,
    "gi"
  );

  let lastIndex = 0;
  let match;

  // Process italic-wrapped terms first
  while ((match = italicPattern.exec(cleaned)) !== null) {
    // Add text before the match (check for pedagogical terms in it)
    if (match.index > lastIndex) {
      const beforeText = cleaned.slice(lastIndex, match.index);
      parts.push(...processTextForTerms(beforeText, termPattern, key));
      key += 100; // Increment to avoid key collisions
    }

    const italicContent = match[1];
    const termLower = italicContent.toLowerCase();

    // Check if this italic text is a known pedagogical term
    const matchedTerm = terms.find((t) => termLower.includes(t.toLowerCase()));

    if (matchedTerm) {
      // It's a pedagogical term - wrap in tooltip
      parts.push(
        <PedagogicalTooltip key={`italic-${key++}`} term={matchedTerm}>
          {italicContent}
        </PedagogicalTooltip>
      );
    } else {
      // Just render as italic with emphasis styling
      parts.push(
        <em key={`italic-em-${key++}`} className="text-primary/80 font-medium">
          {italicContent}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text (check for pedagogical terms in it)
  if (lastIndex < cleaned.length) {
    const remainingText = cleaned.slice(lastIndex);
    parts.push(...processTextForTerms(remainingText, termPattern, key));
  }

  return parts.length > 0 ? (
    <>{parts}</>
  ) : (
    <span dangerouslySetInnerHTML={{ __html: formatQuotesOnly(cleaned) }} />
  );
};

// Helper to process text segments for pedagogical terms
const processTextForTerms = (text: string, termPattern: RegExp, startKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = startKey;
  let lastIndex = 0;
  
  // Reset regex
  termPattern.lastIndex = 0;
  
  let match;
  while ((match = termPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(
        <span key={`text-${key++}`} dangerouslySetInnerHTML={{ __html: formatQuotesOnly(beforeText) }} />
      );
    }
    
    // Add tooltip for the matched term
    parts.push(
      <PedagogicalTooltip key={`term-${key++}`} term={match[1]}>
        {match[0]}
      </PedagogicalTooltip>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-end-${key++}`} dangerouslySetInnerHTML={{ __html: formatQuotesOnly(text.slice(lastIndex)) }} />
    );
  }
  
  return parts;
};

// For evidence lists - format quotes only (terms should be in main text)
const renderFormattedText = (text: string) => {
  return renderWithTooltips(text);
};

export function FeedbackReport({
  feedback,
  transcript,
  isLoading,
  onReset,
  onRetry,
  error,
  mode,
  selectedPhases,
}: FeedbackReportProps) {
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
<html lang="en-GB">
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
    .category-summary {
      font-size: 14px;
      color: #64748b;
      margin-top: 8px;
      font-style: italic;
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
    .feedback-section.stronger { background: #fef3c7; }
    .feedback-section.try { background: #eff6ff; }
    .feedback-section.evidence { background: #f8fafc; }
    .feedback-section.research { background: #faf5ff; border: 1px solid #e9d5ff; }
    .feedback-section h5 { 
      font-size: 13px; 
      font-weight: 600; 
      margin-bottom: 8px;
    }
    .feedback-section.working h5 { color: #16a34a; }
    .feedback-section.stronger h5 { color: #d97706; }
    .feedback-section.try h5 { color: #2563eb; }
    .feedback-section.evidence h5 { color: #475569; }
    .feedback-section.research h5 { color: #7c3aed; }
    .feedback-section p, .feedback-section li { 
      font-size: 14px; 
      color: #334155;
    }
    .feedback-section ul {
      padding-left: 20px;
      margin-top: 8px;
    }
    .feedback-section li {
      margin-bottom: 6px;
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

  ${feedback.sessionMvp ? `
  <div class="mvp-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <div style="font-size: 40px;">🏆</div>
      <div>
        <h3 style="color: #b45309; font-size: 18px; margin-bottom: 8px;">⭐ Session MVP Moment ⭐</h3>
        <p style="font-size: 13px; color: #92400e; margin-bottom: 12px; font-weight: 600;">${feedback.sessionMvp.pedagogyHighlight}</p>
        <p style="color: #78350f; font-size: 15px; line-height: 1.6;">${feedback.sessionMvp.moment}</p>
      </div>
    </div>
  </div>
  ` : ''}

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
        ${cat.summary ? `<div class="category-summary">${cat.summary}</div>` : ''}
      </div>
      <div class="category-content">
        <div class="feedback-section working">
          <h5>✓ What's Working Well</h5>
          <p>${cat.whatsWorking}</p>
          ${cat.evidenceStrengths && cat.evidenceStrengths.length > 0 ? `
          <ul>
            ${cat.evidenceStrengths.map(e => `<li>${e}</li>`).join('')}
          </ul>
          ` : ''}
        </div>
        <div class="feedback-section stronger">
          <h5>→ To Make It Even Stronger</h5>
          <p>${cat.toMakeStronger || cat.growthEdge || ""}</p>
          ${cat.areasForDevelopment && cat.areasForDevelopment.length > 0 ? `
          <ul>
            ${cat.areasForDevelopment.map(a => `<li>${a}</li>`).join('')}
          </ul>
          ` : ''}
          ${cat.missedOpportunities && cat.missedOpportunities.length > 0 ? `
          <p style="margin-top: 12px; font-weight: 600; font-size: 12px; color: #92400e;">Missed Opportunities:</p>
          <ul>
            ${cat.missedOpportunities.map(m => `<li>${m}</li>`).join('')}
          </ul>
          ` : ''}
        </div>
        <div class="feedback-section try">
          <h5>💡 Try This Next Time</h5>
          <p>${cat.tryThisNext || cat.tryThis || ""}</p>
        </div>
        ${cat.researchSuggestion ? `
        <div class="feedback-section research">
          <h5>📚 Research-Informed Suggestion: ${cat.researchSuggestion.technique}</h5>
          <p><strong>How to implement:</strong> ${cat.researchSuggestion.howToImplement}</p>
          <p><strong>Why it works:</strong> ${cat.researchSuggestion.whyItWorks}</p>
          <p><strong>Example:</strong> <em>"${cat.researchSuggestion.example}"</em></p>
        </div>
        ` : ''}
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

  ${feedback.ofstedGrade ? `
  <div class="section">
    <h3 class="section-title">🎓 How Would Ofsted Rate This?</h3>
    <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px; padding: 24px; border: 2px solid #818cf8;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 12px 24px; border-radius: 50px; font-size: 18px; font-weight: bold; ${
          feedback.ofstedGrade.grade === 'exceptional' ? 'background: #d1fae5; color: #047857; border: 2px solid #34d399;' :
          feedback.ofstedGrade.grade === 'strong_standard' ? 'background: #dbeafe; color: #1d4ed8; border: 2px solid #60a5fa;' :
          feedback.ofstedGrade.grade === 'expected_standard' ? 'background: #fef3c7; color: #b45309; border: 2px solid #fbbf24;' :
          feedback.ofstedGrade.grade === 'needs_attention' ? 'background: #ffedd5; color: #c2410c; border: 2px solid #fb923c;' :
          'background: #fee2e2; color: #b91c1c; border: 2px solid #f87171;'
        }">
          ${feedback.ofstedGrade.grade === 'exceptional' ? '✨ Exceptional' :
            feedback.ofstedGrade.grade === 'strong_standard' ? '⭐ Strong Standard' :
            feedback.ofstedGrade.grade === 'expected_standard' ? '✓ Expected Standard' :
            feedback.ofstedGrade.grade === 'needs_attention' ? '⚠ Needs Attention' :
            '🚨 Urgent Improvement'}
        </span>
      </div>
      <p style="color: #334155; font-size: 15px; margin-bottom: 16px;">${feedback.ofstedGrade.summary}</p>
      ${feedback.ofstedGrade.strengths && feedback.ofstedGrade.strengths.length > 0 ? `
      <div style="background: #f0fdf4; padding: 14px; border-radius: 8px; margin-bottom: 12px;">
        <h5 style="color: #16a34a; font-size: 13px; font-weight: 600; margin-bottom: 8px;">✓ Observable Strengths</h5>
        <ul style="padding-left: 20px;">
          ${feedback.ofstedGrade.strengths.map(s => `<li style="color: #334155; font-size: 14px; margin-bottom: 4px;">${s}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ${feedback.ofstedGrade.areasForDevelopment && feedback.ofstedGrade.areasForDevelopment.length > 0 ? `
      <div style="background: #fef3c7; padding: 14px; border-radius: 8px; margin-bottom: 12px;">
        <h5 style="color: #b45309; font-size: 13px; font-weight: 600; margin-bottom: 8px;">→ Areas for Development</h5>
        <ul style="padding-left: 20px;">
          ${feedback.ofstedGrade.areasForDevelopment.map(a => `<li style="color: #334155; font-size: 14px; margin-bottom: 4px;">${a}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ${feedback.ofstedGrade.caveat ? `
      <p style="color: #64748b; font-size: 13px; font-style: italic; padding: 10px; background: #f8fafc; border-radius: 6px;">
        <strong style="font-style: normal;">Note:</strong> ${feedback.ofstedGrade.caveat}
      </p>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="encouragement">
    <p>Remember: Great teaching is a journey, not a destination. Every lesson is an opportunity to grow! 💪</p>
  </div>

  <div class="footer">
    <p>Generated by Power Skills Session Analysis</p>
    <p style="margin-top: 8px; font-size: 12px; color: #94a3b8;">This report was generated using AI analysis. All student names have been anonymised for privacy.</p>
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
    return (
      <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-heading font-semibold text-foreground">
            Analysis Couldn't Complete
          </h3>
          <p className="text-muted-foreground max-w-md">
            {error || "Something went wrong during the analysis. Your transcript is safe - you can try again."}
          </p>
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={onReset} className="gap-2">
            Start Over
          </Button>
        </div>
      </div>
    );
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

      {/* Session MVP - The Star Moment */}
      {feedback.sessionMvp && (
        <div className="card-elevated p-6 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border-2 border-yellow-500/30 relative overflow-hidden">
          <div className="absolute top-3 right-3 flex gap-1">
            <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
            <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
            <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
          </div>
          <details className="group">
            <summary className="flex items-center gap-4 cursor-pointer list-none">
              <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-700 flex items-center gap-2">
                  ⭐ Session MVP Moment ⭐
                </h3>
                <p className="text-sm text-yellow-600/80 font-medium">{feedback.sessionMvp.pedagogyHighlight}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-yellow-600 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 pt-4 border-t border-yellow-500/20">
              <p className="text-foreground leading-relaxed text-lg">
                {renderWithTooltips(feedback.sessionMvp.moment)}
              </p>
            </div>
          </details>
        </div>
      )}

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
              <h3 className="font-semibold text-foreground text-lg">Your Teaching Practice Analysis</h3>
              <p className="text-sm text-muted-foreground">Click each domain to see detailed feedback with specific moments</p>
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
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground text-left">{category.name}</span>
                    <div className="flex items-center gap-2">
                      {renderStars(category.rating)}
                      <span className={cn("text-sm font-medium", starRatingColors[category.rating])}>
                        {starRatingLabels[category.rating]}
                      </span>
                    </div>
                  </div>
                  {category.summary && (
                    <p className="text-sm text-muted-foreground text-left italic">{category.summary}</p>
                  )}
                </div>
                {expandedCategories.includes(category.name) ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {expandedCategories.includes(category.name) && (
                <div className="px-5 pb-6 space-y-4 animate-fade-in">
                  {/* What's Working Well */}
                  <div className="p-4 bg-success/5 rounded-xl border border-success/15">
                    <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                      <span className="text-base">✓</span> What's Working Well
                    </h4>
                    <p className="text-foreground leading-relaxed mb-3">
                      {renderWithTooltips(category.whatsWorking)}
                    </p>
                    {category.evidenceStrengths && category.evidenceStrengths.length > 0 && (
                      <ul className="space-y-2 mt-3 border-t border-success/10 pt-3">
                        {category.evidenceStrengths.map((evidence, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            {renderFormattedText(evidence)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* To Make It Even Stronger */}
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
                    <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                      <span className="text-base">→</span> To Make It Even Stronger
                    </h4>
                    <p className="text-foreground leading-relaxed mb-3">
                      {renderWithTooltips(category.toMakeStronger || category.growthEdge || "")}
                    </p>
                    {category.areasForDevelopment && category.areasForDevelopment.length > 0 && (
                      <ul className="space-y-2 mt-3 border-t border-amber-500/10 pt-3">
                        {category.areasForDevelopment.map((area, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {renderFormattedText(area)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {category.missedOpportunities && category.missedOpportunities.length > 0 && (
                      <div className="mt-3 border-t border-amber-500/10 pt-3">
                        <p className="text-xs font-semibold text-amber-700 mb-2">Missed Opportunities:</p>
                        <ul className="space-y-1">
                          {category.missedOpportunities.map((missed, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-amber-400">–</span>
                              {missed}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Try This Next Time */}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <span className="text-base">💡</span> Try This Next Time
                    </h4>
                    <p className="text-foreground leading-relaxed">
                      {renderWithTooltips(category.tryThisNext || category.tryThis || "")}
                    </p>
                  </div>

                  {/* Research-Informed Suggestion */}
                  {category.researchSuggestion && (
                    <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/15">
                      <h4 className="text-sm font-semibold text-purple-600 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Research-Informed Suggestion: {category.researchSuggestion.technique}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground">
                          <span className="font-medium text-purple-700">How to implement:</span>{" "}
                          {category.researchSuggestion.howToImplement}
                        </p>
                        <p className="text-foreground">
                          <span className="font-medium text-purple-700">Why it works:</span>{" "}
                          {category.researchSuggestion.whyItWorks}
                        </p>
                        <p className="text-foreground italic">
                          <span className="font-medium text-purple-700 not-italic">Example:</span>{" "}
                          "{category.researchSuggestion.example}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LEAD Phase Analysis */}
      {feedback.leadPhases && feedback.leadPhases.length > 0 && (
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
                            className="text-foreground flex items-start gap-3"
                          >
                            <span className="text-primary mt-1">•</span>
                            {renderFormattedText(obs)}
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
                              className="text-foreground flex items-start gap-3"
                            >
                              <span className="text-accent mt-1">→</span>
                              {renderFormattedText(sug)}
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

      {/* Ofsted Grade Section */}
      {feedback.ofstedGrade && (
        <div className="card-elevated overflow-hidden border-2 border-indigo-500/30">
          <div className="p-5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <span className="text-xl">🎓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">How Would Ofsted Rate This?</h3>
                <p className="text-sm text-muted-foreground">Based on the "Developing Teaching" criteria (November 2025 Framework)</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Grade Badge */}
            <div className="flex items-center justify-center">
              <div className={cn(
                "px-6 py-3 rounded-full text-lg font-bold border-2",
                feedback.ofstedGrade.grade === "exceptional" && "bg-emerald-500/20 text-emerald-700 border-emerald-500/40",
                feedback.ofstedGrade.grade === "strong_standard" && "bg-blue-500/20 text-blue-700 border-blue-500/40",
                feedback.ofstedGrade.grade === "expected_standard" && "bg-amber-500/20 text-amber-700 border-amber-500/40",
                feedback.ofstedGrade.grade === "needs_attention" && "bg-orange-500/20 text-orange-700 border-orange-500/40",
                feedback.ofstedGrade.grade === "urgent_improvement" && "bg-red-500/20 text-red-700 border-red-500/40"
              )}>
                {feedback.ofstedGrade.grade === "exceptional" && "✨ Exceptional"}
                {feedback.ofstedGrade.grade === "strong_standard" && "⭐ Strong Standard"}
                {feedback.ofstedGrade.grade === "expected_standard" && "✓ Expected Standard"}
                {feedback.ofstedGrade.grade === "needs_attention" && "⚠ Needs Attention"}
                {feedback.ofstedGrade.grade === "urgent_improvement" && "🚨 Urgent Improvement"}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-foreground leading-relaxed">{renderWithTooltips(feedback.ofstedGrade.summary)}</p>
            </div>

            {/* Strengths */}
            {feedback.ofstedGrade.strengths && feedback.ofstedGrade.strengths.length > 0 && (
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                <h4 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                  <span className="text-base">✓</span> Observable Strengths
                </h4>
                <ul className="space-y-2">
                  {feedback.ofstedGrade.strengths.map((strength, i) => (
                    <li key={i} className="text-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {renderWithTooltips(strength)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Development */}
            {feedback.ofstedGrade.areasForDevelopment && feedback.ofstedGrade.areasForDevelopment.length > 0 && (
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
                <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                  <span className="text-base">→</span> Areas for Development
                </h4>
                <ul className="space-y-2">
                  {feedback.ofstedGrade.areasForDevelopment.map((area, i) => (
                    <li key={i} className="text-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {renderWithTooltips(area)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Caveat */}
            {feedback.ofstedGrade.caveat && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground italic">
                  <strong className="not-italic">Note:</strong> {feedback.ofstedGrade.caveat}
                </p>
              </div>
            )}
          </div>
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
