export interface TransitionEffect {
  id: string;
  name: string;
  duration: number;
  cssClass: string;
  properties?: Record<string, any>;
}

export interface AnimationEffect {
  id: string;
  name: string;
  duration: number;
  cssClass: string;
  properties?: Record<string, any>;
}

// 基本的なトランジション効果
export const transitions: TransitionEffect[] = [
  {
    id: 'fade',
    name: 'フェード',
    duration: 1000,
    cssClass: 'transition-opacity',
  },
  {
    id: 'slide-left',
    name: '左スライド',
    duration: 800,
    cssClass: 'slide-left-transition',
  },
  {
    id: 'slide-right',
    name: '右スライド',
    duration: 800,
    cssClass: 'slide-right-transition',
  },
  {
    id: 'zoom',
    name: 'ズーム',
    duration: 1000,
    cssClass: 'zoom-transition',
  },
  {
    id: 'dissolve',
    name: 'ディゾルブ',
    duration: 1200,
    cssClass: 'dissolve-transition',
  },
  {
    id: 'wipe',
    name: 'ワイプ',
    duration: 800,
    cssClass: 'wipe-transition',
  },
];

// アニメーションエフェクト
export const effects: AnimationEffect[] = [
  {
    id: 'bounce',
    name: 'バウンス',
    duration: 1000,
    cssClass: 'bounce-effect',
  },
  {
    id: 'pulse',
    name: 'パルス',
    duration: 800,
    cssClass: 'pulse-effect',
  },
  {
    id: 'shake',
    name: 'シェイク',
    duration: 500,
    cssClass: 'shake-effect',
  },
  {
    id: 'rotate',
    name: '回転',
    duration: 1000,
    cssClass: 'rotate-effect',
  },
  {
    id: 'float',
    name: 'フロート',
    duration: 2000,
    cssClass: 'float-effect',
  },
];

// トランジションとエフェクトのスタイル定義
export const transitionStyles = `
  .transition-opacity {
    transition: opacity 1s ease-in-out;
  }

  .slide-left-transition {
    transition: transform 0.8s ease-in-out;
    transform: translateX(-100%);
  }

  .slide-right-transition {
    transition: transform 0.8s ease-in-out;
    transform: translateX(100%);
  }

  .zoom-transition {
    transition: transform 1s ease-in-out;
    transform: scale(0);
  }

  .dissolve-transition {
    transition: opacity 1.2s ease-in-out;
    opacity: 0;
  }

  .wipe-transition {
    transition: clip-path 0.8s ease-in-out;
    clip-path: inset(0 0 0 100%);
  }

  .bounce-effect {
    animation: bounce 1s ease infinite;
  }

  .pulse-effect {
    animation: pulse 0.8s ease infinite;
  }

  .shake-effect {
    animation: shake 0.5s ease infinite;
  }

  .rotate-effect {
    animation: rotate 1s linear infinite;
  }

  .float-effect {
    animation: float 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
`; 