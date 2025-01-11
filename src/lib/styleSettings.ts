import { Subtitle } from '@/types/subtitle';

/**
 * スタイル設定のオプション
 */
export interface StyleSettings {
  // フォント設定
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  // 色設定
  textColor: string;
  backgroundColor: string;
  // 位置設定
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  // 効果
  outline?: boolean;
  outlineColor?: string;
  shadow?: boolean;
  shadowColor?: string;
}

/**
 * デフォルトのスタイル設定
 */
export const DEFAULT_STYLE_SETTINGS: StyleSettings = {
  fontFamily: 'Noto Sans JP',
  fontSize: '24px',
  fontWeight: 'normal',
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  position: 'bottom',
  alignment: 'center',
  outline: true,
  outlineColor: '#000000',
  shadow: false,
  shadowColor: '#000000'
};

/**
 * 利用可能なフォントファミリーのリスト
 */
export const AVAILABLE_FONTS = [
  'Noto Sans JP',
  'Noto Serif JP',
  'BIZ UDPゴシック',
  'BIZ UDP明朝',
  'M PLUS 1p',
  'M PLUS Rounded 1c',
  'Kosugi',
  'Kosugi Maru',
  'Sawarabi Gothic',
  'Sawarabi Mincho'
];

/**
 * スタイル設定をCSSスタイルオブジェクトに変換
 */
export const convertStyleSettingsToCSS = (settings: StyleSettings): React.CSSProperties => {
  const styles: React.CSSProperties = {
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight,
    color: settings.textColor,
    backgroundColor: settings.backgroundColor,
    textAlign: settings.alignment,
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    maxWidth: '80%'
  };

  // アウトラインの設定
  if (settings.outline) {
    styles.textShadow = `
      -1px -1px 0 ${settings.outlineColor},
       1px -1px 0 ${settings.outlineColor},
      -1px  1px 0 ${settings.outlineColor},
       1px  1px 0 ${settings.outlineColor}
    `;
  }

  // ドロップシャドウの設定
  if (settings.shadow) {
    styles.filter = `drop-shadow(2px 2px 2px ${settings.shadowColor})`;
  }

  // 位置の設定
  switch (settings.position) {
    case 'top':
      styles.marginTop = '20px';
      break;
    case 'middle':
      styles.marginTop = '45%';
      break;
    case 'bottom':
      styles.marginBottom = '20px';
      break;
  }

  return styles;
};

/**
 * スタイル設定をWebVTTスタイルに変換
 */
export const convertStyleSettingsToWebVTT = (settings: StyleSettings): string => {
  const lines = [
    'STYLE',
    `::cue {`,
    `  font-family: ${settings.fontFamily};`,
    `  font-size: ${settings.fontSize};`,
    `  font-weight: ${settings.fontWeight};`,
    `  color: ${settings.textColor};`,
    `  background-color: ${settings.backgroundColor};`,
    `  text-align: ${settings.alignment};`
  ];

  if (settings.outline) {
    lines.push(`  text-shadow: -1px -1px 0 ${settings.outlineColor},
      1px -1px 0 ${settings.outlineColor},
      -1px 1px 0 ${settings.outlineColor},
      1px 1px 0 ${settings.outlineColor};`);
  }

  if (settings.shadow) {
    lines.push(`  filter: drop-shadow(2px 2px 2px ${settings.shadowColor});`);
  }

  lines.push('}');
  return lines.join('\n');
}; 