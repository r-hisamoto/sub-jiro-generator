import type { TransitionEffect, AnimationEffect } from './transitions';
import type { ColorOverlay } from './colorOverlays';

interface UserAction {
  type: string;
  timestamp: number;
  data: any;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
}

interface UserFeedback {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  context?: any;
}

class Analytics {
  private static instance: Analytics;
  private actions: UserAction[] = [];
  private metrics: PerformanceMetrics[] = [];
  private feedback: UserFeedback[] = [];
  private observers: Set<(feedback: UserFeedback) => void> = new Set();

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // ユーザーアクションの記録
  trackAction(type: string, data: any) {
    const action: UserAction = {
      type,
      timestamp: Date.now(),
      data,
    };
    this.actions.push(action);
    this.analyzeAction(action);
  }

  // パフォーマンスメトリクスの記録
  recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    this.optimizePerformance(metrics);
  }

  // フィードバックの送信
  sendFeedback(feedback: Omit<UserFeedback, 'timestamp'>) {
    const fullFeedback: UserFeedback = {
      ...feedback,
      timestamp: Date.now(),
    };
    this.feedback.push(fullFeedback);
    this.notifyObservers(fullFeedback);
  }

  // フィードバックの購読
  subscribeFeedback(callback: (feedback: UserFeedback) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(feedback: UserFeedback) {
    this.observers.forEach(observer => observer(feedback));
  }

  // ユーザーアクションの分析
  private analyzeAction(action: UserAction) {
    switch (action.type) {
      case 'transition_change':
        this.analyzeTransitionUsage(action.data);
        break;
      case 'effect_change':
        this.analyzeEffectUsage(action.data);
        break;
      case 'overlay_change':
        this.analyzeOverlayUsage(action.data);
        break;
    }
  }

  // トランジション使用状況の分析
  private analyzeTransitionUsage(transition: TransitionEffect) {
    const recentTransitions = this.actions
      .filter(a => a.type === 'transition_change')
      .slice(-10);

    if (recentTransitions.length >= 5) {
      const uniqueTransitions = new Set(
        recentTransitions.map(a => a.data.id)
      ).size;

      if (uniqueTransitions <= 2) {
        this.sendFeedback({
          type: 'info',
          message: '他のトランジション効果も試してみませんか？より魅力的なスライドショーになるかもしれません。',
        });
      }
    }
  }

  // エフェクト使用状況の分析
  private analyzeEffectUsage(effect: AnimationEffect) {
    const recentEffects = this.actions
      .filter(a => a.type === 'effect_change')
      .slice(-5);

    if (recentEffects.length >= 3) {
      const sameEffect = recentEffects.every(
        a => a.data.id === effect.id
      );

      if (sameEffect) {
        this.sendFeedback({
          type: 'info',
          message: '同じエフェクトを続けて使用しています。バリエーションを加えることで、より印象的な演出になります。',
        });
      }
    }
  }

  // オーバーレイ使用状況の分析
  private analyzeOverlayUsage(overlay: ColorOverlay) {
    const recentOverlays = this.actions
      .filter(a => a.type === 'overlay_change')
      .slice(-3);

    if (recentOverlays.length >= 3) {
      const frequentChanges = recentOverlays.every(
        (a, i, arr) => i === 0 || a.timestamp - arr[i - 1].timestamp < 2000
      );

      if (frequentChanges) {
        this.sendFeedback({
          type: 'warning',
          message: 'オーバーレイの頻繁な変更は、視聴者の注意を散漫にする可能性があります。',
        });
      }
    }
  }

  // パフォーマンスの最適化
  private optimizePerformance(metrics: PerformanceMetrics) {
    if (metrics.frameRate < 30) {
      this.sendFeedback({
        type: 'warning',
        message: 'パフォーマンスが低下しています。アニメーション効果を減らすことで改善される可能性があります。',
        context: metrics,
      });
    }

    if (metrics.memoryUsage > 500) {
      this.sendFeedback({
        type: 'warning',
        message: 'メモリ使用量が高くなっています。ブラウザのリフレッシュをお勧めします。',
        context: metrics,
      });
    }
  }

  // 使用統計の取得
  getUsageStats() {
    return {
      totalActions: this.actions.length,
      uniqueTransitions: new Set(
        this.actions
          .filter(a => a.type === 'transition_change')
          .map(a => a.data.id)
      ).size,
      uniqueEffects: new Set(
        this.actions
          .filter(a => a.type === 'effect_change')
          .map(a => a.data.id)
      ).size,
      averageFrameRate: this.metrics.reduce((sum, m) => sum + m.frameRate, 0) / this.metrics.length,
    };
  }
}

export const analytics = Analytics.getInstance();
export type { UserAction, PerformanceMetrics, UserFeedback }; 