import React, { useState, useEffect } from 'react';
import { X, Save, Zap } from 'lucide-react';
import { getAISettings, updateAISettings, testAIConnection } from '../services/aiService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    provider: 'openrouter',
    model: 'qwen/qwen2.5-vl-72b-instruct:free',
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || ''
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const currentSettings = await getAISettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error fetching AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      await updateAISettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      // First save the current settings
      await updateAISettings(settings);
      
      // Then test the connection
      const result = await testAIConnection();
      setTestResult(result);
      
      console.log('Test connection result:', result);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        message: 'Error testing connection',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">AI Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Provider
              </label>
              <select
                name="provider"
                value={settings.provider}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                name="model"
                value={settings.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
              <option value="deepseek/deepseek-chat-v3-0324:free">Deepseek Chat v3</option>
              <option value="google/gemini-2.5-pro">Google Gemini 2.5 Pro</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="anthropic/claude-sonnet-4">Anthropic Claude Sonnet 4</option>
              <option value="perplexity/sonar">Perplexity Sonar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={settings.apiKey}
                onChange={handleChange}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your API key is stored securely in your browser's local storage.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm">
              Settings saved successfully!
            </div>
          )}
          
          {testResult && (
            <div className={`mt-4 p-3 ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-md text-sm`}>
              <div className="font-medium">{testResult.message}</div>
              {testResult.details && (
                <div className="mt-2 text-xs">
                  {testResult.success ? (
                    <div>Response: {testResult.details.responsePreview}</div>
                  ) : (
                    <div>
                      <div>Error: {testResult.details.error}</div>
                      {testResult.details.settings && (
                        <div className="mt-1">
                          <div>Provider: {testResult.details.settings.provider}</div>
                          <div>Model: {testResult.details.settings.model}</div>
                          <div>API Key: {testResult.details.settings.hasApiKey ? 'Provided' : 'Missing'}</div>
                          {testResult.details.settings.apiKeyLength && (
                            <div>API Key Length: {testResult.details.settings.apiKeyLength} characters</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection || !settings.apiKey}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;
