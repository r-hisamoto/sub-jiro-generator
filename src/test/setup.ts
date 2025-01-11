import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

// Testing Libraryのマッチャーを拡張
expect.extend(matchers);

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルなモックの設定
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Web Audio APIのモック
class AudioContextMock {
  createMediaElementSource = vi.fn();
  createAnalyser = vi.fn();
  createGain = vi.fn();
  destination = {};
}

global.AudioContext = vi.fn().mockImplementation(() => new AudioContextMock());

// WebGPUのモック
const mockGPU = {
  requestAdapter: vi.fn().mockResolvedValue({
    requestDevice: vi.fn().mockResolvedValue({
      createShaderModule: vi.fn(),
      createBuffer: vi.fn(),
      createBindGroupLayout: vi.fn(),
      createPipelineLayout: vi.fn(),
      createComputePipeline: vi.fn(),
      createBindGroup: vi.fn(),
      createCommandEncoder: vi.fn(),
      queue: {
        writeBuffer: vi.fn(),
        submit: vi.fn(),
      },
    }),
  }),
  getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
  wgslLanguageFeatures: new Set(),
};

Object.defineProperty(global.navigator, 'gpu', {
  value: mockGPU,
  configurable: true,
}); 