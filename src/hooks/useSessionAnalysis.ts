import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SelectedPhase } from "@/components/PhaseSelector";

interface HighlightedName {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  replaced: boolean;
}

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

export type AnalysisMode = "quick" | "deep-dive" | "full-review" | null;

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
    scaffolding: File | null;
    lowerAbility: File | null;
    middleAbility: File | null;
    higherAbility: File | null;
  };
  feedback: FeedbackData | null;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  selectedPhases: SelectedPhase[];
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
    scaffolding: null,
    lowerAbility: null,
    middleAbility: null,
    higherAbility: null,
  },
  feedback: null,
  isTranscribing: false,
  isAnalyzing: false,
  selectedPhases: [],
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
  
  // Format transcript with timestamps from word data
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
    
    // Add timestamp every ~30 seconds or on speaker change
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
    
    // Break on sentence endings
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
  documents: SessionState["documents"]
): Promise<FeedbackData> => {
  // Read document contents if available
  let lessonPlanText = "";
  let scaffoldingText = "";
  let studentWorkText = "";

  if (documents.lessonPlan) {
    lessonPlanText = await documents.lessonPlan.text().catch(() => "");
  }
  if (documents.scaffolding) {
    scaffoldingText = await documents.scaffolding.text().catch(() => "");
  }

  // Combine student work descriptions
  const studentWorkParts = [];
  if (documents.lowerAbility) studentWorkParts.push("Lower ability student work sample provided");
  if (documents.middleAbility) studentWorkParts.push("Middle ability student work sample provided");
  if (documents.higherAbility) studentWorkParts.push("Higher ability student work sample provided");
  studentWorkText = studentWorkParts.join(". ");

  const { data, error } = await supabase.functions.invoke("analyze-session", {
    body: {
      transcript,
      selectedPhases,
      lessonPlan: lessonPlanText,
      scaffolding: scaffoldingText,
      studentWork: studentWorkText,
      mode,
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

  const selectMode = useCallback((mode: AnalysisMode) => {
    setState((prev) => ({ ...prev, mode, step: 1 }));
  }, []);

  // For quick mode - audio only
  const handleAudioReady = useCallback(async (blob: Blob, fileName: string) => {
    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioFileName: fileName,
      step: 2,
      isTranscribing: true,
    }));

    try {
      const transcript = await transcribeAudio(blob);
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Transcription returned empty. Please try recording again.");
      }
      
      const names = detectNames(transcript);
      
      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        isTranscribing: false,
      }));
      
      toast.success("Audio transcribed successfully");
    } catch (error) {
      console.error("Transcription failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transcription failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        step: 1, // Go back to recording step
      }));
    }
  }, []);

  // For deep-dive and full-review modes - audio + documents combined
  const handleSessionCapture = useCallback(async (
    blob: Blob, 
    fileName: string, 
    documents: SessionState["documents"]
  ) => {
    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioFileName: fileName,
      documents,
      step: 2,
      isTranscribing: true,
    }));

    try {
      const transcript = await transcribeAudio(blob);
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Transcription returned empty. Please try recording again.");
      }
      
      const names = detectNames(transcript);
      
      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        isTranscribing: false,
      }));
      
      toast.success("Audio transcribed successfully");
    } catch (error) {
      console.error("Transcription failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transcription failed. Please try again.";
      toast.error(errorMessage);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        step: 1, // Go back to recording step
      }));
    }
  }, []);

  const confirmTranscript = useCallback((anonymizedTranscript: string) => {
    setState((prev) => ({
      ...prev,
      anonymizedTranscript,
      audioBlob: null, // Delete audio after transcript confirmed
      step: 3, // Go to phase selection
    }));
  }, []);

  const handlePhaseSelection = useCallback(async (selectedPhases: SelectedPhase[]) => {
    setState((prev) => ({
      ...prev,
      selectedPhases,
      isAnalyzing: true,
      step: 4, // Go to feedback
    }));

    try {
      const feedback = await generateFeedback(
        state.anonymizedTranscript,
        selectedPhases,
        state.mode,
        state.documents
      );
      
      setState((prev) => ({
        ...prev,
        feedback,
        isAnalyzing: false,
      }));
    } catch (error) {
      console.error("Analysis failed:", error);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
      }));
    }
  }, [state.anonymizedTranscript, state.mode, state.documents]);

  const resetSession = useCallback(() => {
    setState(initialState);
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.step <= 1) {
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
    confirmTranscript,
    handlePhaseSelection,
    resetSession,
    goBack,
  };
}
