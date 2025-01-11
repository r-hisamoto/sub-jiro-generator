import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">設定</h1>
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAI APIキー
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="sk-..."
                value={process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''}
                disabled
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}; 