import { Subtitle } from '@/types/subtitle';

/**
 * Adobe Premiere Pro用のXMLを生成する
 */
export const generatePremiereXML = (
  subtitles: Subtitle[],
  videoFile: File,
  frameRate: number = 29.97
): string => {
  const videoName = videoFile.name;
  const duration = Math.max(...subtitles.map(s => s.endTime)) * frameRate;
  
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>Subtitles Sequence</name>
    <duration>${Math.ceil(duration)}</duration>
    <rate>
      <timebase>${frameRate}</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    <media>
      <video>
        <track>`;
  
  const subtitleItems = subtitles.map(subtitle => {
    const startFrame = Math.round(subtitle.startTime * frameRate);
    const endFrame = Math.round(subtitle.endTime * frameRate);
    const duration = endFrame - startFrame;
    
    return `
          <generatoritem>
            <name>${subtitle.text}</name>
            <duration>${duration}</duration>
            <start>${startFrame}</start>
            <end>${endFrame}</end>
            <effect>
              <name>Text</name>
              <effectid>Text</effectid>
              <effectcategory>Text</effectcategory>
              <parameter>
                <parameterid>str</parameterid>
                <name>Text</name>
                <value>${subtitle.text}</value>
              </parameter>
            </effect>
          </generatoritem>`;
  }).join('');
  
  const footer = `
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
  
  return header + subtitleItems + footer;
};

/**
 * Final Cut Pro用のXMLを生成する
 */
export const generateFinalCutXML = (
  subtitles: Subtitle[],
  videoFile: File,
  frameRate: number = 29.97
): string => {
  const videoName = videoFile.name;
  const duration = Math.max(...subtitles.map(s => s.endTime)) * frameRate;
  
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>
    <format id="r1" name="FFVideoFormat" frameDuration="1/${frameRate}s"/>
  </resources>
  <library>
    <event name="Subtitles Event">
      <project name="Subtitles Project">
        <sequence format="r1">
          <spine>`;
  
  const subtitleItems = subtitles.map(subtitle => {
    const startTime = subtitle.startTime.toFixed(3);
    const duration = (subtitle.endTime - subtitle.startTime).toFixed(3);
    
    return `
            <title offset="${startTime}s" duration="${duration}s" lane="1">
              <text>
                <text-style>${subtitle.text}</text-style>
              </text>
            </title>`;
  }).join('');
  
  const footer = `
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
  
  return header + subtitleItems + footer;
};

/**
 * DaVinci Resolve用のXMLを生成する
 */
export const generateResolveXML = (
  subtitles: Subtitle[],
  videoFile: File,
  frameRate: number = 29.97
): string => {
  const videoName = videoFile.name;
  const duration = Math.max(...subtitles.map(s => s.endTime)) * frameRate;
  
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>Subtitles Timeline</name>
    <duration>${Math.ceil(duration)}</duration>
    <rate>
      <timebase>${frameRate}</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    <media>
      <video>
        <track>`;
  
  const subtitleItems = subtitles.map(subtitle => {
    const startFrame = Math.round(subtitle.startTime * frameRate);
    const endFrame = Math.round(subtitle.endTime * frameRate);
    const duration = endFrame - startFrame;
    
    return `
          <clipitem>
            <name>${subtitle.text}</name>
            <duration>${duration}</duration>
            <start>${startFrame}</start>
            <end>${endFrame}</end>
            <file id="subtitle_${startFrame}">
              <name>${subtitle.text}</name>
              <duration>${duration}</duration>
              <rate>
                <timebase>${frameRate}</timebase>
                <ntsc>TRUE</ntsc>
              </rate>
              <media>
                <video>
                  <samplecharacteristics>
                    <text>${subtitle.text}</text>
                  </samplecharacteristics>
                </video>
              </media>
            </file>
          </clipitem>`;
  }).join('');
  
  const footer = `
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
  
  return header + subtitleItems + footer;
};

/**
 * XMLファイルをダウンロードする
 */
export const downloadXML = (
  content: string,
  filename: string
): void => {
  const blob = new Blob([content], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 