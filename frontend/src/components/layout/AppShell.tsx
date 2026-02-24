import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useApp } from '../../context/AppContext';

export function AppShell() {
  const { sidebarOpen } = useApp();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
