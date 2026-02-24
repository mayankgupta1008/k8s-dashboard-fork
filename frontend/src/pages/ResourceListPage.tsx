import { useParams, useNavigate } from 'react-router-dom';
import { useResources } from '../api/hooks';
import { useApp } from '../context/AppContext';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';

const COLUMNS_BY_TYPE: Record<string, Column<any>[]> = {
  pods: [
    { key: 'name', label: 'Name' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'age', label: 'Age' },
  ],
  deployments: [
    { key: 'name', label: 'Name' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'status', label: 'Ready', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'age', label: 'Age' },
  ],
  services: [
    { key: 'name', label: 'Name' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'status', label: 'Type', render: (item) => (
      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{item.status}</span>
    )},
    { key: 'age', label: 'Age' },
  ],
};

const DEFAULT_COLUMNS: Column<any>[] = [
  { key: 'name', label: 'Name' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  { key: 'age', label: 'Age' },
];

export function ResourceListPage() {
  const { type } = useParams<{ type: string }>();
  const { namespace } = useApp();
  const { data, isLoading } = useResources(type!, namespace || undefined);
  const navigate = useNavigate();

  const columns = COLUMNS_BY_TYPE[type!] || DEFAULT_COLUMNS;

  const handleRowClick = (item: any) => {
    const ns = item.namespace || '-';
    navigate(`/resources/${type}/${ns}/${item.name}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold capitalize">{type}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data?.total ?? '...'} resources{namespace ? ` in ${namespace}` : ' across all namespaces'}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        onRowClick={handleRowClick}
        loading={isLoading}
      />
    </div>
  );
}
