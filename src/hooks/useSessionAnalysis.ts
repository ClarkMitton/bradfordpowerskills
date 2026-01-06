import { useState, useCallback } from "react";

interface HighlightedName {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  replaced: boolean;
}

interface LEADPhaseFeedback {
  phase: string;
  rating: "excellent" | "good" | "developing" | "needs-improvement";
  observations: string[];
  suggestions: string[];
}

interface FeedbackData {
  leadPhases: LEADPhaseFeedback[];
  teachingDelivery: {
    strengths: string[];
    areasForDevelopment: string[];
  };
  planVsDelivery?: {
    alignment: "strong" | "moderate" | "weak";
    observations: string[];
    deviations: string[];
  };
  resourceUtilization?: {
    summary: string;
    effectiveUses: string[];
    missedOpportunities: string[];
  };
  studentWorkAnalysis?: {
    summary: string;
    differentiationEvidence: string[];
    objectivesReached: boolean;
  };
  www: string[];
  ebi: string[];
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
};

// Mock function to detect names in transcript
// In production, this would use AI to detect names
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

// Mock transcription function
// In production, this would use AI API
const mockTranscribe = async (audio: Blob): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return `Good morning everyone. Let's begin today's session on creative writing.

Sarah, can you tell me what you remember from last week's lesson about narrative structure?

Excellent point, Sarah. And Michael, what about the importance of character development?

Great insights from both of you. Today we're going to explore how to create compelling dialogue that brings characters to life.

Let's start with a quick activity. I want you to work in pairs. Emma, you'll work with James. David, you're with Sophie.

Look at the handout I'm passing around now. You have five minutes to identify three techniques the author uses to make the dialogue feel authentic.

[pause for activity]

Okay, let's hear some feedback. Daniel, what did your pair notice?

That's a really perceptive observation about the use of interruptions to show conflict. Mohammed, anything to add from your discussion with Chloe?

Wonderful. Now I want to challenge you further. Can anyone think of a situation where formal dialogue might actually create tension rather than formality?

Jack, go ahead.

Interesting perspective. Let's explore that idea in our next activity.

For the main task today, you're going to write a short scene - about 200 words - that demonstrates at least two of the dialogue techniques we've discussed.

Remember to think about your character's voice. Mia, what questions do you have before we start?

Good question about punctuation. Everyone, remember that dialogue tags go inside the quotation marks in British English.

You have 20 minutes. I'll be circulating to offer support. Thomas, I'll check in with you first since you mentioned wanting help with this last week.`;
};

