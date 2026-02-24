import { Moon, Sun, Menu, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCurrentContext, useContexts, useSwitchContext } from '../../api/hooks';
import { useState } from 'react';
import { GlobalSearch } from '../common/GlobalSearch';

export function Header() {
  const { darkMode, toggleDarkMode, sidebarOpen, setSidebarOpen } = useApp();
  const { data: current } = useCurrentContext();
  const { data: contexts } = useContexts();
  const switchCtx = useSwitchContext();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Context:</span>
          <select
            value={current?.name || ''}
            onChange={e => switchCtx.mutate(e.target.value)}
            className="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {contexts?.map((ctx: any) => (
              <option key={ctx.name} value={ctx.name}>{ctx.name}</option>
            ))}
          </select>
        </div>

        {current?.cluster_info && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            v{current.cluster_info.git_version}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <kbd className="hidden sm:inline text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
