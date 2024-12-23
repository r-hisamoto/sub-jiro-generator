import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { VideoFile } from "@/types/subtitle";
import { Upload } from "lucide-react";
import { useRef } from "react";

interface FileUploadProps {
  onFileSelect: (videoFile: VideoFile) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "エラー",
        description: "動画ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    onFileSelect({ file, url });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">動画ファイルをアップロード</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        ドラッグ＆ドロップまたはクリックしてファイルを選択
      </p>
      <Input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        ファイルを選択
      </Button>
    </div>
  );
};

export default FileUpload;