import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Subtitle } from "@/types/subtitle";
import { formatTime } from "@/lib/subtitleUtils";
import { Save } from "lucide-react";

interface SubtitleEditorProps {
  subtitle: Subtitle;
  onUpdate: (subtitle: Subtitle) => void;
}

const SubtitleEditor = ({ subtitle, onUpdate }: SubtitleEditorProps) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...subtitle,
      text: e.target.value,
    });
  };

  const handleTimeChange = (
    type: "startTime" | "endTime",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const [hours, minutes, seconds] = e.target.value.split(":").map(Number);
    const time = hours * 3600 + minutes * 60 + seconds;
    onUpdate({
      ...subtitle,
      [type]: time,
    });
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">字幕編集</h3>
        <Button size="sm" variant="secondary">
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">開始時間</label>
        <Input
          type="time"
          step="1"
          value={formatTime(subtitle.startTime).split(",")[0]}
          onChange={(e) => handleTimeChange("startTime", e)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">終了時間</label>
        <Input
          type="time"
          step="1"
          value={formatTime(subtitle.endTime).split(",")[0]}
          onChange={(e) => handleTimeChange("endTime", e)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">テキスト</label>
        <Textarea
          value={subtitle.text}
          onChange={handleTextChange}
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
};

export default SubtitleEditor;