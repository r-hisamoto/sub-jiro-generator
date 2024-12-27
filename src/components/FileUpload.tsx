import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onFileSelect: (file: { file: File; url: string }) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "MP4、WebM、OGG形式の動画ファイルのみアップロード可能です。",
      });
      return;
    }

    // Validate file size (500MB limit)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ファイルサイズは500MB以下にしてください。",
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
          variant: "destructive",
          title: "エラー",
          description: "ログインが必要です。",
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
        throw new Error(result.error || '動画のアップロードに失敗しました。');
      }

      toast({
        title: "成功",
        description: "動画のアップロードが完了しました。",
      });

      onFileSelect({
        file,
        url: result.publicUrl,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "動画のアップロードに失敗しました。",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">クリックして動画をアップロード</span>
            {" "}または動画をドラッグ＆ドロップ
          </p>
          <p className="text-xs text-gray-500">MP4, WebM, OGG (最大500MB)</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="video/mp4,video/webm,video/ogg"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
      {isUploading && (
        <div className="mt-4">
          <Button disabled>
            アップロード中...
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;