import { useCurrentContext, useNamespaces, useNamespaceSummary, useEvents } from '../api/hooks';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Server, Box, Globe, FileText, Lock, Layers } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function NamespaceSummaryCard({ ns }: { ns: string }) {
  const { data } = useNamespaceSummary(ns);
  const navigate = useNavigate();

  if (!data) return null;

  const items = [
    { label: 'Pods', count: data.pods, icon: Box, path: '/resources/pods' },
    { label: 'Deployments', count: data.deployments, icon: Layers, path: '/resources/deployments' },
    { label: 'Services', count: data.services, icon: Globe, path: '/resources/services' },
    { label: 'ConfigMaps', count: data.configmaps, icon: FileText, path: '/resources/configmaps' },
    { label: 'Secrets', count: data.secrets, icon: Lock, path: '/resources/secrets' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold mb-3">{ns}</h3>
      <div className="grid grid-cols-5 gap-2">
        {items.map(({ label, count, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-lg font-bold">{count}</span>
            <span className="text-xs text-gray-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: current, isLoading: ctxLoading } = useCurrentContext();
  const { namespace } = useApp();
  const { data: namespaces } = useNamespaces();
  const { data: events } = useEvents(namespace || undefined, 20);

  const displayNamespaces = namespace
    ? [namespace]
    : (namespaces?.slice(0, 6) || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Cluster overview and health
        </p>
      </div>

      {/* Cluster Info */}
      {current && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="font-semibold">{current.cluster}</h2>
              <p className="text-sm text-gray-500">
                Context: {current.name} — User: {current.user} — {current.cluster_info?.git_version}
              </p>
            </div>
          </div>
        </div>
      )}

      {ctxLoading && (
        <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      )}

      {/* Namespace Summaries */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Namespace Summaries</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayNamespaces.map((ns: string) => (
            <NamespaceSummaryCard key={ns} ns={ns} />
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Events</h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {events?.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">No events</div>
          )}
          {events?.map((evt: any, i: number) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <StatusBadge status={evt.type === 'Warning' ? 'Failed' : 'Active'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {evt.reason}: {evt.involved_object?.kind}/{evt.involved_object?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{evt.message}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {evt.last_timestamp ? formatDistanceToNow(new Date(evt.last_timestamp), { addSuffix: true }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
