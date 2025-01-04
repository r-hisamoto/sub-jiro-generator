import React, { useState, useCallback } from 'react';
import { AIServiceConfig, AIModelConfig } from '../lib/aiService';

interface AIServiceConfigProps {
  initialConfig: AIServiceConfig;
  onConfigChange: (config: AIServiceConfig) => void;
}

export function AIServiceConfigComponent({ initialConfig, onConfigChange }: AIServiceConfigProps) {
  const [config, setConfig] = useState<AIServiceConfig>(initialConfig);

  const handleApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = {
      ...config,
      apiKey: e.target.value,
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleDefaultModelChange = useCallback((modelConfig: Partial<AIModelConfig>) => {
    const newConfig = {
      ...config,
      defaultModel: {
        ...config.defaultModel,
        ...modelConfig,
      },
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleCustomModelAdd = useCallback((modelConfig: AIModelConfig) => {
    const newConfig = {
      ...config,
      customModels: [...config.customModels, modelConfig],
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleCustomModelRemove = useCallback((index: number) => {
    const newConfig = {
      ...config,
      customModels: config.customModels.filter((_, i) => i !== index),
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">AI Service Configuration</h2>
      
      <div className="space-y-2">
        <label className="block">
          <span className="text-gray-700">API Key</span>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={config.apiKey}
            onChange={handleApiKeyChange}
          />
        </label>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Default Model</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-gray-700">Model ID</span>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={config.defaultModel.modelId}
              onChange={(e) => handleDefaultModelChange({ modelId: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Version</span>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={config.defaultModel.version}
              onChange={(e) => handleDefaultModelChange({ version: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Custom Models</h3>
        <div className="space-y-4">
          {config.customModels.map((model, index) => (
            <div key={index} className="p-4 border rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-gray-700">Model ID</span>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={model.modelId}
                    onChange={(e) => {
                      const newModels = [...config.customModels];
                      newModels[index] = { ...model, modelId: e.target.value };
                      handleCustomModelAdd(newModels[index]);
                    }}
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700">Version</span>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={model.version}
                    onChange={(e) => {
                      const newModels = [...config.customModels];
                      newModels[index] = { ...model, version: e.target.value };
                      handleCustomModelAdd(newModels[index]);
                    }}
                  />
                </label>
              </div>
              <button
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md"
                onClick={() => handleCustomModelRemove(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={() => handleCustomModelAdd({
              modelId: '',
              version: '',
              parameters: {},
            })}
          >
            Add Custom Model
          </button>
        </div>
      </div>
    </div>
  );
}

export type { AIServiceConfigProps }; 