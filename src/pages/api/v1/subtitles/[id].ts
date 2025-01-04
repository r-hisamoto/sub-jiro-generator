import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// 字幕データのバリデーションスキーマ
const SubtitleSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number(),
  endTime: z.number()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid subtitle ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 個別の字幕の取得
        const subtitle = await getSubtitle(id);
        if (!subtitle) {
          return res.status(404).json({ error: 'Subtitle not found' });
        }
        return res.status(200).json(subtitle);

      case 'PUT':
        // 個別の字幕の更新
        const updatedSubtitle = await updateSubtitle(id, req.body);
        if (!updatedSubtitle) {
          return res.status(404).json({ error: 'Subtitle not found' });
        }
        return res.status(200).json(updatedSubtitle);

      case 'DELETE':
        // 個別の字幕の削除
        const deleted = await deleteSubtitle(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Subtitle not found' });
        }
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

async function getSubtitle(id: string) {
  // TODO: データベースから特定の字幕を取得する処理を実装
  return null;
}

async function updateSubtitle(id: string, data: any) {
  const subtitle = SubtitleSchema.parse({ ...data, id });
  // TODO: データベースの特定の字幕を更新する処理を実装
  return subtitle;
}

async function deleteSubtitle(id: string) {
  // TODO: データベースから特定の字幕を削除する処理を実装
  return true;
} 