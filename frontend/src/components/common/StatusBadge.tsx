import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  Running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Succeeded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Bound: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ContainerCreating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Terminating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CrashLoopBackOff: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ImagePullBackOff: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const color = STATUS_COLORS[status] || STATUS_COLORS.Unknown;
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      {status}
    </span>
  );
}
