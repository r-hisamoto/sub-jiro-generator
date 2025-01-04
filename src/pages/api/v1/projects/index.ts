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

const ProjectsSchema = z.array(ProjectSchema);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // プロジェクト一覧の取得
        const projects = await getProjects(req.query);
        return res.status(200).json(projects);

      case 'POST':
        // プロジェクトの作成
        const newProject = await createProject(req.body);
        return res.status(201).json(newProject);

      case 'PUT':
        // プロジェクトの一括更新
        const updatedProjects = await updateProjects(req.body);
        return res.status(200).json(updatedProjects);

      case 'DELETE':
        // プロジェクトの一括削除
        await deleteProjects(req.body);
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

async function getProjects(query: any) {
  // TODO: データベースからプロジェクトを取得する処理を実装
  return [];
}

async function createProject(data: any) {
  const now = new Date().toISOString();
  const project = ProjectSchema.parse({
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now
  });
  // TODO: データベースにプロジェクトを保存する処理を実装
  return project;
}

async function updateProjects(data: any) {
  const projects = ProjectsSchema.parse(data);
  // TODO: データベースのプロジェクトを更新する処理を実装
  return projects;
}

async function deleteProjects(data: any) {
  const ids = z.array(z.string()).parse(data);
  // TODO: データベースからプロジェクトを削除する処理を実装
} 