import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  ArrowRight, 
  Check,
  FileSpreadsheet,
  Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface DocumentUploaderProps {
  onDocumentsReady: (documents: {
    lessonPlan: File | null;
    scaffolding: File | null;
    lowerAbility: File | null;
    middleAbility: File | null;
    higherAbility: File | null;
  }) => void;
}

type DocumentKey = "lessonPlan" | "scaffolding" | "lowerAbility" | "middleAbility" | "higherAbility";

interface DocumentField {
  key: DocumentKey;
  label: string;
  description: string;
  required: boolean;
}

const documentFields: DocumentField[] = [
  {
    key: "lessonPlan",
    label: "LEAD Lesson Plan",
    description: "Upload your completed lesson plan (.docx, .pdf, .pptx)",
    required: true,
  },
  {
    key: "scaffolding",
    label: "Scaffolded Support Materials",
    description: "Any support materials used in the session",
    required: false,
  },
  {
    key: "lowerAbility",
    label: "Lower Ability Student Work",
    description: "Work sample from a lower ability learner",
    required: true,
  },
  {
    key: "middleAbility",
    label: "Middle Ability Student Work",
    description: "Work sample from a middle ability learner",
    required: true,
  },
  {
    key: "higherAbility",
    label: "Higher Ability Student Work",
    description: "Work sample from a higher ability learner",
    required: true,
  },
];

const acceptedTypes = ".docx,.pdf,.pptx,.doc,.ppt,.jpg,.jpeg,.png,.gif";

export function DocumentUploader({ onDocumentsReady }: DocumentUploaderProps) {
  const [files, setFiles] = useState<Record<DocumentKey, UploadedFile | null>>({
    lessonPlan: null,
    scaffolding: null,
    lowerAbility: null,
    middleAbility: null,
    higherAbility: null,
  });

  const { toast } = useToast();

  const handleFileChange = (key: DocumentKey, file: File | null) => {
    if (file) {
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      setFiles((prev) => ({
        ...prev,
        [key]: { file, preview },
      }));
    } else {
      if (files[key]?.preview) {
        URL.revokeObjectURL(files[key]!.preview!);
      }
      setFiles((prev) => ({
        ...prev,
        [key]: null,
      }));
    }
  };

  const handleDrop = (key: DocumentKey, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(key, file);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.includes("presentation") || file.name.endsWith(".pptx") || file.name.endsWith(".ppt"))
      return Presentation;
    if (file.type.includes("spreadsheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))
      return FileSpreadsheet;
    return FileText;
  };

  const isComplete = documentFields
    .filter((f) => f.required)
    .every((f) => files[f.key] !== null);

  const handleSubmit = () => {
    if (!isComplete) {
      toast({
        title: "Missing Required Documents",
        description: "Please upload all required documents before continuing.",
        variant: "destructive",
      });
      return;
    }

    onDocumentsReady({
      lessonPlan: files.lessonPlan?.file || null,
      scaffolding: files.scaffolding?.file || null,
      lowerAbility: files.lowerAbility?.file || null,
      middleAbility: files.middleAbility?.file || null,
      higherAbility: files.higherAbility?.file || null,
    });
  };

  return (
    <div className="section-fade-in space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Upload Session Materials
        </h2>
        <p className="text-muted-foreground">
          Provide your lesson plan and student work samples for comprehensive analysis
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {documentFields.map((field, index) => (
          <div
            key={field.key}
            className={cn(
              "card-elevated p-4 animate-fade-in",
              field.key === "lessonPlan" && "sm:col-span-2"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {field.label}
                  {field.required && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {field.description}
                </p>
              </div>
              {files[field.key] && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFileChange(field.key, null)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {files[field.key] ? (
              <div className="flex items-center gap-3 bg-success/10 rounded-lg p-3">
                {files[field.key]!.preview ? (
                  <img
                    src={files[field.key]!.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                    {(() => {
                      const Icon = getFileIcon(files[field.key]!.file);
                      return <Icon className="w-6 h-6 text-muted-foreground" />;
                    })()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {files[field.key]!.file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(files[field.key]!.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Check className="w-5 h-5 text-success flex-shrink-0" />
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(field.key, e)}
                className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Drop file or click to upload
                </span>
                <input
                  type="file"
                  accept={acceptedTypes}
                  onChange={(e) =>
                    handleFileChange(field.key, e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          size="lg"
          disabled={!isComplete}
          className="group"
        >
          Generate AI Feedback
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {Object.values(files).filter(Boolean).length} of {documentFields.length} documents uploaded
          {!isComplete && " (complete required fields to continue)"}
        </p>
      </div>
    </div>
  );
}
