import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, Play, Pause, Trash2, Download, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onFastFeedback: (audioBlob: Blob, fileName: string) => void;
}

export function AudioRecorder({ onFastFeedback }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setFileName(`recording-${new Date().toISOString().slice(0, 10)}.webm`);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record your session.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/m4a", "audio/webm", "audio/ogg"];
      if (!validTypes.some((type) => file.type.includes(type.split("/")[1]))) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an audio file (MP3, WAV, M4A, WebM, or OGG).",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setFileName(file.name);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setFileName("");
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const downloadAudio = () => {
    if (audioBlob && audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Started",
        description: "Your recording is being saved to your device.",
      });
    }
  };

  const handleFastFeedback = () => {
    if (audioBlob) {
      onFastFeedback(audioBlob, fileName);
    }
  };

  return (
    <div className="section-fade-in space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Record or Upload Your Session
        </h2>
        <p className="text-muted-foreground">
          Record a live session or upload a pre-recorded audio file (15-20 minutes recommended)
        </p>
      </div>

      {!audioBlob ? (
        <div className="card-elevated p-8 space-y-6">
          {/* Recording Section */}
          <div className="flex flex-col items-center space-y-4">
            {isRecording ? (
              <>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center pulse-recording">
                      <Mic className="w-10 h-10 text-destructive" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-sm font-mono px-3 py-1 rounded-full">
                    {formatTime(recordingTime)}
                  </div>
                </div>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="mt-6"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startRecording} size="xl" className="group">
                  <Mic className="w-6 h-6" />
                  Start Recording
                </Button>
                <div className="flex items-center gap-4 w-full max-w-xs">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                >
                  <Upload className="w-5 h-5" />
                  Upload Audio File
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card-elevated p-8 space-y-6">
          {/* Audio Preview */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-md bg-secondary rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Ready for transcription
                  </p>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={clearAudio} variant="outline">
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
              <Button onClick={downloadAudio} variant="outline">
                <Download className="w-4 h-4" />
                Save to Desktop
              </Button>
              <Button onClick={handleFastFeedback} variant="success">
                <Zap className="w-4 h-4" />
                Get Fast Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">Recording Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Ensure a quiet environment for best transcription quality</li>
          <li>• Sessions of 15-20 minutes work best for detailed analysis</li>
          <li>• Speak clearly and at a natural pace</li>
          <li>• Position your device close to the main speaker</li>
        </ul>
      </div>
    </div>
  );
}
