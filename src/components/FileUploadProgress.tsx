import { Progress } from "@/components/ui/progress";

interface FileUploadProgressProps {
  progress: number;
}

const FileUploadProgress = ({ progress }: FileUploadProgressProps) => {
  return (
    <div className="w-full max-w-xs mt-4 space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-center text-gray-500">
        アップロード中... {Math.round(progress)}%
      </p>
    </div>
  );
};

export default FileUploadProgress;