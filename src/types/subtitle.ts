export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoFile {
  file: File;
  url: string;
}