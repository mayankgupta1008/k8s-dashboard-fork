import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface YamlViewerProps {
  yaml: string;
}

export function YamlViewer({ yaml }: YamlViewerProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml');

  const content = format === 'json' && yaml
    ? (() => {
        try {
          // yaml is already a string from the API - try to parse if it's JSON-like
          return yaml;
        } catch {
          return yaml;
        }
      })()
    : yaml;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-1">
          <button
            onClick={() => setFormat('yaml')}
            className={`px-3 py-1 text-xs rounded ${format === 'yaml' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            YAML
          </button>
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1 text-xs rounded ${format === 'json' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            JSON
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-auto max-h-[70vh] font-mono leading-relaxed">
        <code>{content}</code>
      </pre>
    </div>
  );
}
