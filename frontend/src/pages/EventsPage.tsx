import { useEvents } from '../api/hooks';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, type Column } from '../components/common/DataTable';
import { formatDistanceToNow } from 'date-fns';

const columns: Column<any>[] = [
  {
    key: 'type',
    label: 'Type',
    render: (item) => <StatusBadge status={item.type === 'Warning' ? 'Failed' : 'Active'} />,
  },
  { key: 'reason', label: 'Reason' },
  {
    key: 'object',
    label: 'Object',
    render: (item) => `${item.involved_object?.kind}/${item.involved_object?.name}`,
  },
  {
    key: 'message',
    label: 'Message',
    className: 'max-w-md truncate',
  },
  { key: 'count', label: 'Count' },
  {
    key: 'last_timestamp',
    label: 'Last Seen',
    render: (item) =>
      item.last_timestamp
        ? formatDistanceToNow(new Date(item.last_timestamp), { addSuffix: true })
        : '-',
  },
];

export function EventsPage() {
  const { namespace } = useApp();
  const { data: events, isLoading } = useEvents(namespace || undefined, 200);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Cluster events{namespace ? ` in ${namespace}` : ''}
        </p>
      </div>
      <DataTable columns={columns} data={events || []} loading={isLoading} />
    </div>
  );
}
