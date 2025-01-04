import { OperationalTransform } from './collaboration';

/**
 * WebSocket接続の状態
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket接続のオプション
 */
export interface WebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

/**
 * WebSocket接続を管理するクラス
 */
export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectCount = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private stateChangeHandlers: Set<(state: ConnectionState) => void> = new Set();

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnectAttempts: 5,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      ...options
    };
  }

  /**
   * WebSocket接続を開始
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupEventHandlers();
      this.notifyStateChange('connecting');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyStateChange('error');
      this.handleReconnect();
    }
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.notifyStateChange('disconnected');
  }

  /**
   * メッセージを送信
   */
  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, data });
    }
  }

  /**
   * 編集操作を送信
   */
  sendOperation(transform: OperationalTransform): void {
    this.send('operation', transform);
  }

  /**
   * メッセージハンドラを登録
   */
  on(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    return () => this.messageHandlers.get(type)?.delete(handler);
  }

  /**
   * 接続状態の変更を監視
   */
  onStateChange(handler: (state: ConnectionState) => void): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  /**
   * イベントハンドラを設定
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectCount = 0;
      this.notifyStateChange('connected');
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      this.notifyStateChange('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyStateChange('error');
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        this.messageHandlers.get(type)?.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  /**
   * 再接続を試みる
   */
  private handleReconnect(): void {
    if (this.reconnectCount >= this.options.reconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectCount++;
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectCount}/${this.options.reconnectAttempts})`);
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * ハートビートを開始
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat', { timestamp: Date.now() });
    }, this.options.heartbeatInterval);
  }

  /**
   * ハートビートを停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 接続状態の変更を通知
   */
  private notifyStateChange(state: ConnectionState): void {
    this.stateChangeHandlers.forEach(handler => handler(state));
  }
}

/**
 * WebSocket接続のインスタンスを作成
 */
export const createWebSocketConnection = (options: WebSocketOptions): WebSocketConnection => {
  return new WebSocketConnection(options);
}; 