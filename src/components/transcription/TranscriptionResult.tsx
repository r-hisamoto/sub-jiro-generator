import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptionResultProps {
  text: string;
}

export const TranscriptionResult = ({ text }: TranscriptionResultProps) => {
  if (!text) return null;

  return (
    <div className="mt-6 w-full max-w-xl mx-auto">
      <h3 className="text-lg font-semibold mb-2">文字起こし結果</h3>
      <ScrollArea className="h-[300px] w-full border rounded-md p-4">
        <p className="whitespace-pre-wrap">{text}</p>
      </ScrollArea>
    </div>
  );
};