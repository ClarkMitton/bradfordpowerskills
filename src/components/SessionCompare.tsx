import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ComparisonData {
  sessionA: { mvpMoment: string };
  sessionB: { mvpMoment: string };
  embedding?: string | null;
  growth?: string | null;
  resolved?: string | null;
  persistent?: string | null;
  standardEnglishTrajectory?: string | null;
}

interface ReportForComparison {
  mvpMoment: string;
  overallSummary: string;
  ittecfIndicators: Array<{
    standard: string;
    subCode: string;
    statement: string;
    status: "demonstrated" | "not_yet_evidenced";
  }>;
  categories: Array<{
    name: string;
    toMakeStronger: string;
    rating: string | number;
  }>;
  standardEnglishFeedback: string;
}

interface ParsedReport {
  filename: string;
  date: Date | null;
  mvpLabel: string;
  summaryPreview: string;
  forComparison: ReportForComparison;
}

interface UploadedSlot {
  file: File;
  parsed: ParsedReport;
}

// ── Parsing ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractComparisonData = (data: any): ReportForComparison => ({
  mvpMoment: data.sessionMvp?.pedagogyHighlight || data.sessionMvp?.moment?.split(".")[0] || "Teaching session",
  overallSummary: data.overallSummary || "",
  ittecfIndicators: (data.ittecfIndicators || []).map((ind: any) => ({
    standard: ind.standard || "",
    subCode: ind.subCode || "",
    statement: ind.statement || "",
    status: ind.status === "demonstrated" ? "demonstrated" : "not_yet_evidenced",
  })),
  categories: (data.categories || []).map((cat: any) => ({
    name: cat.name || "",
    toMakeStronger: cat.toMakeStronger || cat.growthEdge || "",
    rating: cat.rating,
  })),
  standardEnglishFeedback: data.standardEnglish?.feedback || "",
});

const parseHtmlReport = (htmlContent: string, filename: string): ParsedReport => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const scriptEl = doc.getElementById("powered-report-data");

  if (!scriptEl?.textContent?.trim()) {
    throw new Error(
      'This file doesn\'t contain embedded report data. Use the "Save for Comparison" button in a PowerED report to download a compatible HTML file.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(scriptEl.textContent);
  } catch {
    throw new Error("The report file appears corrupted. Please re-download it from PowerED.");
  }

  // Determine date: _generatedAt in JSON first, then filename timestamp
  let date: Date | null = null;
  if (data._generatedAt) {
    date = new Date(data._generatedAt);
  } else {
    const m = filename.match(/powered-report-(\d+)\.html?/i);
    if (m) date = new Date(parseInt(m[1]));
  }

  const forComparison = extractComparisonData(data);
  const summary = data.overallSummary || "";

  return {
    filename,
    date,
    mvpLabel: forComparison.mvpMoment,
    summaryPreview: summary.length > 140 ? summary.slice(0, 140) + "…" : summary,
    forComparison,
  };
};

// ── Upload zone sub-component ─────────────────────────────────────────────────

