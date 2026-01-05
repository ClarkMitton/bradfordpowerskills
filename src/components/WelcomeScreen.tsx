import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, FileText, Brain, CheckCircle } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const leadPhases = [
    {
      letter: "L",
      name: "Launch",
      description: "Start with purpose, inspire curiosity, and establish learning aims",
    },
    {
      letter: "E",
      name: "Establish",
      description: "Engage students with new learning through varied activities",
    },
    {
      letter: "A",
      name: "Apply",
      description: "Embed learning through higher-order thinking and challenge",
    },
    {
      letter: "D",
      name: "Demonstrate",
      description: "Assess progress and provide meaningful feedback",
    },
  ];

  const features = [
    {
      icon: Mic,
      title: "Record or Upload",
      description: "Capture your teaching session via live recording or file upload",
    },
    {
      icon: FileText,
      title: "Auto Transcribe",
      description: "AI-powered transcription with automatic name detection for privacy",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Comprehensive feedback aligned to the LEAD model framework",
    },
    {
      icon: CheckCircle,
      title: "Actionable Insights",
      description: "Clear WWW and EBI feedback to improve your practice",
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
          Record your teaching session, upload your lesson materials, and receive 
          AI-powered feedback aligned to Bradford College's LEAD model.
        </p>
      </div>

      {/* LEAD Model Overview */}
      <div className="card-elevated p-6 sm:p-8">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-6 text-center">
          The LEAD Model
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leadPhases.map((phase, index) => (
            <div
              key={phase.letter}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-secondary/50 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-3">
                {phase.letter}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{phase.name}</h3>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h2 className="text-xl font-heading font-semibold text-foreground text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-5 flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-accent-soft border border-accent/20 rounded-lg p-4 text-center">
        <p className="text-sm text-foreground">
          <strong>Privacy First:</strong> No data is stored permanently. All audio files are deleted 
          after transcription, and your session data is cleared when you close the browser.
        </p>
      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onStart} size="xl" className="group">
          Start Session Analysis
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
