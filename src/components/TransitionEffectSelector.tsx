import React, { useState } from 'react';
import { transitions, effects, TransitionEffect, AnimationEffect } from '../lib/transitions';

interface TransitionEffectSelectorProps {
  selectedTransition?: TransitionEffect;
  selectedEffect?: AnimationEffect;
  onTransitionChange: (transition: TransitionEffect | undefined) => void;
  onEffectChange: (effect: AnimationEffect | undefined) => void;
  onBulkApplyTransitions: (selectedTransitions: TransitionEffect[]) => void;
}

export function TransitionEffectSelector({
  selectedTransition,
  selectedEffect,
  onTransitionChange,
  onEffectChange,
  onBulkApplyTransitions,
}: TransitionEffectSelectorProps) {
  const [selectedTransitions, setSelectedTransitions] = useState<Set<string>>(new Set());

  const handleTransitionSelect = (transition: TransitionEffect) => {
    const newSelected = new Set(selectedTransitions);
    if (newSelected.has(transition.id)) {
      newSelected.delete(transition.id);
    } else {
      newSelected.add(transition.id);
    }
    setSelectedTransitions(newSelected);
  };

  const handleBulkApply = () => {
    if (selectedTransitions.size === 0) return;
    const selectedTransitionEffects = transitions.filter(t => 
      selectedTransitions.has(t.id)
    );
    onBulkApplyTransitions(selectedTransitionEffects);
  };

  return (
    <div className="space-y-8">
      {/* トランジション効果 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">トランジション効果</h3>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTransitions.size > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleBulkApply}
            disabled={selectedTransitions.size === 0}
          >
            {selectedTransitions.size > 0
              ? `選択したトランジションを一括適用 (${selectedTransitions.size}個)`
              : 'トランジションを選択してください'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {transitions.map((transition) => (
            <button
              key={transition.id}
              className={`group relative p-4 rounded-lg border-2 transition-all ${
                selectedTransitions.has(transition.id)
                  ? 'border-blue-500 bg-blue-50'
                  : selectedTransition?.id === transition.id
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                handleTransitionSelect(transition);
                onTransitionChange(
                  selectedTransition?.id === transition.id ? undefined : transition
                );
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{transition.name}</span>
                {selectedTransitions.has(transition.id) && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                持続時間: {transition.duration}ms
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* アニメーション効果 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">アニメーション効果</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {effects.map((effect) => (
            <button
              key={effect.id}
              className={`group relative p-4 rounded-lg border-2 transition-all ${
                selectedEffect?.id === effect.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onEffectChange(
                selectedEffect?.id === effect.id ? undefined : effect
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{effect.name}</span>
                {selectedEffect?.id === effect.id && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                持続時間: {effect.duration}ms
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">プレビュー</h3>
        <div className="relative aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg shadow-lg ${
                selectedTransition?.cssClass || ''
              } ${selectedEffect?.cssClass || ''}`}
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {selectedTransition && (
            <div>選択中のトランジション: {selectedTransition.name}</div>
          )}
          {selectedEffect && (
            <div>選択中のエフェクト: {selectedEffect.name}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { TransitionEffectSelectorProps }; 