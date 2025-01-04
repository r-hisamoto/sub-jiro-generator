import React, { useState, useCallback } from 'react';
import { useAIService } from '../hooks/useAIService';
import { AIServiceConfigComponent } from './AIServiceConfig';
import type { AIServiceConfig, AIModelConfig, AIServiceOptions } from '../lib/aiService';

const defaultConfig: AIServiceConfig = {
  apiKey: process.env.REPLICATE_API_KEY || '',
  defaultModel: {
    modelId: 'stability-ai/stable-diffusion',
    version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
    parameters: {},
  },
  customModels: [],
};

export function AIServiceManager() {
  const [config, setConfig] = useState<AIServiceConfig>(defaultConfig);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [selectedModel, setSelectedModel] = useState<Partial<AIModelConfig>>(defaultConfig.defaultModel);
  const [options, setOptions] = useState<AIServiceOptions>({});

  const {
    isLoading,
    error,
    lastResult,
    enhancePrecision,
    contextAwareGeneration,
    customGeneration,
    analyzePerformance,
    optimizeModelSettings,
  } = useAIService({ config });

  const handleConfigChange = useCallback((newConfig: AIServiceConfig) => {
    setConfig(newConfig);
  }, []);

  const handleEnhancePrecision = useCallback(async () => {
    try {
      await enhancePrecision(input, options);
    } catch (error) {
      console.error('Error in enhancePrecision:', error);
    }
  }, [input, options, enhancePrecision]);

  const handleContextAwareGeneration = useCallback(async () => {
    try {
      await contextAwareGeneration(input, context, options);
    } catch (error) {
      console.error('Error in contextAwareGeneration:', error);
    }
  }, [input, context, options, contextAwareGeneration]);

  const handleCustomGeneration = useCallback(async () => {
    try {
      await customGeneration(input, selectedModel, options);
    } catch (error) {
      console.error('Error in customGeneration:', error);
    }
  }, [input, selectedModel, options, customGeneration]);

  const handleAnalyzePerformance = useCallback(async () => {
    try {
      const performance = await analyzePerformance(selectedModel.modelId || '');
      console.log('Performance analysis:', performance);
    } catch (error) {
      console.error('Error in analyzePerformance:', error);
    }
  }, [selectedModel.modelId, analyzePerformance]);

  const handleOptimizeSettings = useCallback(async () => {
    try {
      const optimizedSettings = await optimizeModelSettings(selectedModel.modelId || '');
      setSelectedModel(optimizedSettings);
    } catch (error) {
      console.error('Error in optimizeSettings:', error);
    }
  }, [selectedModel.modelId, optimizeModelSettings]);

  return (
    <div className="p-4 space-y-8">
      <AIServiceConfigComponent
        initialConfig={config}
        onConfigChange={handleConfigChange}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold">AI Service Controls</h2>

        <div className="space-y-2">
          <label className="block">
            <span className="text-gray-700">Input Text</span>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="text-gray-700">Context</span>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
            />
          </label>
        </div>

        <div className="space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
            onClick={handleEnhancePrecision}
            disabled={isLoading || !input}
          >
            Enhance Precision
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md disabled:opacity-50"
            onClick={handleContextAwareGeneration}
            disabled={isLoading || !input || !context}
          >
            Generate with Context
          </button>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-md disabled:opacity-50"
            onClick={handleCustomGeneration}
            disabled={isLoading || !input || !selectedModel.modelId}
          >
            Custom Generation
          </button>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-md disabled:opacity-50"
            onClick={handleAnalyzePerformance}
            disabled={isLoading || !selectedModel.modelId}
          >
            Analyze Performance
          </button>
          <button
            className="px-4 py-2 bg-orange-500 text-white rounded-md disabled:opacity-50"
            onClick={handleOptimizeSettings}
            disabled={isLoading || !selectedModel.modelId}
          >
            Optimize Settings
          </button>
        </div>

        {isLoading && (
          <div className="text-blue-500">Processing...</div>
        )}

        {error && (
          <div className="text-red-500">
            Error: {error.message}
          </div>
        )}

        {lastResult && (
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">Last Result:</h3>
            <pre className="mt-2 whitespace-pre-wrap">{lastResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIServiceManager; 