// Mock feedback generation
// In production, this would use AI API
const mockGenerateFeedback = async (mode: AnalysisMode): Promise<FeedbackData> => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  const baseFeedback: FeedbackData = {
    leadPhases: [
      {
        phase: "Launch",
        rating: "good",
        observations: [
          "Clear reference to prior learning from last week's session",
          "Effective use of questioning to gauge starting points (Sarah, Michael)",
          "Learning aims were implied but could be more explicitly stated",
          "Good use of recap questions to inspire curiosity"
        ],
        suggestions: [
          "Consider displaying learning objectives visually for student reference",
          "Include a brief starter activity before the main questioning"
        ]
      },
      {
        phase: "Establish",
        rating: "excellent",
        observations: [
          "Well-structured paired activity engages all students",
          "Clear instructions with specific time allocation (5 minutes)",
          "Use of handout provides scaffolded support for analysis",
          "Good variety of student voices in feedback discussion"
        ],
        suggestions: [
          "Consider adding a visual demonstration of dialogue techniques before the analysis task"
        ]
      },
      {
        phase: "Apply",
        rating: "good",
        observations: [
          "Main task requires application of learned techniques",
          "Clear word count expectation (200 words) provides structure",
          "Challenge element present through technique requirement",
          "Good stretch by asking students to apply multiple techniques"
        ],
        suggestions: [
          "Could add extension challenge for faster finishers",
          "Consider providing success criteria or checklist for self-assessment"
        ]
      },
      {
        phase: "Demonstrate",
        rating: "developing",
        observations: [
          "Informal assessment through questioning occurs throughout",
          "Planned circulation allows for individual feedback",
          "Targeted support for Thomas shows awareness of individual needs"
        ],
        suggestions: [
          "Include a plenary activity to assess overall class progress",
          "Consider adding peer assessment opportunity",
          "Plan specific checkpoints to gauge understanding mid-activity"
        ]
      }
    ],
    teachingDelivery: {
      strengths: [
        "Excellent use of targeted questioning with named students",
        "Good wait time observed after questions",
        "Clear, concise explanations of expectations",
        "Effective pacing with defined time allocations",
        "Strong classroom presence and engaging tone"
      ],
      areasForDevelopment: [
        "Could increase think-pair-share opportunities",
        "Consider using mini-whiteboards for whole-class responses",
        "Extend higher-order questioning to push deeper analysis"
      ]
    },
    www: [
      "Strong launch phase with effective recall questioning that connected to prior learning",
      "Excellent variety of student voices included throughout the session",
      "Well-structured paired activity with clear time boundaries and expectations",
      "Good differentiation awareness shown through targeted support for Thomas",
      "Main task clearly aligned to learning objectives with appropriate challenge level"
    ],
    ebi: [
      "Learning objectives were displayed prominently at the start and referred back to throughout",
      "A brief starter activity was included before the main questioning to settle students",
      "The plenary included a structured assessment activity (e.g., exit tickets, MCQs)",
      "Extension challenges were prepared for early finishers during the main writing task",
      "Success criteria or self-assessment checklist was provided for the writing activity"
    ]
  };

  // Add plan vs delivery for deep-dive and full-review modes
  if (mode === "deep-dive" || mode === "full-review") {
    baseFeedback.planVsDelivery = {
      alignment: "moderate",
      observations: [
        "The lesson plan outlined a 10-minute starter activity, but only 5 minutes were spent on the recap",
        "Paired activity was delivered as planned with appropriate time allocation",
        "Main writing task matched the planned 20-minute duration",
        "The planned plenary activity appears to have been shortened or skipped"
      ],
      deviations: [
        "Starter activity was condensed - consider whether the full planned time was needed",
        "Extension activities mentioned in plan were not referenced during the session",
        "Success criteria from the plan were not shared with students as intended"
      ]
    };
  }

  // Add resource utilization for full-review mode
  if (mode === "full-review") {
    baseFeedback.resourceUtilization = {
      summary: "Scaffolding materials were partially utilized during the session. The handout was used effectively, but some prepared support resources were not deployed.",
      effectiveUses: [
        "Handout with dialogue examples was distributed and actively used for analysis task",
        "Word count guidance from support materials was communicated clearly"
      ],
      missedOpportunities: [
        "Sentence starters from scaffolding pack were not offered to struggling learners",
        "Visual prompts for dialogue techniques could have reinforced key concepts"
      ]
    };

    baseFeedback.studentWorkAnalysis = {
      summary: "Student work samples show evidence of differentiated outcomes across ability levels. All three samples demonstrate understanding of dialogue techniques, with the higher ability sample showing more sophisticated application of multiple techniques.",
      differentiationEvidence: [
        "Lower ability sample shows basic dialogue punctuation mastery with support scaffolding visible",
        "Middle ability sample demonstrates confident use of two dialogue techniques with some experimentation",
        "Higher ability sample shows creative application of interruptions, dialect, and subtext with analytical annotation"
      ],
      objectivesReached: true
    };
  }

  return baseFeedback;
};

export function useSessionAnalysis() {
  const [state, setState] = useState<SessionState>(initialState);

  const selectMode = useCallback((mode: AnalysisMode) => {
    setState((prev) => ({ ...prev, mode, step: 1 }));
  }, []);

  const handleAudioReady = useCallback(async (blob: Blob, fileName: string) => {
    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioFileName: fileName,
      step: 2,
      isTranscribing: true,
    }));

    try {
      const transcript = await mockTranscribe(blob);
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
    setState((prev) => {
      // For quick mode, go to feedback (step 3)
      // For deep-dive and full-review, go to document upload (step 3)
      const nextStep = prev.mode === "quick" ? 3 : 3;
      return {
        ...prev,
        anonymizedTranscript,
        audioBlob: null,
        step: nextStep,
        // For quick mode, start analysis immediately
        isAnalyzing: prev.mode === "quick",
      };
    });
    
    // For quick mode, generate feedback after transcript confirmation
    setState((prev) => {
      if (prev.mode === "quick") {
        mockGenerateFeedback(prev.mode).then((feedback) => {
          setState((p) => ({ ...p, feedback, isAnalyzing: false }));
        });
      }
      return prev;
    });
  }, []);

  const handleDocumentsReady = useCallback(
    async (documents: SessionState["documents"]) => {
      let currentMode: AnalysisMode = null;
      
      setState((prev) => {
        currentMode = prev.mode;
        // For deep-dive and full-review modes, go to step 4 (feedback)
        return {
          ...prev,
          documents,
          step: 4,
          isAnalyzing: true,
        };
      });

      try {
        const feedback = await mockGenerateFeedback(currentMode);
        
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
    },
    []
  );

  const resetSession = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    selectMode,
    handleAudioReady,
    confirmTranscript,
    handleDocumentsReady,
    resetSession,
  };
}
