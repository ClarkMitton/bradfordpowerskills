import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

// Mock transcription function - In production, use AI transcription
const mockTranscribe = async (): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return `Good morning everyone. Let's begin today's session on creative writing.

Can you tell me what you remember from last week's lesson about narrative structure?

Excellent point. And what about the importance of character development?

Great insights from both of you. Today we're going to explore how to create compelling dialogue that brings characters to life.

Let's start with a quick activity. I want you to work in pairs.

Look at the handout I'm passing around now. You have five minutes to identify three techniques the author uses to make the dialogue feel authentic.

[pause for activity]

Okay, let's hear some feedback. What did your pair notice?

That's a really perceptive observation about the use of interruptions to show conflict. Anything to add from your discussion?

Wonderful. Now I want to challenge you further. Can anyone think of a situation where formal dialogue might actually create tension rather than formality?

Go ahead.

Interesting perspective. Let's explore that idea in our next activity.

For the main task today, you're going to write a short scene - about 200 words - that demonstrates at least two of the dialogue techniques we've discussed.

Remember to think about your character's voice. What questions do you have before we start?

Good question about punctuation. Everyone, remember that dialogue tags go inside the quotation marks in British English.

You have 20 minutes. I'll be circulating to offer support. I'll check in with those who mentioned wanting help with this last week.`;
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
      const transcript = await mockTranscribe();
      const names = detectNames(transcript);
      
      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        isTranscribing: false,
      }));
    } catch (error) {
      console.error("Transcription failed:", error);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
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
      const transcript = await mockTranscribe();
      const names = detectNames(transcript);
      
      setState((prev) => ({
        ...prev,
        transcript,
        highlightedNames: names,
        isTranscribing: false,
      }));
    } catch (error) {
      console.error("Transcription failed:", error);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
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
