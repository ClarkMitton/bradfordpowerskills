import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePrivacyCleanup } from "@/hooks/usePrivacyCleanup";
import type { SelectedPhase } from "@/components/PhaseSelector";
import type { SessionDetails } from "@/components/AudioRecorder";
import type { SessionCaptureDetails } from "@/components/SessionCapture";
import type { UserRole } from "@/components/WelcomeScreen";

interface HighlightedName {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  replaced: boolean;
}

interface CategoryFeedback {
  name: string;
  rating: number | string;
  whatsWorking: string;
  toMakeStronger: string;
  tryThisNext: string;
}

interface LEADPhaseFeedback {
  phase: string;
  rating: "exemplary" | "solid" | "developing" | "emerging";
  observations: string[];
  suggestions: string[];
}

interface StandardEnglishData {
  stars: number;
  feedback: string;
}

interface ITTECFIndicator {
  standard: string;
  subCode: string;
  statement: string;
  status: "demonstrated" | "not_yet_evidenced";
  evidence: string;
}

interface FeedbackData {
  categories: CategoryFeedback[];
  leadPhases: LEADPhaseFeedback[];
  overallSummary: string;
  topStrength: string;
  priorityGrowthArea: string;
  standardEnglish?: StandardEnglishData;
  ittecfIndicators?: ITTECFIndicator[];
  [key: string]: unknown;
}

export type AnalysisMode = "quick" | "deep-dive" | "compare-sessions" | null;

interface SessionState {
  step: number;
  mode: AnalysisMode;
  audioBlob: Blob | null;
  audioFileName: string;
  transcript: string;
  highlightedNames: HighlightedName[];
  anonymizedTranscript: string;
  documents: {
    lessonPlan: File | null;
  };
  feedback: FeedbackData | null;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  selectedPhases: SelectedPhase[];
  transcriptionStartTime: number | null;
  transcriptionElapsed: number;
  sessionDetails: SessionDetails | null;
  analysisError: string | null;
  userRole: UserRole | null;
}

const initialState: SessionState = {
  step: 0,
  mode: null,
  audioBlob: null,
  audioFileName: "",
  transcript: "",
  highlightedNames: [],
  anonymizedTranscript: "",
  documents: {
    lessonPlan: null,
  },
  feedback: null,
  isTranscribing: false,
  isAnalyzing: false,
  selectedPhases: [],
  transcriptionStartTime: null,
  transcriptionElapsed: 0,
  sessionDetails: null,
  analysisError: null,
  userRole: null,
};

