import { Progress } from "@/components/ui/progress";

interface FileUploadProgressProps {
  progress: {
    bytesUploaded: number;
    totalBytes: number;
    percentage: number;
    currentChunk: number;
    totalChunks: number;
    status: string;
  };
}

const FileUploadProgress = ({ progress }: FileUploadProgressProps) => {
  return (
    <div className="w-full max-w-xs mt-4 space-y-2">
      <Progress value={progress.percentage} className="h-2" />
      <div className="text-sm text-center text-gray-500 space-y-1">
        <p>ステータス: {progress.status}</p>
        <p>
          {Math.round(progress.bytesUploaded / 1024 / 1024)}MB / 
          {Math.round(progress.totalBytes / 1024 / 1024)}MB
        </p>
        <p>チャンク: {progress.currentChunk} / {progress.totalChunks}</p>
      </div>
    </div>
  );
};

export default FileUploadProgress;