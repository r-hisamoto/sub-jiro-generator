import { Subtitle } from "@/types/subtitle";

export const generateSubtitles = (
  text: string,
  segmentDuration: number = 4
): Subtitle[] => {
  // テキストを文単位で分割
  const sentences = text
    .replace(/([.!?。！？])\s*/g, "$1|")
    .split("|")
    .filter(Boolean);

  return sentences.map((sentence, index) => ({
    id: String(index + 1),
    startTime: index * segmentDuration,
    endTime: (index + 1) * segmentDuration,
    text: sentence.trim(),
  }));
};