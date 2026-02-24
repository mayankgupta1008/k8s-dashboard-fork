import { Handle, Position, type NodeProps } from '@xyflow/react';

interface K8sNodeData {
  label: string;
  kind: string;
  status: string | null;
  namespace: string | null;
  color: string;
  [key: string]: unknown;
}

export function K8sNode({ data }: NodeProps) {
  const { label, kind, status, color } = data as unknown as K8sNodeData;

  return (
    <div
      className="px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-900 shadow-sm min-w-[160px]"
      style={{ borderColor: color as string }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color as string }} />
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-gray-400 uppercase">{kind as string}</p>
          <p className="text-xs font-semibold truncate">{label as string}</p>
        </div>
      </div>
      {status && (
        <p className="text-[9px] mt-1 text-gray-500">{status as string}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}
