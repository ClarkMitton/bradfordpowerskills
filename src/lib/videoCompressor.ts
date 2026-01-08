import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let isLoading = false;

interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  duration: number;
}

interface CompressionProgress {
  stage: "loading" | "compressing";
  progress: number; // 0-100
  message: string;
}

type ProgressCallback = (progress: CompressionProgress) => void;

async function loadFFmpeg(onProgress: ProgressCallback): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (ffmpeg && ffmpeg.loaded) {
      return ffmpeg;
    }
  }

  isLoading = true;
  onProgress({ stage: "loading", progress: 0, message: "Loading video processor..." });

  try {
    ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      onProgress({
        stage: "compressing",
        progress: Math.round(progress * 100),
        message: `Compressing: ${Math.round(progress * 100)}%`,
      });
    });

    // Load from CDN
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    onProgress({ stage: "loading", progress: 100, message: "Video processor ready" });
    return ffmpeg;
  } finally {
    isLoading = false;
  }
}

export async function compressVideo(
  file: File,
  onProgress: ProgressCallback
): Promise<CompressionResult> {
  const startTime = Date.now();
  const originalSize = file.size;

  // Skip compression for small files (under 50MB)
  if (originalSize < 50 * 1024 * 1024) {
    onProgress({ stage: "compressing", progress: 100, message: "File already optimized" });
    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      duration: 0,
    };
  }

  const ff = await loadFFmpeg(onProgress);

  onProgress({ stage: "compressing", progress: 0, message: "Preparing video..." });

  // Write input file
  const inputName = "input" + getExtension(file.name);
  await ff.writeFile(inputName, await fetchFile(file));

  onProgress({ stage: "compressing", progress: 5, message: "Compressing video..." });

  // Compress to 720p, 2Mbps video, 128kbps audio
  await ff.exec([
    "-i", inputName,
    "-vf", "scale=-2:720", // Scale to 720p, maintain aspect ratio
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28", // Quality factor (lower = better, 28 is good for uploads)
    "-b:v", "2M", // 2 Mbps video bitrate
    "-c:a", "aac",
    "-b:a", "128k", // 128 kbps audio
    "-movflags", "+faststart", // Optimize for web streaming
    "-y", // Overwrite output
    "output.mp4",
  ]);

  onProgress({ stage: "compressing", progress: 95, message: "Finalizing..." });

  // Read output
  const data = await ff.readFile("output.mp4");
  const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  const blob = new Blob([new Uint8Array(uint8Array)], { type: "video/mp4" });

  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile("output.mp4");

  const duration = (Date.now() - startTime) / 1000;

  onProgress({ stage: "compressing", progress: 100, message: "Compression complete" });

  return {
    blob,
    originalSize,
    compressedSize: blob.size,
    duration,
  };
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mov":
    case "quicktime":
      return ".mov";
    case "webm":
      return ".webm";
    case "mp4":
    default:
      return ".mp4";
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
