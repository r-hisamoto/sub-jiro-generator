import { Subtitle } from "@/types/subtitle";

export const formatTime = (seconds: number): string => {
  const pad = (num: number): string => num.toString().padStart(2, "0");
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, "0")}`;
};

export const exportSRT = (subtitles: Subtitle[]): string => {
  return subtitles
    .map((subtitle, index) => {
      return `${index + 1}\n${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n${subtitle.text}\n\n`;
    })
    .join("");
};

export const downloadSRT = (subtitles: Subtitle[], filename: string) => {
  const content = exportSRT(subtitles);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\.[^/.]+$/, "") + ".srt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};