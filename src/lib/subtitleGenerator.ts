import { Subtitle } from "@/types/subtitle";

export const generateSubtitles = (
  text: string,
  segmentDuration: number = 4
): Subtitle[] => {
  // テキストを文単位で分割（句点や感嘆符などで区切る）
  const sentences = text
    .replace(/([。．.!?！？])\s*/g, "$1|")
    .split("|")
    .filter(Boolean)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  // 各文に対して字幕オブジェクトを生成
  return sentences.map((sentence, index) => {
    const startTime = index * segmentDuration;
    // 文の長さに応じて表示時間を調整（最小2秒、最大8秒）
    const duration = Math.min(
      Math.max(2, sentence.length * 0.2),
      8
    );

    return {
      id: String(index + 1),
      startTime,
      endTime: startTime + duration,
      text: sentence,
    };
  });
};