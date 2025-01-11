import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// プロジェクトデータのバリデーションスキーマ
const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  subtitles: z.array(z.object({
    id: z.string(),
    text: z.string(),
    startTime: z.number(),
    endTime: z.number()
  })),
  settings: z.object({
    style: z.object({
      fontFamily: z.string(),
      fontSize: z.string(),
      textColor: z.string(),
      backgroundColor: z.string(),
      position: z.enum(['top', 'middle', 'bottom']),
      alignment: z.enum(['left', 'center', 'right']),
      outline: z.boolean(),
      outlineColor: z.string(),
      shadow: z.boolean(),
      shadowColor: z.string()
    }),
    export: z.object({
      format: z.enum(['webvtt', 'srt', 'ass', 'premiere', 'finalcut', 'resolve']),
      frameRate: z.number()
    })
  })
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 個別のプロジェクトの取得
        const project = await getProject(id);
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(200).json(project);

      case 'PUT':
        // 個別のプロジェクトの更新
        const updatedProject = await updateProject(id, req.body);
        if (!updatedProject) {
          return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(200).json(updatedProject);

      case 'DELETE':
        // 個別のプロジェクトの削除
        const deleted = await deleteProject(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(204).end();

      case 'POST':
        // プロジェクトの特定の操作
        switch (req.query.action) {
          case 'export':
            const exportedData = await exportProject(id, req.body);
            return res.status(200).json(exportedData);

          case 'import':
            const importedProject = await importProject(id, req.body);
            return res.status(200).json(importedProject);

          case 'clone':
            const clonedProject = await cloneProject(id);
            return res.status(201).json(clonedProject);

          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

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

async function getProject(id: string) {
  // TODO: データベースから特定のプロジェクトを取得する処理を実装
  return null;
}

async function updateProject(id: string, data: any) {
  const project = ProjectSchema.parse({
    ...data,
    id,
    updatedAt: new Date().toISOString()
  });
  // TODO: データベースの特定のプロジェクトを更新する処理を実装
  return project;
}

async function deleteProject(id: string) {
  // TODO: データベースから特定のプロジェクトを削除する処理を実装
  return true;
}

async function exportProject(id: string, options: any) {
  // TODO: プロジェクトのエクスポート処理を実装
  return { url: `https://example.com/exports/${id}.zip` };
}

async function importProject(id: string, data: any) {
  // TODO: プロジェクトのインポート処理を実装
  return { id, status: 'imported' };
}

async function cloneProject(id: string) {
  const originalProject = await getProject(id);
  if (!originalProject) {
    throw new Error('Project not found');
  }

  const now = new Date().toISOString();
  const clonedProject = {
    ...originalProject,
    id: crypto.randomUUID(),
    name: `${originalProject.name} (コピー)`,
    createdAt: now,
    updatedAt: now
  };

  // TODO: クローンしたプロジェクトをデータベースに保存する処理を実装
  return clonedProject;
} 