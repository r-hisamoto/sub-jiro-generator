import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { VideoFile } from "@/types/subtitle";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onFileSelect: (videoFile: VideoFile) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "エラー",
          description: "ログインが必要です",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      const videoFile: VideoFile = {
        file,
        url: result.fileUrl,
      };

      onFileSelect(videoFile);
      
      toast({
        title: "成功",
        description: "動画ファイルのアップロードが完了しました",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "アップロードに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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
        disabled={isUploading}
      />
      <Button 
        variant="secondary" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "アップロード中..." : "ファイルを選択"}
      </Button>
    </div>
  );
};

export default FileUpload;