import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useContexts() {
  return useQuery({ queryKey: ['contexts'], queryFn: api.listContexts });
}

export function useCurrentContext() {
  return useQuery({ queryKey: ['currentContext'], queryFn: api.getCurrentContext });
}

export function useSwitchContext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.switchContext,
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useNamespaces() {
  return useQuery({ queryKey: ['namespaces'], queryFn: api.listNamespaces });
}

export function useNamespaceSummary(ns: string) {
  return useQuery({
    queryKey: ['namespaceSummary', ns],
    queryFn: () => api.getNamespaceSummary(ns),
    enabled: !!ns,
  });
}

export function useResources(type: string, namespace?: string, labelSelector?: string) {
  return useQuery({
    queryKey: ['resources', type, namespace, labelSelector],
    queryFn: () => api.listResources(type, namespace, labelSelector),
    enabled: !!type,
  });
}

export function useResource(type: string, name: string, namespace?: string, reveal?: boolean) {
  return useQuery({
    queryKey: ['resource', type, name, namespace, reveal],
    queryFn: () => api.getResource(type, name, namespace, reveal),
    enabled: !!type && !!name,
  });
}

export function useResourceYaml(type: string, name: string, namespace?: string) {
  return useQuery({
    queryKey: ['resourceYaml', type, name, namespace],
    queryFn: () => api.getResourceYaml(type, name, namespace),
    enabled: !!type && !!name,
  });
}

export function useResourceEvents(type: string, name: string, namespace?: string) {
  return useQuery({
    queryKey: ['resourceEvents', type, name, namespace],
    queryFn: () => api.getResourceEvents(type, name, namespace),
    enabled: !!type && !!name,
  });
}

export function useResourceTypes() {
  return useQuery({ queryKey: ['resourceTypes'], queryFn: api.getResourceTypes });
}

export function usePodLogs(ns: string, name: string, container?: string, tailLines?: number) {
  return useQuery({
    queryKey: ['podLogs', ns, name, container, tailLines],
    queryFn: () => api.getPodLogs(ns, name, container, tailLines),
    enabled: !!ns && !!name,
    refetchOnWindowFocus: false,
  });
}

export function usePodContainers(ns: string, name: string) {
  return useQuery({
    queryKey: ['podContainers', ns, name],
    queryFn: () => api.getPodContainers(ns, name),
    enabled: !!ns && !!name,
  });
}

export function useEvents(namespace?: string, limit?: number) {
  return useQuery({
    queryKey: ['events', namespace, limit],
    queryFn: () => api.listEvents(namespace, limit),
  });
}

export function useResourceGraph(namespace?: string) {
  return useQuery({
    queryKey: ['resourceGraph', namespace],
    queryFn: () => api.getResourceGraph(namespace),
  });
}

export function useSearch(q: string, namespace?: string, kinds?: string[]) {
  return useQuery({
    queryKey: ['search', q, namespace, kinds],
    queryFn: () => api.search(q, namespace, kinds),
    enabled: q.length >= 2,
  });
}
