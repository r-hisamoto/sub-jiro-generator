export interface VideoFile {
  file: File;
  url: string;
}

export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
  pauseAfter?: number;
  speakerId?: string;
  words?: Word[];
  backgroundColor?: string;
  tooltip?: string;
}

export interface Word {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}