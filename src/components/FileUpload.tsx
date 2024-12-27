import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: { file: File; url: string }) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadChunk = async (
    file: File,
    filePath: string,
    chunk: Blob,
    chunkIndex: number,
    isLastChunk: boolean
  ) => {
    // セッションの確認と更新
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('セッションが無効です。再度ログインしてください。');
    }

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(`${filePath}${isLastChunk ? '' : `_part${chunkIndex}`}`, chunk, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('jwt expired') || uploadError.message.includes('Unauthorized')) {
        // セッションの更新を試みる
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('セッションの更新に失敗しました。再度ログインしてください。');
        }
        // 更新後に再度アップロードを試みる
        return uploadChunk(file, filePath, chunk, chunkIndex, isLastChunk);
      }
      throw new Error(uploadError.message);
    }
    return chunkIndex;
  };

  const uploadFile = async (file: File, filePath: string) => {
    try {
      const chunkSize = 50 * 1024 * 1024; // 50MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      let completedChunks = 0;

      // Upload chunks sequentially
      for (let start = 0; start < file.size; start += chunkSize) {
        const chunk = file.slice(start, start + chunkSize);
        const chunkIndex = Math.floor(start / chunkSize);
        const isLastChunk = chunkIndex === totalChunks - 1;
        
        try {
          await uploadChunk(file, filePath, chunk, chunkIndex, isLastChunk);
          completedChunks++;
          const progress = Math.min((completedChunks / totalChunks) * 100, 95);
          setUploadProgress(progress);
        } catch (error) {
          console.error('Chunk upload error:', error);
          throw error;
        }
      }

      setUploadProgress(100);
      return filePath;
    } catch (error) {
      throw error;
    }
  };

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

    // Validate file size (5GB limit for Pro plan)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ファイルサイズは5GB以下にしてください。",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ログインが必要です。",
        });
        return;
      }

      // Generate a unique file path including user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file in chunks
      await uploadFile(file, fileName);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Insert record into videos table
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: file.name,
          file_path: fileName,
          content_type: file.type,
          size: file.size,
          user_id: user.id
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setUploadProgress(100);

      toast({
        title: "成功",
        description: "動画のアップロードが完了しました。",
      });

      onFileSelect({
        file,
        url: publicUrl,
      });
    } catch (error) {
      console.error('Upload error:', error);
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
          <p className="text-xs text-gray-500">MP4, WebM, OGG (最大5GB)</p>
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
        <div className="w-full max-w-xs mt-4 space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-center text-gray-500">
            アップロード中... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;