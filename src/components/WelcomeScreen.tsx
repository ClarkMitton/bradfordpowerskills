import { Mic, FileText, Layers, Sparkles } from "lucide-react";

export type AnalysisMode = "quick" | "deep-dive" | "full-review";

interface WelcomeScreenProps {
  onSelectMode: (mode: AnalysisMode) => void;
}

export function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  const analysisOptions = [
    {
      id: "quick" as const,
      icon: Mic,
      title: "Quick Feedback",
      description: "Get instant feedback on any teaching moment — a full lesson, a short activity, or just a segment you want to reflect on.",
      details: ["Record or upload audio", "Auto-transcription", "Delivery-focused feedback"],
      encouragement: "Perfect for everyday practice — use it anytime you want a quick reflection on your delivery.",
    },
    {
      id: "deep-dive" as const,
      icon: FileText,
      title: "Delivery Deep Dive",
      description: "Compare what you planned against what you actually delivered in the session.",
      details: ["Audio recording", "Lesson plan upload", "Plan vs execution analysis"],
    },
    {
      id: "full-review" as const,
      icon: Layers,
      title: "Full Session Review",
      description: "Comprehensive analysis of the complete teaching cycle — from planning through delivery to student outcomes.",
      details: ["Audio recording", "Lesson plan & scaffolding", "3 pieces of student work"],
    },
  ];

  return (
    <div className="section-fade-in space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground text-balance">
          Power Skills Session Analysis
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          Get AI-powered feedback aligned to Bradford College's LEAD model.
          Choose the type of analysis you'd like to receive.
        </p>
      </div>

      {/* Analysis Options */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          What would you like feedback on?
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analysisOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelectMode(option.id)}
            className="card-elevated p-6 text-left hover:border-primary/50 transition-all duration-300 hover:shadow-lg group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col h-full">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <option.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                {option.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {option.description}
              </p>
              
              {/* Encouragement message for Quick Feedback */}
              {"encouragement" in option && option.encouragement && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-success/10 border border-success/20">
                  <Sparkles className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-success font-medium">
                    {option.encouragement}
                  </p>
                </div>
              )}
              
              <ul className="space-y-1 mt-auto">
                {option.details.map((detail, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="bg-accent-soft border border-accent/20 rounded-lg p-4 text-center">
        <p className="text-sm text-foreground">
          <strong>Privacy First:</strong> No data is stored permanently. All audio files are deleted 
          after transcription, and your session data is cleared when you close the browser.
        </p>
      </div>
    </div>
  );
}
