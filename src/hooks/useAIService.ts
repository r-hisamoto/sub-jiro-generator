import { useState, useCallback } from 'react';
import AIService, { AIServiceConfig, AIModelConfig, AIServiceOptions } from '../lib/aiService';

interface UseAIServiceOptions {
  config: AIServiceConfig;
}

interface AIServiceState {
  isLoading: boolean;
  error: Error | null;
  lastResult: string | null;
}

export function useAIService({ config }: UseAIServiceOptions) {
  const [state, setState] = useState<AIServiceState>({
    isLoading: false,
    error: null,
    lastResult: null,
  });

  const aiService = new AIService(config);

  const enhancePrecision = useCallback(async (input: string, options?: AIServiceOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await aiService.enhancePrecision(input, options);
      setState(prev => ({ ...prev, isLoading: false, lastResult: result }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  }, [aiService]);

  const contextAwareGeneration = useCallback(async (input: string, context: string, options?: AIServiceOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await aiService.contextAwareGeneration(input, context, options);
      setState(prev => ({ ...prev, isLoading: false, lastResult: result }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  }, [aiService]);

  const customGeneration = useCallback(async (input: string, modelConfig: Partial<AIModelConfig>, options?: AIServiceOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await aiService.customGeneration(input, modelConfig, options);
      setState(prev => ({ ...prev, isLoading: false, lastResult: result }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  }, [aiService]);

  const analyzePerformance = useCallback(async (modelId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await aiService.analyzePerformance(modelId);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  }, [aiService]);

  const optimizeModelSettings = useCallback(async (modelId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await aiService.optimizeModelSettings(modelId);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  }, [aiService]);

  return {
    ...state,
    enhancePrecision,
    contextAwareGeneration,
    customGeneration,
    analyzePerformance,
    optimizeModelSettings,
  };
}

export type { UseAIServiceOptions, AIServiceState }; 