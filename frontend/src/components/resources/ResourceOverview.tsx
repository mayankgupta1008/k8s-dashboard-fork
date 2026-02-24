import { StatusBadge } from '../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface ResourceOverviewProps {
  resource: any;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <dt className="w-40 text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
      <dd className="text-sm flex-1 break-all">{value || '-'}</dd>
    </div>
  );
}

export function ResourceOverview({ resource }: ResourceOverviewProps) {
  const meta = resource.metadata || {};
  const creationTimestamp = meta.creationTimestamp || meta.creation_timestamp;

  return (
    <div className="space-y-4">
      <Section title="Metadata">
        <dl>
          <KeyValue label="Name" value={resource.name} />
          <KeyValue label="Namespace" value={resource.namespace || 'cluster-scoped'} />
          <KeyValue label="Kind" value={resource.kind} />
          <KeyValue
            label="Created"
            value={
              creationTimestamp
                ? `${new Date(creationTimestamp).toLocaleString()} (${formatDistanceToNow(new Date(creationTimestamp), { addSuffix: true })})`
                : '-'
            }
          />
          <KeyValue label="UID" value={meta.uid} />
        </dl>
      </Section>

      {meta.labels && Object.keys(meta.labels).length > 0 && (
        <Section title="Labels">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(meta.labels as Record<string, string>).map(([k, v]) => (
              <span key={k} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                {k}={v}
              </span>
            ))}
          </div>
        </Section>
      )}

      {meta.annotations && Object.keys(meta.annotations).length > 0 && (
        <Section title="Annotations">
          <dl>
            {Object.entries(meta.annotations as Record<string, string>).map(([k, v]) => (
              <KeyValue key={k} label={k} value={v} />
            ))}
          </dl>
        </Section>
      )}

      {resource.status && typeof resource.status === 'object' && (
        <Section title="Status">
          <dl>
            {resource.status.phase && <KeyValue label="Phase" value={<StatusBadge status={resource.status.phase} />} />}
            {resource.status.replicas !== undefined && <KeyValue label="Replicas" value={`${resource.status.readyReplicas || 0}/${resource.status.replicas}`} />}
            {resource.status.conditions && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">Conditions</p>
                <div className="space-y-1">
                  {resource.status.conditions.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${c.status === 'True' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">{c.type}</span>
                      <span className="text-gray-500">{c.message || c.reason || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </dl>
        </Section>
      )}

      {resource.spec && typeof resource.spec === 'object' && (
        <Section title="Spec">
          <pre className="text-xs overflow-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {JSON.stringify(resource.spec, null, 2)}
          </pre>
        </Section>
      )}
    </div>
  );
}
