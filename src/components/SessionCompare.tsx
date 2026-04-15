import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ITTECFEvidence {
  standard: string;
  title: string;
  sessionA: boolean;
  sessionB: boolean;
}

export interface ComparisonData {
  sessionA: { mvpMoment: string };
  sessionB: { mvpMoment: string };
  embedding?: string | null;
  growth?: string | null;
  resolved?: string | null;
  persistent?: string | null;
  standardEnglishTrajectory?: string | null;
  focusForNextSession?: string | null;
  ittecfEvidence?: ITTECFEvidence[] | null;
}

interface UploadedSlot {
  file: File;
  base64: string;
  filename: string;
}

// ── Upload zone sub-component ─────────────────────────────────────────────────

interface UploadZoneProps {
  label: string;
  slot: UploadedSlot | null;
  error: string | null;
  isLoading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

function UploadZone({ label, slot, error, isLoading, onFile, onClear }: UploadZoneProps) {
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
                {slot.filename}
              </p>
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
        ) : isLoading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Reading PDF...</p>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-3 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drop report here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse (PDF)</p>
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

// ── Helper: file to base64 ───────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Main component ────────────────────────────────────────────────────────────

interface SessionCompareProps {
  onComplete: (result: ComparisonData) => void;
}

export function SessionCompare({ onComplete }: SessionCompareProps) {
  const [slotA, setSlotA] = useState<UploadedSlot | null>(null);
  const [slotB, setSlotB] = useState<UploadedSlot | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File, slot: "A" | "B") => {
      const setError = slot === "A" ? setErrorA : setErrorB;
      const setSlot = slot === "A" ? setSlotA : setSlotB;
      const setLoading = slot === "A" ? setLoadingA : setLoadingB;
      setError(null);
      setAnalysisError(null);
      setLoading(true);

      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError("Please upload a PDF report file.");
        setLoading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Please upload a PDF under 10MB.");
        setLoading(false);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setSlot({ file, base64, filename: file.name });
      } catch {
        setError("Failed to read the PDF file.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const bothReady = slotA && slotB;

  const handleAnalyse = async () => {
    if (!slotA || !slotB) return;
    setIsAnalysing(true);
    setAnalysisError(null);

    try {
      const { data, error } = await supabase.functions.invoke("compare-sessions", {
        body: {
          pdfA: slotA.base64,
          pdfB: slotB.base64,
          filenameA: slotA.filename,
          filenameB: slotB.filename,
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
            Reading both reports and comparing your sessions to identify growth, embedded practice, and your next development focus...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-fade-in space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Upload Your Two Reports
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload two PDF reports you've previously downloaded from PowerED. The AI will read and compare them automatically.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <UploadZone
          label="First Report"
          slot={slotA}
          error={errorA}
          isLoading={loadingA}
          onFile={(f) => handleFile(f, "A")}
          onClear={() => { setSlotA(null); setErrorA(null); }}
        />
        <UploadZone
          label="Second Report"
          slot={slotB}
          error={errorB}
          isLoading={loadingB}
          onFile={(f) => handleFile(f, "B")}
          onClear={() => { setSlotB(null); setErrorB(null); }}
        />
      </div>

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
          <li>On the results page, click <strong>Download Report</strong> to save the PDF</li>
          <li>Upload both saved PDF files here to compare your progress</li>
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
