import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// 字幕データのバリデーションスキーマ
const SubtitleSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number(),
  endTime: z.number()
});

const SubtitlesSchema = z.array(SubtitleSchema);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // 字幕一覧の取得
        const subtitles = await getSubtitles(req.query);
        return res.status(200).json(subtitles);

      case 'POST':
        // 字幕の作成
        const newSubtitle = await createSubtitle(req.body);
        return res.status(201).json(newSubtitle);

      case 'PUT':
        // 字幕の一括更新
        const updatedSubtitles = await updateSubtitles(req.body);
        return res.status(200).json(updatedSubtitles);

      case 'DELETE':
        // 字幕の一括削除
        await deleteSubtitles(req.body);
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubtitles(query: any) {
  // TODO: データベースから字幕を取得する処理を実装
  return [];
}

async function createSubtitle(data: any) {
  const subtitle = SubtitleSchema.parse(data);
  // TODO: データベースに字幕を保存する処理を実装
  return subtitle;
}

async function updateSubtitles(data: any) {
  const subtitles = SubtitlesSchema.parse(data);
  // TODO: データベースの字幕を更新する処理を実装
  return subtitles;
}

async function deleteSubtitles(data: any) {
  const ids = z.array(z.string()).parse(data);
  // TODO: データベースから字幕を削除する処理を実装
} 