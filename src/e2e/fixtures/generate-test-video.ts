import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTestVideo() {
  const outputPath = path.join(__dirname, 'test-video.mp4');
  
  // FFmpegを使用して10秒のテスト動画を生成
  const command = `ffmpeg -f lavfi -i color=c=blue:s=1280x720:d=10 -vf "drawtext=text='Test Video':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 ${outputPath}`;
  
  try {
    await execAsync(command);
    console.log('テスト動画の生成が完了しました:', outputPath);
  } catch (error) {
    console.error('テスト動画の生成に失敗しました:', error);
  }
}

generateTestVideo(); 