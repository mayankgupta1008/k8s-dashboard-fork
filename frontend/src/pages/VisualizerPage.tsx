import { useResourceGraph } from '../api/hooks';
import { useApp } from '../context/AppContext';
import { VisualizerGraph } from '../components/visualizer/VisualizerGraph';

export function VisualizerPage() {
  const { namespace } = useApp();
  const { data: graph, isLoading } = useResourceGraph(namespace || undefined);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Cluster Visualizer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resource relationships{namespace ? ` in ${namespace}` : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <VisualizerGraph graph={graph} />
      )}
    </div>
  );
}
