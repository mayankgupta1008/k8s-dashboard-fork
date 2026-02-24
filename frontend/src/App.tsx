import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { ResourceListPage } from './pages/ResourceListPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { VisualizerPage } from './pages/VisualizerPage';
import { EventsPage } from './pages/EventsPage';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 15_000,
    },
  },
});

function DarkModeEffect() {
  const { darkMode } = useApp();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <DarkModeEffect />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/resources/:type" element={<ResourceListPage />} />
              <Route path="/resources/:type/:namespace/:name" element={<ResourceDetailPage />} />
              <Route path="/resources/:type/-/:name" element={<ResourceDetailPage />} />
              <Route path="/visualizer" element={<VisualizerPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
