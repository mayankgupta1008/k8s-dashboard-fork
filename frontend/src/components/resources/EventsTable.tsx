import { StatusBadge } from '../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface EventsTableProps {
  events: any[];
}

export function EventsTable({ events }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500">
        No events found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((evt, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <StatusBadge status={evt.type === 'Warning' ? 'Failed' : 'Active'} />
              </td>
              <td className="px-4 py-3 font-medium">{evt.reason}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-md truncate">{evt.message}</td>
              <td className="px-4 py-3">{evt.count}</td>
              <td className="px-4 py-3 text-gray-500">
                {evt.last_timestamp
                  ? formatDistanceToNow(new Date(evt.last_timestamp), { addSuffix: true })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
