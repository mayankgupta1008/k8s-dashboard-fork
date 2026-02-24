import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useSearch } from '../../api/hooks';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const { namespace } = useApp();
  const { data: results, isLoading } = useSearch(query, namespace || undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSelect = (item: any) => {
    const ns = item.namespace || '-';
    navigate(`/resources/${item.kind.toLowerCase()}s/${ns}/${item.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          )}
          {!isLoading && query.length >= 2 && results?.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          )}
          {results?.map((item: any, i: number) => (
            <button
              key={i}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-xs font-medium text-gray-400 uppercase w-24 shrink-0">{item.kind}</span>
              <span className="text-sm font-medium truncate flex-1">{item.name}</span>
              {item.namespace && (
                <span className="text-xs text-gray-400">{item.namespace}</span>
              )}
              <StatusBadge status={item.status} />
            </button>
          ))}
        </div>

        {query.length < 2 && (
          <div className="p-4 text-center text-xs text-gray-400">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
}
