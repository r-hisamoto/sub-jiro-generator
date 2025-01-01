import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import FileUploadProgress from "./FileUploadProgress";

interface FileUploadProps {
  onFileSelect: (file: { file: File; url: string }) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const { toast } = useToast();
  const {
    isUploading,
    uploadProgress,
    uploadFile,
    setIsUploading
  } = useFileUpload(onFileSelect);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "MP4、WebM、OGG形式の動画ファイルのみアップロード可能です。",
      });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ファイルサイズは5GB以下にしてください。",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const publicUrl = await uploadFile(file);
      
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
      let errorMessage = "動画のアップロードに失敗しました。";
      
      if (error instanceof Error) {
        if (error.message.includes("413")) {
          errorMessage = "ファイルサイズが大きすぎます。5GB以下のファイルをアップロードしてください。";
        } else if (error.message.includes("400")) {
          errorMessage = "ファイル形式が正しくないか、アップロード中にエラーが発生しました。";
        }
      }
      
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
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
      {isUploading && <FileUploadProgress progress={uploadProgress} />}
    </div>
  );
};

export default FileUpload;