export interface ColorOverlay {
  id: string;
  name: string;
  cssFilter: string;
  cssClass: string;
}

export const colorOverlays: ColorOverlay[] = [
  {
    id: 'none',
    name: 'なし',
    cssFilter: 'none',
    cssClass: '',
  },
  {
    id: 'sepia',
    name: 'セピア',
    cssFilter: 'sepia(100%)',
    cssClass: 'filter-sepia',
  },
  {
    id: 'grayscale',
    name: '白黒',
    cssFilter: 'grayscale(100%)',
    cssClass: 'filter-grayscale',
  },
  {
    id: 'vintage',
    name: 'ビンテージ',
    cssFilter: 'sepia(50%) contrast(95%) brightness(95%)',
    cssClass: 'filter-vintage',
  },
  {
    id: 'warm',
    name: '暖色',
    cssFilter: 'brightness(105%) saturate(110%) hue-rotate(10deg)',
    cssClass: 'filter-warm',
  },
  {
    id: 'cool',
    name: '寒色',
    cssFilter: 'brightness(100%) saturate(90%) hue-rotate(-10deg)',
    cssClass: 'filter-cool',
  },
  {
    id: 'dramatic',
    name: 'ドラマチック',
    cssFilter: 'contrast(120%) brightness(95%) saturate(110%)',
    cssClass: 'filter-dramatic',
  },
  {
    id: 'fade',
    name: 'フェード',
    cssFilter: 'brightness(105%) saturate(80%) opacity(90%)',
    cssClass: 'filter-fade',
  },
];

// カラーオーバーレイのスタイル定義
export const colorOverlayStyles = `
  .filter-sepia {
    filter: sepia(100%);
  }

  .filter-grayscale {
    filter: grayscale(100%);
  }

  .filter-vintage {
    filter: sepia(50%) contrast(95%) brightness(95%);
  }

  .filter-warm {
    filter: brightness(105%) saturate(110%) hue-rotate(10deg);
  }

  .filter-cool {
    filter: brightness(100%) saturate(90%) hue-rotate(-10deg);
  }

  .filter-dramatic {
    filter: contrast(120%) brightness(95%) saturate(110%);
  }

  .filter-fade {
    filter: brightness(105%) saturate(80%) opacity(90%);
  }
`; 