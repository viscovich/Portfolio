import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getAISettings, updateAISettings } from '../services/aiService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    apiKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
                <option value="google/gemini-2.0-flash-lite-preview-02-05:free">Google Gemini 2.0 Flash Lite</option>
                <option value="google/gemini-pro">Google Gemini Pro</option>
                <option value="anthropic/claude-3-opus">Anthropic Claude 3 Opus</option>
                <option value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</option>
                <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                <option value="openai/gpt-4-turbo">OpenAI GPT-4 Turbo</option>
                <option value="meta-llama/llama-3-70b-instruct">Meta Llama 3 70B</option>
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

          <div className="mt-6 flex justify-end">
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