// Mock function to detect names in transcript
const detectNames = (text: string): HighlightedName[] => {
  const commonNames = [
    "John", "Sarah", "Michael", "Emma", "James", "Emily", "David", "Sophie",
    "Daniel", "Olivia", "Mohammed", "Chloe", "Jack", "Mia", "Thomas", "Grace",
    "Charlie", "Lily", "William", "Ella", "Harry", "Amelia", "George", "Isla"
  ];
  
  const names: HighlightedName[] = [];
  
  commonNames.forEach((name) => {
    const regex = new RegExp(`\\b${name}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      names.push({
        id: `${name}-${match.index}`,
        name: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        replaced: false,
      });
    }
  });
  
  return names.sort((a, b) => a.startIndex - b.startIndex);
};

// Auto-anonymize transcript by replacing detected names
const autoAnonymizeTranscript = (text: string, names: HighlightedName[]): string => {
  if (names.length === 0) return text;
  
  let result = text;
  const sortedNames = [...names].sort((a, b) => b.startIndex - a.startIndex);
  
  sortedNames.forEach((name) => {
    result = result.slice(0, name.startIndex) + "Student" + result.slice(name.endIndex);
  });
  
  return result;
};

// Real transcription using ElevenLabs Speech-to-Text
const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Transcription failed");
  }

  const data = await response.json();
  
  if (data.words && data.words.length > 0) {
    return formatTranscriptWithTimestamps(data.text, data.words);
  }
  
  return data.text;
};

// Format transcript with timestamps at natural break points
const formatTranscriptWithTimestamps = (
  text: string,
  words: Array<{ text: string; start: number; end: number; speaker?: string }>
): string => {
  if (!words.length) return text;

  const lines: string[] = [];
  let currentLine = "";
  let lastTimestamp = 0;
  let lastSpeaker = "";
  
  words.forEach((word, index) => {
    const currentTime = word.start;
    const speaker = word.speaker || "";
    
    const shouldAddTimestamp = 
      currentTime - lastTimestamp >= 30 || 
      (speaker && speaker !== lastSpeaker && lastSpeaker !== "");
    
    if (shouldAddTimestamp && currentLine.trim()) {
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timestamp = `[${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}]`;
      
      lines.push(currentLine.trim());
      currentLine = `${timestamp} `;
      lastTimestamp = currentTime;
    }
    
    if (speaker && speaker !== lastSpeaker) {
      lastSpeaker = speaker;
    }
    
    currentLine += word.text + " ";
    
    if (word.text.match(/[.!?]$/) && index < words.length - 1) {
      lines.push(currentLine.trim());
      currentLine = "";
    }
  });
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines.join("\n\n");
};

// Real AI feedback generation
const generateFeedback = async (
  transcript: string,
  selectedPhases: SelectedPhase[],
  mode: AnalysisMode,
  documents: SessionState["documents"],
  sessionDetails: SessionDetails | null,
  userRole: UserRole | null
): Promise<FeedbackData> => {
  let lessonPlanText = "";
  if (documents.lessonPlan) {
    lessonPlanText = await documents.lessonPlan.text().catch(() => "");
  }

  const { data, error } = await supabase.functions.invoke("analyze-session", {
    body: {
      transcript,
      selectedPhases,
      lessonPlan: lessonPlanText,
      mode,
      learnerLevel: sessionDetails?.learnerLevel || "",
      subject: sessionDetails?.subject || "",
      selectedCategories: sessionDetails?.selectedCategories || [],
      userRole: userRole || "staff",
    },
  });

  if (error) {
    console.error("Analysis error:", error);
    throw new Error(error.message || "Failed to analyze session");
  }

  return data as FeedbackData;
};

export function useSessionAnalysis() {
  const [state, setState] = useState<SessionState>(initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAbortRef = useRef<boolean>(false);
  
  const { trackAudioBlob, performFullCleanup } = usePrivacyCleanup();

  useEffect(() => {
    trackAudioBlob(state.audioBlob);
  }, [state.audioBlob, trackAudioBlob]);

  // Transcription timer effect
  useEffect(() => {
    if (state.isTranscribing && state.transcriptionStartTime) {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          transcriptionElapsed: Math.floor((Date.now() - (prev.transcriptionStartTime || Date.now())) / 1000)
        }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isTranscribing, state.transcriptionStartTime]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingAbortRef.current = true;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setState((prev) => ({ ...prev, userRole: role }));
  }, []);

  const selectMode = useCallback((mode: AnalysisMode) => {
    setState((prev) => ({ ...prev, mode, step: 1 }));
  }, []);

  const triggerAnalysis = useCallback(async (
    anonymizedTranscript: string,
    selectedPhases: SelectedPhase[],
    sessionDetails: SessionDetails | null,
    mode: AnalysisMode,
    documents: SessionState["documents"],
    userRole: UserRole | null
  ) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisError: null,
    }));

    try {
      const feedback = await generateFeedback(
        anonymizedTranscript,
        selectedPhases,
        mode,
        documents,
        sessionDetails,
        userRole
      );
      
      setState((prev) => ({
        ...prev,
        feedback,
        isAnalyzing: false,
        analysisError: null,
      }));
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        analysisError: errorMessage,
      }));
    }
  }, []);

  const handleAudioReady = useCallback(async (blob: Blob, fileName: string, sessionDetails?: SessionDetails) => {
    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioFileName: fileName,
      step: 2,
      isTranscribing: true,
      transcriptionStartTime: Date.now(),
      transcriptionElapsed: 0,
      sessionDetails: sessionDetails || null,
      selectedPhases: ["full"],
    }));

    try {
      const transcript = await transcribeAudio(blob);
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Transcription returned empty. Please try recording again.");
      }
      
      const names = detectNames(transcript);
      const anonymizedTranscript = autoAnonymizeTranscript(transcript, names);
      
      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        anonymizedTranscript,
        isTranscribing: false,
        transcriptionStartTime: null,
      }));
      
      toast.success("Audio transcribed and anonymized successfully");
      
      const fullPhases: SelectedPhase[] = ["full"];
      // Need to read userRole from state at call time
      setState((prev) => {
        setTimeout(() => {
          triggerAnalysis(anonymizedTranscript, fullPhases, sessionDetails || null, "quick", initialState.documents, prev.userRole);
        }, 0);
        return prev;
      });
    } catch (error) {
      console.error("Transcription failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transcription failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        transcriptionStartTime: null,
        step: 1,
      }));
    }
  }, [triggerAnalysis]);

  const handleSessionCapture = useCallback(async (
    blob: Blob,
    fileName: string,
    documents: SessionState["documents"],
    captureDetails?: SessionCaptureDetails
  ) => {
    const currentMode = state.mode;
    const sessionDetails: SessionDetails | null = captureDetails
      ? { learnerLevel: "", subject: captureDetails.subject, selectedCategories: [] }
      : null;

    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioFileName: fileName,
      documents,
      step: 2,
      isTranscribing: true,
      transcriptionStartTime: Date.now(),
      transcriptionElapsed: 0,
      selectedPhases: ["full"],
      sessionDetails,
    }));

    try {
      const transcript = await transcribeAudio(blob);

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Transcription returned empty. Please try recording again.");
      }

      const names = detectNames(transcript);
      const anonymizedTranscript = autoAnonymizeTranscript(transcript, names);

      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        anonymizedTranscript,
        isTranscribing: false,
        transcriptionStartTime: null,
      }));

      toast.success("Audio transcribed and anonymised successfully");

      const fullPhases: SelectedPhase[] = ["full"];
      setState((prev) => {
        setTimeout(() => {
          triggerAnalysis(anonymizedTranscript, fullPhases, sessionDetails, currentMode, documents, prev.userRole);
        }, 0);
        return prev;
      });
    } catch (error) {
      console.error("Transcription failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transcription failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        transcriptionStartTime: null,
        step: 1,
      }));
    }
  }, [state.mode, triggerAnalysis]);

  const handleTranscriptSubmit = useCallback((transcript: string, sessionDetails?: SessionDetails) => {
    const names = detectNames(transcript);
    const anonymizedTranscript = autoAnonymizeTranscript(transcript, names);
    
    setState((prev) => ({
      ...prev,
      transcript,
      highlightedNames: names,
      anonymizedTranscript,
      step: 2,
      sessionDetails: sessionDetails || null,
      selectedPhases: ["full"],
    }));
    
    toast.success("Transcript loaded and anonymized successfully");
    
    const fullPhases: SelectedPhase[] = ["full"];
    setState((prev) => {
      setTimeout(() => {
        triggerAnalysis(anonymizedTranscript, fullPhases, sessionDetails || null, prev.mode, initialState.documents, prev.userRole);
      }, 0);
      return prev;
    });
  }, [triggerAnalysis]);

  const confirmTranscript = useCallback((anonymizedTranscript: string) => {
    setState((prev) => ({
      ...prev,
      anonymizedTranscript,
      audioBlob: null,
      step: 2,
    }));
  }, []);

  const handlePhaseSelection = useCallback(async (selectedPhases: SelectedPhase[]) => {
    setState((prev) => ({
      ...prev,
      selectedPhases,
      isAnalyzing: true,
      analysisError: null,
      step: 2,
    }));

    try {
      const feedback = await generateFeedback(
        state.anonymizedTranscript,
        selectedPhases,
        state.mode,
        state.documents,
        state.sessionDetails,
        state.userRole
      );
      
      setState((prev) => ({
        ...prev,
        feedback,
        isAnalyzing: false,
        analysisError: null,
      }));
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        analysisError: errorMessage,
      }));
    }
  }, [state.anonymizedTranscript, state.mode, state.documents, state.sessionDetails, state.userRole]);

  const retryAnalysis = useCallback(() => {
    if (state.selectedPhases.length > 0) {
      handlePhaseSelection(state.selectedPhases);
    }
  }, [state.selectedPhases, handlePhaseSelection]);

  const resetSession = useCallback(() => {
    pollingAbortRef.current = true;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    performFullCleanup();
    setState(initialState);
  }, [performFullCleanup]);

  const advanceStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.step <= 1) {
        pollingAbortRef.current = true;
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
        }
        return initialState;
      }
      return { ...prev, step: prev.step - 1 };
    });
  }, []);


  return {
    state,
    selectMode,
    handleAudioReady,
    handleSessionCapture,
    handleTranscriptSubmit,
    confirmTranscript,
    handlePhaseSelection,
    retryAnalysis,
    resetSession,
    goBack,
    advanceStep,
    setUserRole,
  };
}
