import { Button } from "@/components/ui/button";
import { Mic, FileText, Layers } from "lucide-react";

export type AnalysisMode = "recording" | "resources" | "deep-dive";

interface WelcomeScreenProps {
  onSelectMode: (mode: AnalysisMode) => void;
}

export function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  const analysisOptions = [
    {
      id: "recording" as const,
      icon: Mic,
      title: "Lesson Recording Feedback",
      description: "Get AI-powered feedback on your teaching session from an audio recording",
      details: ["Record or upload audio", "Auto-transcription", "LEAD model analysis"],
    },
    {
      id: "resources" as const,
      icon: FileText,
      title: "Delivery Resources Feedback",
      description: "Receive feedback on your lesson plan and teaching materials",
      details: ["Upload lesson plan", "Scaffolding materials", "Resource analysis"],
    },
    {
      id: "deep-dive" as const,
      icon: Layers,
      title: "Power Skills Deep Dive",
      description: "Comprehensive analysis combining recording, resources, and student work",
      details: ["Audio recording", "Lesson plan & resources", "3 pieces of student work"],
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
              <p className="text-muted-foreground text-sm mb-4 flex-grow">
                {option.description}
              </p>
              <ul className="space-y-1">
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
