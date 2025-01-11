import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  content: string;
  subsections?: {
    id: string;
    title: string;
    content: string;
  }[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'basic',
    title: '基本操作',
    content: '字幕エディタの基本的な使い方について説明します。',
    subsections: [
      {
        id: 'add-subtitle',
        title: '字幕の追加',
        content: '「字幕を追加」ボタンをクリックするか、動画再生中にスペースキーを押すことで、現在の再生位置に新しい字幕を追加できます。'
      },
      {
        id: 'edit-subtitle',
        title: '字幕の編集',
        content: '字幕をクリックして選択し、テキストを直接編集できます。タイミングの調整は、開始時間と終了時間のフィールドを使用します。'
      },
      {
        id: 'delete-subtitle',
        title: '字幕の削除',
        content: '字幕の右側にある「削除」ボタンをクリックすると、その字幕を削除できます。'
      }
    ]
  },
  {
    id: 'text-formatting',
    title: 'テキスト整形',
    content: '字幕テキストを自動的に整形する機能について説明します。',
    subsections: [
      {
        id: 'punctuation',
        title: '句読点の自動補完',
        content: '文章の長さやポーズ情報に基づいて、適切な位置に句読点を自動的に挿入します。'
      },
      {
        id: 'kana-conversion',
        title: '漢字/ひらがなの変換',
        content: '漢字をひらがなに、またはその逆に変換できます。固有名詞は保護されます。'
      }
    ]
  },
  {
    id: 'honorific',
    title: '敬語調整',
    content: '敬語や文体の調整機能について説明します。',
    subsections: [
      {
        id: 'style-unification',
        title: '敬体/常体の統一',
        content: '文末表現を敬体（です・ます調）または常体（だ・である調）に統一できます。'
      },
      {
        id: 'honorific-level',
        title: '敬語レベルの調整',
        content: '謙譲語、丁寧語、尊敬語など、適切な敬語レベルに調整できます。'
      }
    ]
  },
  {
    id: 'export',
    title: 'エクスポート',
    content: '字幕データのエクスポート機能について説明します。',
    subsections: [
      {
        id: 'webvtt',
        title: 'WebVTT形式',
        content: 'Web用の標準的な字幕形式であるWebVTT形式でエクスポートできます。'
      },
      {
        id: 'video-editing',
        title: '動画編集ソフト用',
        content: 'Adobe Premiere Pro、Final Cut Pro、DaVinci Resolveなど、主要な動画編集ソフト用のフォーマットでエクスポートできます。'
      },
      {
        id: 'burn-subtitles',
        title: '字幕の焼き込み',
        content: '字幕を動画に直接焼き込んで、新しい動画ファイルとして出力できます。'
      }
    ]
  },
  {
    id: 'collaboration',
    title: 'チーム共有',
    content: 'プロジェクトの共有と共同編集機能について説明します。',
    subsections: [
      {
        id: 'share-project',
        title: 'プロジェクトの共有',
        content: 'プロジェクトを他のユーザーと共有し、権限を設定できます。'
      },
      {
        id: 'real-time-editing',
        title: 'リアルタイム編集',
        content: '複数のユーザーが同時に編集作業を行えます。変更は自動的に同期されます。'
      }
    ]
  }
];

interface HelpProps {
  defaultSection?: string;
}

const Help: React.FC<HelpProps> = ({ defaultSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([defaultSection || '']);

  const handleSectionClick = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>ヘルプ</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
          >
            {HELP_SECTIONS.map(section => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>{section.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {section.content}
                    </p>
                    {section.subsections && (
                      <Accordion type="single" collapsible>
                        {section.subsections.map(subsection => (
                          <AccordionItem key={subsection.id} value={subsection.id}>
                            <AccordionTrigger className="text-sm">
                              {subsection.title}
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm text-muted-foreground">
                                {subsection.content}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Help; 