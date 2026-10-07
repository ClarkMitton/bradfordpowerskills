import { useState, useEffect } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { WelcomeScreen, UserRole } from "@/components/WelcomeScreen";
import { AudioRecorder } from "@/components/AudioRecorder";
import { SessionCapture } from "@/components/SessionCapture";
import { FeedbackReport } from "@/components/FeedbackReport";
import { SessionCompare } from "@/components/SessionCompare";
import { ComparisonReport } from "@/components/ComparisonReport";
import { ProcessingLoader } from "@/components/ProcessingLoader";
import { RotatingInsight } from "@/components/RotatingInsight";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import type { ComparisonData } from "@/components/SessionCompare";

const getStepsForMode = (mode: string | null) => {
  switch (mode) {
    case "quick":
      return [
        { id: 1, label: "Record Audio", shortLabel: "Audio" },
        { id: 2, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "deep-dive":
      return [
        { id: 1, label: "Capture Session", shortLabel: "Capture" },
        { id: 2, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "compare-sessions":
      return [
        { id: 1, label: "Upload Reports", shortLabel: "Upload" },
        { id: 2, label: "View Comparison", shortLabel: "Compare" },
      ];
    default:
      return [];
  }
};


const Index = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);

  const {
    state,
    selectMode,
    handleAudioReady,
    handleSessionCapture,
    handleTranscriptSubmit,
    handlePhaseSelection,
    retryAnalysis,
    resetSession,
    goBack,
    advanceStep,
    setUserRole: setHookUserRole,
  } = useSessionAnalysis();

  const handleReset = () => {
    setUserRole(null);
    setComparisonResult(null);
    resetSession();
  };

  // Sync userRole to hook
  useEffect(() => {
    if (userRole) {
      setHookUserRole(userRole);
    }
  }, [userRole, setHookUserRole]);

  const steps = getStepsForMode(state.mode);

  const renderStep = () => {
    if (state.step === 0) {
      return (
        <WelcomeScreen
          onSelectMode={selectMode}
          onSelectRole={setUserRole}
          selectedRole={userRole}
        />
      );
    }

    // Quick feedback mode flow (audio only)
    if (state.mode === "quick") {
      switch (state.step) {
        case 1:
          return <AudioRecorder onFastFeedback={handleAudioReady} onTranscriptSubmit={handleTranscriptSubmit} />;
        case 2:
          if (state.isTranscribing || (state.isAnalyzing && !state.feedback)) {
            return (
              <ProcessingLoader
                isTranscribing={state.isTranscribing}
                elapsed={state.isTranscribing ? state.transcriptionElapsed : undefined}
              />
            );
          }
          return (
            <FeedbackReport
              feedback={state.feedback}
              transcript={state.anonymizedTranscript}
              isLoading={state.isAnalyzing}
              onReset={handleReset}
              onRetry={retryAnalysis}
              error={state.analysisError}
              mode={state.mode}
              selectedPhases={state.selectedPhases}
              userRole={userRole}
            />
          );
      }
    }

    // Deep dive mode
    if (state.mode === "deep-dive") {
      switch (state.step) {
        case 1:
          return <SessionCapture mode={state.mode} onComplete={(blob, fileName, docs, details) => handleSessionCapture(blob, fileName, docs, details)} />;
        case 2:
          if (state.isTranscribing || (state.isAnalyzing && !state.feedback)) {
            return (
              <ProcessingLoader
                isTranscribing={state.isTranscribing}
                elapsed={state.isTranscribing ? state.transcriptionElapsed : undefined}
              />
            );
          }
          return (
            <FeedbackReport
              feedback={state.feedback}
              transcript={state.anonymizedTranscript}
              isLoading={state.isAnalyzing}
              onReset={handleReset}
              onRetry={retryAnalysis}
              error={state.analysisError}
              mode={state.mode}
              selectedPhases={state.selectedPhases}
              userRole={userRole}
            />
          );
      }
    }

    // Compare sessions mode
    if (state.mode === "compare-sessions") {
      switch (state.step) {
        case 1:
          return (
            <SessionCompare
              userRole={userRole}
              onComplete={(result) => {
                setComparisonResult(result);
                advanceStep();
              }}
            />
          );
        case 2:
          if (!comparisonResult) {
            return (
              <ProcessingLoader isTranscribing={false} />
            );
          }
          return (
            <ComparisonReport
              result={comparisonResult}
              onReset={handleReset}
            />
          );
      }
    }

    return <WelcomeScreen onSelectMode={selectMode} selectedRole={userRole} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">PE</span>
              </div>
              <div>
                <h1 className="font-heading font-semibold text-foreground text-lg">PowerED</h1>
                <p className="text-xs text-muted-foreground">Teaching Feedback</p>
              </div>
            </div>
            {state.step > 0 && (
              <span className="text-sm text-muted-foreground">Bradford College</span>
            )}
          </div>
          {state.step > 0 && <StepIndicator steps={steps} currentStep={state.step} />}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {state.step > 0 && !state.isTranscribing && (
          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Home className="w-4 h-4" />
              Home
            </Button>
          </div>
        )}
        {renderStep()}
      </main>

      <footer className="border-t border-border bg-muted/30 mt-auto rounded-t-3xl">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} PowerED by Bradford College</p>
            <p>Your personal teaching coach</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