interface UploadZoneProps {
  label: string;
  slot: UploadedSlot | null;
  error: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

function UploadZone({ label, slot, error, onFile, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div className="space-y-2 flex-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all min-h-[140px] flex items-center justify-center",
          isDragging && "border-primary bg-primary/5",
          !isDragging && !slot && !error && "border-border hover:border-primary/50 hover:bg-secondary/30",
          slot && "border-success bg-success/5",
          error && "border-destructive/50 bg-destructive/5"
        )}
      >
        {slot ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate max-w-[200px] mx-auto">
                {slot.parsed.filename}
              </p>
              {slot.parsed.date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {slot.parsed.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept=".html,.htm"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-3 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drop report here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SessionCompareProps {
  onComplete: (result: ComparisonData) => void;
}

export function SessionCompare({ onComplete }: SessionCompareProps) {
  const [slotA, setSlotA] = useState<UploadedSlot | null>(null);
  const [slotB, setSlotB] = useState<UploadedSlot | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [needsManualOrder, setNeedsManualOrder] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File, slot: "A" | "B") => {
      const setError = slot === "A" ? setErrorA : setErrorB;
      const setSlot = slot === "A" ? setSlotA : setSlotB;
      setError(null);
      setAnalysisError(null);
      setNeedsManualOrder(false);

      if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
        setError('Please upload an HTML file. Use "Save for Comparison" in a PowerED report to get one.');
        return;
      }

      file
        .text()
        .then((content) => {
          const parsed = parseHtmlReport(content, file.name);
          setSlot({ file, parsed });
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to read the report file.");
        });
    },
    []
  );

  const bothReady = slotA && slotB;

  // Auto-determine order from timestamps
  const getAutoOrdering = (): { earlier: ParsedReport; later: ParsedReport } | null => {
    if (!slotA || !slotB) return null;
    if (slotA.parsed.date && slotB.parsed.date) {
      if (slotA.parsed.date.getTime() !== slotB.parsed.date.getTime()) {
        return slotA.parsed.date < slotB.parsed.date
          ? { earlier: slotA.parsed, later: slotB.parsed }
          : { earlier: slotB.parsed, later: slotA.parsed };
      }
    }
    return null;
  };

  const runAnalysis = async (earlier: ParsedReport, later: ParsedReport) => {
    setIsAnalysing(true);
    setAnalysisError(null);
    setNeedsManualOrder(false);

    try {
      const { data, error } = await supabase.functions.invoke("compare-sessions", {
        body: {
          reportA: earlier.forComparison,
          reportB: later.forComparison,
        },
      });

      if (error) throw new Error(error.message || "Comparison failed");
      onComplete(data as ComparisonData);
    } catch (err) {
      setIsAnalysing(false);
      setAnalysisError(
        err instanceof Error ? err.message : "Comparison failed. Please try again."
      );
    }
  };

  const handleAnalyse = () => {
    if (!bothReady) return;
    const autoOrder = getAutoOrdering();
    if (autoOrder) {
      runAnalysis(autoOrder.earlier, autoOrder.later);
    } else {
      setNeedsManualOrder(true);
    }
  };

  // ── Loading state
  if (isAnalysing) {
    return (
      <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-heading font-semibold text-foreground">
            Analysing Your Teaching Journey
          </h3>
          <p className="text-muted-foreground max-w-md">
            Comparing both sessions to identify growth, embedded practice, and your next development focus…
          </p>
        </div>
      </div>
    );
  }

  // ── Manual order picker
  if (needsManualOrder && slotA && slotB) {
    return (
      <div className="section-fade-in space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Which Session Came First?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn't determine the order automatically. Select which session was earlier in your teaching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[slotA, slotB].map((slot) => (
            <div key={slot.file.name} className="card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{slot.parsed.filename}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">MVP Moment</p>
                <p className="text-sm font-medium text-foreground">{slot.parsed.mvpLabel}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</p>
                <p className="text-sm text-muted-foreground">{slot.parsed.summaryPreview}</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  const earlier = slot.parsed;
                  const later = slot === slotA ? slotB.parsed : slotA.parsed;
                  runAnalysis(earlier, later);
                }}
              >
                This one was first
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setNeedsManualOrder(false)}>
            ← Go back
          </Button>
        </div>
      </div>
    );
  }

  // ── Main upload view
  const autoOrder = bothReady ? getAutoOrdering() : null;

  return (
    <div className="section-fade-in space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Upload Your Two Reports
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload two reports you've previously downloaded from PowerED using <strong>Save for Comparison</strong>. We'll work out which came first automatically.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <UploadZone
          label="First Report (HTML file)"
          slot={slotA}
          error={errorA}
          onFile={(f) => handleFile(f, "A")}
          onClear={() => { setSlotA(null); setErrorA(null); setNeedsManualOrder(false); }}
        />
        <UploadZone
          label="Second Report (HTML file)"
          slot={slotB}
          error={errorB}
          onFile={(f) => handleFile(f, "B")}
          onClear={() => { setSlotB(null); setErrorB(null); setNeedsManualOrder(false); }}
        />
      </div>

      {/* Order status */}
      {bothReady && (
        <div className={cn(
          "p-4 rounded-xl border text-sm",
          autoOrder
            ? "bg-success/5 border-success/20 text-success"
            : "bg-amber-500/5 border-amber-500/20 text-amber-700"
        )}>
          {autoOrder ? (
            <p>
              ✓ Order detected automatically — <strong>{autoOrder.earlier.filename}</strong> is earlier,{" "}
              <strong>{autoOrder.later.filename}</strong> is later.
            </p>
          ) : (
            <p>
              ⚠ Couldn't determine order automatically — you'll be asked to confirm which session came first.
            </p>
          )}
        </div>
      )}

      {analysisError && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{analysisError}</p>
        </div>
      )}

      {/* Help */}
      <div className="bg-muted/50 rounded-xl p-5 space-y-2">
        <p className="text-sm font-semibold text-foreground">How to get compatible reports</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Run a PowerED feedback session (Audio Only or Deep Dive)</li>
          <li>On the results page, click <strong>Save for Comparison</strong></li>
          <li>Upload both saved HTML files here to compare your progress</li>
        </ol>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          className="gap-2"
          disabled={!bothReady}
          onClick={handleAnalyse}
        >
          <Sparkles className="w-5 h-5" />
          Analyse My Development
        </Button>
      </div>
    </div>
  );
}
