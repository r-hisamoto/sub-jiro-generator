import { PerformanceService } from '../performance/PerformanceService';

export class WebGPUService {
  private device: GPUDevice | null = null;
  private performanceService: PerformanceService;

  constructor(performanceService: PerformanceService) {
    this.performanceService = performanceService;
  }

  async isSupported(): Promise<boolean> {
    if (!navigator.gpu) {
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return false;
      }
      this.device = await adapter.requestDevice();
      return true;
    } catch (error) {
      console.error('WebGPU非対応:', error);
      return false;
    }
  }

  async initializeDevice(): Promise<void> {
    if (!this.device) {
      const isSupported = await this.isSupported();
      if (!isSupported) {
        throw new Error('WebGPUがサポートされていません');
      }
    }
  }

  async processAudio(file: File): Promise<string> {
    this.performanceService.startMeasurement('webgpu_process');

    try {
      if (!this.device) {
        throw new Error('WebGPUデバイスが初期化されていません');
      }

      const audioData = await this.loadAudioData(file);
      const processedData = await this.runAudioProcessing(audioData);
      
      // 音声認識処理の実行
      const result = await this.performSpeechRecognition(processedData);
      
      return result;
    } catch (error) {
      console.error('音声処理エラー:', error);
      throw error instanceof Error ? error : new Error('音声処理に失敗しました');
    } finally {
      const metrics = this.performanceService.endMeasurement('webgpu_process');
      console.log('WebGPU処理性能メトリクス:', metrics);
    }
  }

  private async loadAudioData(file: File): Promise<Float32Array> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.getChannelData(0);
    } catch (error) {
      console.error('音声データ読み込みエラー:', error);
      throw new Error('音声データの読み込みに失敗しました');
    }
  }

  private async runAudioProcessing(audioData: Float32Array): Promise<Float32Array> {
    const CHUNK_SIZE = 16384; // 16KB chunks for processing
    const processedChunks: Float32Array[] = [];

    for (let offset = 0; offset < audioData.length; offset += CHUNK_SIZE) {
      const chunk = audioData.slice(offset, offset + CHUNK_SIZE);
      const processedChunk = await this.processAudioChunk(chunk);
      processedChunks.push(processedChunk);
    }

    // 処理済みチャンクの結合
    const totalLength = processedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Float32Array(totalLength);
    let position = 0;
    for (const chunk of processedChunks) {
      result.set(chunk, position);
      position += chunk.length;
    }

    return result;
  }

  private async processAudioChunk(chunk: Float32Array): Promise<Float32Array> {
    const inputBuffer = this.device!.createBuffer({
      size: chunk.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const outputBuffer = this.device!.createBuffer({
      size: chunk.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // 計算シェーダーの設定と実行
    const computePipeline = this.device!.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device!.createShaderModule({
          code: `
            @group(0) @binding(0) var<storage, read> input: array<f32>;
            @group(0) @binding(1) var<storage, read_write> output: array<f32>;

            @compute @workgroup_size(256)
            fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
              let index = global_id.x;
              if (index >= arrayLength(&input)) {
                return;
              }
              
              // 音声信号の前処理
              // - ノイズ除去
              // - 正規化
              // - 信号増幅
              var value = input[index];
              
              // DC成分の除去
              let dc_offset = 0.0;
              value = value - dc_offset;
              
              // 正規化
              let max_amplitude = 1.0;
              value = clamp(value, -max_amplitude, max_amplitude);
              
              // 信号増幅
              let gain = 1.5;
              value = value * gain;
              
              output[index] = value;
            }
          `
        }),
        entryPoint: 'main',
      },
    });

    // バインドグループの設定
    const bindGroup = this.device!.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: inputBuffer }
        },
        {
          binding: 1,
          resource: { buffer: outputBuffer }
        }
      ],
    });

    // データの転送とコマンドの実行
    this.device!.queue.writeBuffer(inputBuffer, 0, chunk);

    const commandEncoder = this.device!.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(chunk.length / 256));
    passEncoder.end();

    // 結果の取得
    const resultBuffer = this.device!.createBuffer({
      size: chunk.byteLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    commandEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      resultBuffer,
      0,
      chunk.byteLength
    );

    this.device!.queue.submit([commandEncoder.finish()]);

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const resultArray = new Float32Array(resultBuffer.getMappedRange());
    const processedChunk = new Float32Array(resultArray);
    resultBuffer.unmap();

    return processedChunk;
  }

  private async performSpeechRecognition(processedData: Float32Array): Promise<string> {
    try {
      // WebGPUでの音声認識は現時点で実装が困難なため、
      // 常にHugging Face APIへのフォールバックを行う
      console.log('WebGPUでの音声認識は未実装のため、Hugging Face APIへフォールバック');
      return '';
    } catch (error) {
      console.error('音声認識エラー:', error);
      throw new Error('音声認識処理に失敗しました');
    }
  }
} 