import React, { useState, useEffect } from 'react';
import { X, FileText, ArrowRight } from 'lucide-react';
import { generateReport } from '../services/reportService';

const PROVIDERS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.5-pro',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4',
  'perplexity/sonar'
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState(
    "Vorrei avere un commento sulla composizione del portafoglio e dell'asset allocation in base al contesto macroeconomico attuale. " +
    "Il commento è rivolto a consulenti finanziari che presentano il portafoglio ai loro clienti investitori. " +
    "Quindi inserire anche dei commenti sul drawdown del portafoglio rispetto ad un benchmark, diversificazione e confronto tra indicatori rischio/rendimento"
  );
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const result = await generateReport(file, prompt, provider);
      setReport(result);
    } catch (error) {
      console.error('Error generating report:', error);
      setReport('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Generate Portfolio Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scroll">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio PDF File
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      {file ? file.name : 'test.pdf (default)'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {PROVIDERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {report && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report</h3>
                <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {report}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Generating...' : (
                  <>
                    Generate Report
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
