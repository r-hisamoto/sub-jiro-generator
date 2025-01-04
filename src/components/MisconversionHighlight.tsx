import { useEffect, useState } from 'react';
import { MisconversionInfo, detectMisconversions } from '@/lib/textFormatting';
import { cn } from '@/lib/utils';

interface MisconversionHighlightProps {
  text: string;
  className?: string;
  onMisconversionClick?: (misconversion: MisconversionInfo) => void;
}

const MisconversionHighlight: React.FC<MisconversionHighlightProps> = ({
  text,
  className,
  onMisconversionClick
}) => {
  const [misconversions, setMisconversions] = useState<MisconversionInfo[]>([]);

  useEffect(() => {
    const detectAndSetMisconversions = async () => {
      const detected = await detectMisconversions(text);
      setMisconversions(detected);
    };

    detectAndSetMisconversions();
  }, [text]);

  const renderHighlightedText = () => {
    if (misconversions.length === 0) {
      return text;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    misconversions.forEach((misconversion, index) => {
      // 誤変換の前のテキスト
      if (misconversion.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, misconversion.start)}
          </span>
        );
      }

      // 誤変換部分
      parts.push(
        <span
          key={`highlight-${index}`}
          className={cn(
            'cursor-pointer',
            misconversion.type === 'kana' ? 'bg-yellow-200' : 'bg-orange-200',
            'hover:bg-opacity-80'
          )}
          onClick={() => onMisconversionClick?.(misconversion)}
          title={misconversion.suggestion || '誤変換の可能性があります'}
        >
          {text.slice(misconversion.start, misconversion.end)}
        </span>
      );

      lastIndex = misconversion.end;
    });

    // 最後の部分
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-last">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className={cn('inline', className)}>
      {renderHighlightedText()}
    </div>
  );
};

export default MisconversionHighlight; 