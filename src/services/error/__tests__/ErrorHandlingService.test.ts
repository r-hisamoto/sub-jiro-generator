import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('ErrorHandlingService', () => {
  let errorHandlingService: ErrorHandlingService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    errorHandlingService = new ErrorHandlingService(mockPerformanceService);
  });

  it('エラーをキャプチャして処理できる', async () => {
    const error = new Error('Test error');
    error.name = 'TestError';
    error.stack = 'Error stack trace';
    
    const result = await errorHandlingService.captureError(error);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('name', error.name);
  });

  it('フォールバックUIを表示できる', async () => {
    const context = {
      component: 'VideoPlayer',
      error: 'Failed to load video',
      fallbackType: 'placeholder'
    };
    
    const result = await errorHandlingService.showFallbackUI(context);
    
    expect(result).toHaveProperty('component');
    expect(result).toHaveProperty('fallback');
    expect(result).toHaveProperty('retry');
  });

  it('エラーレポートを生成できる', async () => {
    const errors = [
      { id: '1', type: 'NetworkError', message: 'Connection failed' },
      { id: '2', type: 'ValidationError', message: 'Invalid input' }
    ];
    
    const report = await errorHandlingService.generateErrorReport(errors);
    
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('errors');
    expect(report).toHaveProperty('summary');
    expect(report.errors).toHaveLength(2);
  });

  it('エラー回復メカニズムを実行できる', async () => {
    const error = {
      type: 'DataCorruption',
      affected: ['file1.mp4', 'file2.mp4'],
      severity: 'high'
    };
    
    const recovery = await errorHandlingService.executeRecovery(error);
    
    expect(recovery).toHaveProperty('success');
    expect(recovery).toHaveProperty('actions');
    expect(recovery).toHaveProperty('status');
  });

  it('エラー通知を送信できる', async () => {
    const notification = {
      type: 'error',
      message: 'Critical system error',
      priority: 'high'
    };
    
    const result = await errorHandlingService.sendErrorNotification(notification);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('sent');
    expect(result).toHaveProperty('timestamp');
  });

  it('エラーログを管理できる', async () => {
    const logEntry = {
      level: 'error',
      message: 'Application crash',
      context: { user: 'test-user' }
    };
    
    const result = await errorHandlingService.logError(logEntry);
    const logs = await errorHandlingService.getErrorLogs();
    
    expect(result).toHaveProperty('id');
    expect(logs).toContainEqual(expect.objectContaining(logEntry));
  });

  it('エラー診断を実行できる', async () => {
    const context = {
      error: new Error('Performance degradation'),
      system: {
        memory: 'low',
        cpu: 'high'
      }
    };
    
    const diagnosis = await errorHandlingService.diagnoseError(context);
    
    expect(diagnosis).toHaveProperty('cause');
    expect(diagnosis).toHaveProperty('recommendations');
    expect(diagnosis).toHaveProperty('severity');
  });

  it('エラー統計を収集できる', async () => {
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };
    
    const stats = await errorHandlingService.collectErrorStats(timeRange);
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('trends');
  });

  it('自動リカバリーを設定できる', async () => {
    const config = {
      errorType: 'NetworkError',
      maxRetries: 3,
      backoffStrategy: 'exponential'
    };
    
    const result = await errorHandlingService.configureAutoRecovery(config);
    
    expect(result).toHaveProperty('enabled');
    expect(result).toHaveProperty('config');
    expect(result.config).toEqual(config);
  });

  it('エラー時のデータバックアップを実行できる', async () => {
    const data = {
      type: 'project',
      id: 'proj1',
      content: 'Important data'
    };
    
    const backup = await errorHandlingService.backupOnError(data);
    
    expect(backup).toHaveProperty('id');
    expect(backup).toHaveProperty('timestamp');
    expect(backup).toHaveProperty('location');
  });

  it('エラー時に適切に処理される', async () => {
    const invalidContext = null;
    
    await expect(
      errorHandlingService.diagnoseError(invalidContext)
    ).rejects.toThrow('Invalid diagnosis context');
  });
}); 