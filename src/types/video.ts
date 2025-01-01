export interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    filename: string;
    filesize: number;
    duration?: number;
    format?: string;
  };
  upload_path: string;
  output_path?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingQueueItem {
  id: string;
  job_id: string;
  upload_path: string;
  total_chunks: number;
  metadata: {
    filename: string;
    filesize: number;
    contentType: string;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  created_at: string;
  processed_at?: string;
}