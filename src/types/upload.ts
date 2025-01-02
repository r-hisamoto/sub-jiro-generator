export interface UploadResult {
  error: Error | null;
  data: any;
}

export interface VideoJobMetadata {
  filename: string;
  filesize: number;
  uploadPath: string;
  userId: string;
}