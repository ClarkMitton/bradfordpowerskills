import { StepIndicator } from "@/components/StepIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AudioRecorder } from "@/components/AudioRecorder";
import { SessionCapture } from "@/components/SessionCapture";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { FeedbackReport } from "@/components/FeedbackReport";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";

const getStepsForMode = (mode: string | null) => {
  switch (mode) {
    case "quick":
      return [
        { id: 1, label: "Record Audio", shortLabel: "Audio" },
        { id: 2, label: "Review Transcript", shortLabel: "Review" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "deep-dive":
      return [
        { id: 1, label: "Capture Session", shortLabel: "Capture" },
        { id: 2, label: "Review Transcript", shortLabel: "Review" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "full-review":
      return [
        { id: 1, label: "Capture Session", shortLabel: "Capture" },
        { id: 2, label: "Review Transcript", shortLabel: "Review" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    default:
      return [];
  }
};

const Index = () => {
  const {
    state,
    selectMode,
    handleAudioReady,
    handleSessionCapture,
    confirmTranscript,
    resetSession,
  } = useSessionAnalysis();

  const steps = getStepsForMode(state.mode);

  const renderStep = () => {
    if (state.step === 0) {
      return <WelcomeScreen onSelectMode={selectMode} />;
    }

    // Quick feedback mode flow (audio only)
    if (state.mode === "quick") {
      switch (state.step) {
        case 1:
          return <AudioRecorder onFastFeedback={handleAudioReady} />;
        case 2:
          return (
            <TranscriptEditor
              transcript={state.transcript}
              highlightedNames={state.highlightedNames}
              isLoading={state.isTranscribing}
              onConfirm={confirmTranscript}
            />
          );
        case 3:
          return (
            <FeedbackReport
              feedback={state.feedback}
              transcript={state.anonymizedTranscript}
              isLoading={state.isAnalyzing}
              onReset={resetSession}
              mode={state.mode}
            />
          );
      }
    }

    // Deep dive and full review modes (combined audio + documents)
    if (state.mode === "deep-dive" || state.mode === "full-review") {
      switch (state.step) {
        case 1:
          return (
            <SessionCapture
              mode={state.mode}
              onComplete={handleSessionCapture}
            />
          );
        case 2:
          return (
            <TranscriptEditor
              transcript={state.transcript}
              highlightedNames={state.highlightedNames}
              isLoading={state.isTranscribing}
              onConfirm={confirmTranscript}
            />
          );
        case 3:
          return (
            <FeedbackReport
              feedback={state.feedback}
              transcript={state.anonymizedTranscript}
              isLoading={state.isAnalyzing}
              onReset={resetSession}
              mode={state.mode}
            />
          );
      }
    }

    return <WelcomeScreen onSelectMode={selectMode} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">PS</span>
              </div>
              <div>
                <h1 className="font-heading font-semibold text-foreground text-lg">
                  Power Skills
                </h1>
                <p className="text-xs text-muted-foreground">Session Analysis</p>
              </div>
            </div>
            {state.step > 0 && (
              <span className="text-sm text-muted-foreground">
                Bradford College
              </span>
            )}
          </div>
          
          {state.step > 0 && (
            <StepIndicator steps={steps} currentStep={state.step} />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Power Skills Session Analysis Tool</p>
            <p>Built for Bradford College LEAD Model</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;