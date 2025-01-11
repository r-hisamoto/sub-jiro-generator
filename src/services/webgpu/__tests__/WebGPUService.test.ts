import { describe, it, expect, vi } from 'vitest';
import { WebGPUService } from '../WebGPUService';

describe('WebGPUService', () => {
  let webGPUService: WebGPUService;

  beforeEach(() => {
    webGPUService = new WebGPUService();
  });

  it('GPUデバイスが利用可能な場合に初期化が成功する', async () => {
    const mockAdapter = {
      requestDevice: vi.fn().mockResolvedValue({
        createBuffer: vi.fn(),
        createCommandEncoder: vi.fn(),
        queue: {
          submit: vi.fn()
        }
      })
    };

    Object.defineProperty(global.navigator, 'gpu', {
      value: {
        requestAdapter: vi.fn().mockResolvedValue(mockAdapter)
      },
      configurable: true
    });

    const result = await webGPUService.initialize();
    expect(result).toBe(true);
  });

  it('GPUデバイスが利用できない場合に初期化が失敗する', async () => {
    Object.defineProperty(global.navigator, 'gpu', {
      value: null,
      configurable: true
    });
    
    const result = await webGPUService.initialize();
    expect(result).toBe(false);
  });

  it('バッファの作成と破棄が正しく動作する', async () => {
    const mockDevice = {
      createBuffer: vi.fn().mockReturnValue({
        destroy: vi.fn()
      }),
      createCommandEncoder: vi.fn(),
      queue: {
        submit: vi.fn()
      }
    };

    webGPUService['device'] = mockDevice as unknown as GPUDevice;
    const buffer = await webGPUService.createBuffer(1024);

    expect(buffer).toBeDefined();
    expect(mockDevice.createBuffer).toHaveBeenCalled();

    await webGPUService.destroyBuffer(buffer);
    expect(buffer.destroy).toHaveBeenCalled();
  });

  it('コマンドエンコーダーの作成が正しく動作する', async () => {
    const mockDevice = {
      createCommandEncoder: vi.fn().mockReturnValue({
        finish: vi.fn()
      }),
      queue: {
        submit: vi.fn()
      }
    };

    webGPUService['device'] = mockDevice as unknown as GPUDevice;
    const encoder = await webGPUService.createCommandEncoder();

    expect(encoder).toBeDefined();
    expect(mockDevice.createCommandEncoder).toHaveBeenCalled();
  });

  it('コマンドの実行が正しく動作する', async () => {
    const mockDevice = {
      queue: {
        submit: vi.fn()
      }
    };

    const mockCommandBuffer = {};
    const mockEncoder = {
      finish: vi.fn().mockReturnValue(mockCommandBuffer)
    };

    webGPUService['device'] = mockDevice as unknown as GPUDevice;
    await webGPUService.executeCommands(mockEncoder as unknown as GPUCommandEncoder);

    expect(mockEncoder.finish).toHaveBeenCalled();
    expect(mockDevice.queue.submit).toHaveBeenCalledWith([mockCommandBuffer]);
  });

  it('リソースの解放が正しく動作する', async () => {
    const mockBuffer = {
      destroy: vi.fn()
    };

    webGPUService['buffers'].push(mockBuffer as unknown as GPUBuffer);
    await webGPUService.cleanup();

    expect(mockBuffer.destroy).toHaveBeenCalled();
    expect(webGPUService['buffers']).toHaveLength(0);
  });
}); 