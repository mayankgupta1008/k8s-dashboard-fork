import { useParams, useNavigate } from 'react-router-dom';
import { useResource, useResourceYaml, useResourceEvents, usePodContainers } from '../api/hooks';
import { useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import { ResourceOverview } from '../components/resources/ResourceOverview';
import { YamlViewer } from '../components/resources/YamlViewer';
import { EventsTable } from '../components/resources/EventsTable';
import { LogViewer } from '../components/logs/LogViewer';

type Tab = 'overview' | 'yaml' | 'events' | 'logs';

export function ResourceDetailPage() {
  const { type, namespace, name } = useParams<{ type: string; namespace: string; name: string }>();
  const ns = namespace === '-' ? undefined : namespace;
  const [tab, setTab] = useState<Tab>('overview');
  const [reveal, setReveal] = useState(false);
  const navigate = useNavigate();

  const { data: resource, isLoading } = useResource(type!, name!, ns, reveal);
  const { data: yaml } = useResourceYaml(type!, name!, ns);
  const { data: events } = useResourceEvents(type!, name!, ns);
  const { data: containers } = usePodContainers(ns || '', name!);

  const isPod = type === 'pods';
  const isSecret = type === 'secrets';
  const tabs: Tab[] = isPod ? ['overview', 'yaml', 'events', 'logs'] : ['overview', 'yaml', 'events'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/resources/${type}`)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {type} {ns && `in ${ns}`}
          </p>
        </div>
        {isSecret && (
          <button
            onClick={() => setReveal(!reveal)}
            className="ml-auto px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
          >
            {reveal ? 'Hide Values' : 'Reveal Values'}
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && resource && <ResourceOverview resource={resource} />}
        {tab === 'yaml' && <YamlViewer yaml={yaml || ''} />}
        {tab === 'events' && <EventsTable events={events || []} />}
        {tab === 'logs' && isPod && ns && (
          <LogViewer namespace={ns} podName={name!} containers={containers || []} />
        )}
      </div>
    </div>
  );
}
