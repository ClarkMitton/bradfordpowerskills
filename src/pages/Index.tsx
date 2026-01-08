import React, { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { WelcomeScreen, FeedbackPath } from "@/components/WelcomeScreen";
import { AudioRecorder } from "@/components/AudioRecorder";
import { SessionCapture } from "@/components/SessionCapture";
import { VideoCapture } from "@/components/VideoCapture";
import { PhaseSelector } from "@/components/PhaseSelector";
import { FeedbackReport } from "@/components/FeedbackReport";
import { PreviousReportUploader } from "@/components/PreviousReportUploader";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Loader2, Clock, Video, Upload, Sparkles, Zap } from "lucide-react";

const getStepsForMode = (mode: string | null) => {
  switch (mode) {
    case "quick":
      return [
        { id: 1, label: "Record Audio", shortLabel: "Audio" },
        { id: 2, label: "Select Phases", shortLabel: "Phases" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "deep-dive":
      return [
        { id: 1, label: "Capture Session", shortLabel: "Capture" },
        { id: 2, label: "Select Phases", shortLabel: "Phases" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "full-review":
      return [
        { id: 1, label: "Capture Session", shortLabel: "Capture" },
        { id: 2, label: "Select Phases", shortLabel: "Phases" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    case "video-analysis":
      return [
        { id: 1, label: "Upload Video", shortLabel: "Video" },
        { id: 2, label: "Select Phases", shortLabel: "Phases" },
        { id: 3, label: "View Feedback", shortLabel: "Feedback" },
      ];
    default:
      return [];
  }
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Index = () => {
  const [feedbackPath, setFeedbackPath] = useState<FeedbackPath | null>(null);
  const [previousReport, setPreviousReport] = useState<string | null>(null);
  
  const {
    state,
    selectMode,
    handleAudioReady,
    handleSessionCapture,
    handleTranscriptSubmit,
    handlePhaseSelection,
    handleVideoCapture,
    analyzeVideo,
    retryAnalysis,
    resetSession,
    goBack,
  } = useSessionAnalysis();

  const handleReset = () => {
    setFeedbackPath(null);
    setPreviousReport(null);
    resetSession();
  };

  const steps = getStepsForMode(state.mode);

  // Show transcription loading state
  const TranscriptionLoader = () => (
    <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-mono px-3 py-1 rounded-full flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {formatTime(state.transcriptionElapsed)}
        </div>
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-heading font-semibold text-foreground">
          Transcribing Your Session
        </h3>
        <p className="text-muted-foreground max-w-md">
          Converting your audio to text and automatically anonymizing student names...
        </p>
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground/70">
          <p>This usually takes 30-60 seconds depending on recording length</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Processing audio...</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Show video processing loading state
  const VideoProcessingLoader = () => {
    const getStatusText = () => {
      switch (state.videoProcessingStatus) {
        case "compressing":
          return {
            title: "Optimizing Video",
            message: "Compressing for faster upload...",
            icon: Zap,
            detail: `${state.compressionProgress}% complete`,
          };
        case "uploading":
          return {
            title: "Uploading Video",
            message: state.compressionSavings || "Sending your video to our servers...",
            icon: Upload,
            detail: "This depends on your connection speed",
          };
        case "processing":
          return {
            title: "Indexing Video",
            message: "Processing your video content...",
            icon: Video,
            detail: "This typically takes 60-90 seconds",
          };
        case "analyzing":
          return {
            title: "Analyzing Pedagogy",
            message: "AI is extracting teaching insights from visual and audio...",
            icon: Sparkles,
            detail: "Almost done...",
          };
        default:
          return {
            title: "Preparing Analysis",
            message: "Setting up video analysis...",
            icon: Video,
            detail: "Please wait",
          };
      }
    };

    const status = getStatusText();
    const StatusIcon = status.icon;

    // Progress stages for visual feedback
    const stages = ["compressing", "uploading", "processing", "analyzing"];
    const currentStageIndex = stages.indexOf(state.videoProcessingStatus || "compressing");

    return (
      <div className="section-fade-in flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-mono px-3 py-1 rounded-full flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <span className="capitalize">{state.videoProcessingStatus || "preparing"}</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 w-full max-w-xs">
          {stages.map((stage, index) => (
            <React.Fragment key={stage}>
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStageIndex ? "bg-primary" : "bg-muted"
                }`}
              />
              {index < stages.length - 1 && (
                <div
                  className={`w-1 h-1 rounded-full ${
                    index < currentStageIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-2xl font-heading font-semibold text-foreground">{status.title}</h3>
          <p className="text-muted-foreground max-w-md">{status.message}</p>
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground/70">
            <p>{status.detail}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>
                Step {currentStageIndex + 1} of {stages.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderStep = () => {
    if (state.step === 0) {
      // Show path selection first, then mode selection
      if (feedbackPath === "comparative" && !previousReport) {
        return (
          <PreviousReportUploader 
            onReportUploaded={(data, raw) => setPreviousReport(raw)}
            onSkip={() => setFeedbackPath("new")}
          />
        );
      }
      return (
        <WelcomeScreen 
          onSelectMode={selectMode} 
          onSelectPath={setFeedbackPath}
          showPathSelection={true}
          selectedPath={feedbackPath}
        />
      );
    }

    // Quick feedback mode flow (audio only)
    if (state.mode === "quick") {
      switch (state.step) {
        case 1:
          return <AudioRecorder onFastFeedback={handleAudioReady} onTranscriptSubmit={handleTranscriptSubmit} />;
        case 2:
          // Show transcription loading or phase selector
          if (state.isTranscribing) {
            return <TranscriptionLoader />;
          }
          return (
            <PhaseSelector
              onConfirm={handlePhaseSelection}
              isLoading={false}
            />
          );
        case 3:
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
          // Show transcription loading or phase selector
          if (state.isTranscribing) {
            return <TranscriptionLoader />;
          }
          return (
            <PhaseSelector
              onConfirm={handlePhaseSelection}
              isLoading={false}
            />
          );
        case 3:
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
            />
          );
      }
    }

    // Video analysis mode
    if (state.mode === "video-analysis") {
      switch (state.step) {
        case 1:
          return (
            <VideoCapture
              onComplete={handleVideoCapture}
            />
          );
        case 2:
          return (
            <PhaseSelector
              onConfirm={analyzeVideo}
              isLoading={false}
            />
          );
        case 3:
          if (state.isAnalyzing) {
            return <VideoProcessingLoader />;
          }
          return (
            <FeedbackReport
              feedback={state.feedback}
              transcript=""
              isLoading={state.isAnalyzing}
              onReset={handleReset}
              onRetry={() => state.selectedPhases.length > 0 && analyzeVideo(state.selectedPhases)}
              error={state.analysisError}
              mode={state.mode}
              selectedPhases={state.selectedPhases}
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
