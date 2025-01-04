import React from 'react';
import { colorOverlays, ColorOverlay } from '../lib/colorOverlays';

interface ColorOverlaySelectorProps {
  selectedOverlay?: ColorOverlay;
  onChange: (overlay: ColorOverlay) => void;
}

export function ColorOverlaySelector({
  selectedOverlay,
  onChange,
}: ColorOverlaySelectorProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colorOverlays.map((overlay) => (
          <button
            key={overlay.id}
            className={`group relative rounded-lg overflow-hidden transition-all duration-200 ${
              selectedOverlay?.id === overlay.id
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
            }`}
            onClick={() => onChange(overlay)}
          >
            <div className="aspect-video w-full">
              <div
                className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
                style={{ filter: overlay.cssFilter }}
              />
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 p-2 ${
                selectedOverlay?.id === overlay.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/50 text-white group-hover:bg-black/70'
              } transition-colors duration-200`}
            >
              <span className="block text-sm font-medium text-center">
                {overlay.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedOverlay && selectedOverlay.id !== 'none' && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">プレビュー</h4>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => onChange(colorOverlays[0])} // 'none' オーバーレイを選択
            >
              リセット
            </button>
          </div>
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
            <div
              className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
              style={{ filter: selectedOverlay.cssFilter }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>フィルター: {selectedOverlay.cssFilter}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export type { ColorOverlaySelectorProps }; 