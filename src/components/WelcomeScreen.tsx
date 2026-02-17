import { Mic, Layers, Sparkles, GitCompare, ArrowRight } from "lucide-react";
import heroFlow from "@/assets/hero-flow.jpg";
import cardFlow1 from "@/assets/card-flow-1.jpg";
import cardFlow2 from "@/assets/card-flow-2.jpg";

export type AnalysisMode = "quick" | "deep-dive" | "full-review" | "video-analysis";
export type FeedbackPath = "new" | "comparative";

interface WelcomeScreenProps {
  onSelectMode: (mode: AnalysisMode) => void;
  onSelectPath?: (path: FeedbackPath) => void;
  showPathSelection?: boolean;
  selectedPath?: FeedbackPath | null;
}

export function WelcomeScreen({ 
  onSelectMode, 
  onSelectPath,
  showPathSelection = true,
  selectedPath = null 
}: WelcomeScreenProps) {
  
  const pathOptions = [
    {
      id: "new" as const,
      icon: Sparkles,
      title: "I Want Feedback",
      description: "Get fresh feedback on a teaching session",
      encouragement: "Perfect for standalone reflection on any lesson.",
      image: cardFlow1,
    },
    {
      id: "comparative" as const,
      icon: GitCompare,
      title: "I Want Feedback Against a Previous Session",
      description: "Compare your progress since your last analysis",
      encouragement: "See how you've grown and what to focus on next.",
      image: cardFlow2,
    },
  ];

  const analysisOptions = [
    {
      id: "quick" as const,
      icon: Mic,
      title: "Quick Feedback",
      description: "Get instant feedback on any teaching moment — a full lesson, a short activity, or just a segment you want to reflect on.",
      details: ["Record or upload audio", "Auto-transcription", "Delivery-focused feedback"],
      encouragement: "Perfect for everyday practice — use it anytime you want a quick reflection on your delivery.",
      image: cardFlow1,
    },
    {
      id: "full-review" as const,
      icon: Layers,
      title: "15 Minute Lesson",
      description: "Comprehensive analysis of the complete teaching cycle — from planning through delivery to student outcomes.",
      details: ["Audio recording", "Lesson plan & scaffolding", "3 pieces of student work"],
      encouragement: "Perfect for deep reflection — connect your planning, delivery, and student outcomes for powerful professional growth.",
      image: cardFlow2,
    },
  ];

  // If path selection is enabled and no path is selected yet, show path selection
  if (showPathSelection && !selectedPath && onSelectPath) {
    return (
      <div className="section-fade-in space-y-8">
        {/* Hero Section with flowing image */}
        <div className="relative rounded-[2rem] overflow-hidden">
          <img src={heroFlow} alt="" className="w-full h-48 sm:h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background flex items-center justify-center">
            <div className="text-center space-y-3 px-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground text-balance drop-shadow-sm">
                PowerED Session Analysis
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                Get AI-powered feedback aligned to Bradford College's LEAD model.
              </p>
            </div>
          </div>
        </div>

        {/* Path Selection */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            How would you like to proceed?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {pathOptions.map((option, index) => (
            <button
              key={option.id}
              onClick={() => onSelectPath(option.id)}
              className="card-elevated overflow-hidden text-left hover:border-primary/50 hover:shadow-lg group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card image strip */}
              <div className="h-24 overflow-hidden">
                <img src={option.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 flex flex-col">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <option.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground text-xl mb-3">
                  {option.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {option.description}
                </p>
                
                <div className="flex items-start gap-2 mt-auto p-3 rounded-2xl bg-success/10 border border-success/20">
                  <Sparkles className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success font-medium">
                    {option.encouragement}
                  </p>
                </div>

                <div className="flex items-center justify-end mt-4 text-primary font-medium">
                  <span className="text-sm">Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="bg-accent-soft border border-accent/20 rounded-2xl p-4 text-center">
          <p className="text-sm text-foreground">
            <strong>Privacy First:</strong> No data is stored permanently. All audio files are deleted 
            after transcription, and your session data is cleared when you close the browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-fade-in space-y-8">
      {/* Hero Section with flowing image */}
      <div className="relative rounded-[2rem] overflow-hidden">
        <img src={heroFlow} alt="" className="w-full h-48 sm:h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background flex items-center justify-center">
          <div className="text-center space-y-3 px-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground text-balance drop-shadow-sm">
              PowerED Session Analysis
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Get AI-powered feedback aligned to Bradford College's LEAD model.
              Choose the type of analysis you'd like to receive.
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          What would you like feedback on?
        </h2>
        {selectedPath === "comparative" && (
          <p className="text-sm text-primary font-medium">
            📊 Comparative mode: You'll upload your previous report first
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {analysisOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelectMode(option.id)}
            className="card-elevated overflow-hidden text-left hover:border-primary/50 hover:shadow-lg group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Card image strip */}
            <div className="h-24 overflow-hidden">
              <img src={option.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex flex-col">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <option.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                {option.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {option.description}
              </p>
              
              {option.encouragement && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-2xl bg-success/10 border border-success/20">
                  <Sparkles className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-success font-medium">
                    {option.encouragement}
                  </p>
                </div>
              )}
              
              <ul className="space-y-1.5 mt-auto">
                {option.details.map((detail, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="bg-accent-soft border border-accent/20 rounded-2xl p-4 text-center">
        <p className="text-sm text-foreground">
          <strong>Privacy First:</strong> No data is stored permanently. All audio files are deleted 
          after transcription, and your session data is cleared when you close the browser.
        </p>
      </div>
    </div>
  );
}
