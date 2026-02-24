const BASE_URL = '/api';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Contexts
  listContexts: () => fetchJSON<any[]>('/contexts/'),
  getCurrentContext: () => fetchJSON<any>('/contexts/current'),
  switchContext: (name: string) =>
    fetchJSON<any>('/contexts/switch', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Namespaces
  listNamespaces: () => fetchJSON<string[]>('/namespaces/'),
  getNamespaceSummary: (ns: string) => fetchJSON<any>(`/namespaces/${ns}/summary`),

  // Resources
  listResources: (type: string, namespace?: string, labelSelector?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    if (labelSelector) params.set('label_selector', labelSelector);
    return fetchJSON<any>(`/resources/${type}?${params}`);
  },
  getResource: (type: string, name: string, namespace?: string, reveal?: boolean) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    if (reveal) params.set('reveal', 'true');
    return fetchJSON<any>(`/resources/${type}/${name}?${params}`);
  },
  getResourceYaml: (type: string, name: string, namespace?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    return fetchJSON<string>(`/resources/${type}/${name}/yaml?${params}`);
  },
  getResourceEvents: (type: string, name: string, namespace?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    return fetchJSON<any[]>(`/resources/${type}/${name}/events?${params}`);
  },
  getResourceTypes: () => fetchJSON<any[]>('/resource-types'),

  // Pods
  getPodLogs: (ns: string, name: string, container?: string, tailLines?: number) => {
    const params = new URLSearchParams();
    if (container) params.set('container', container);
    if (tailLines) params.set('tail_lines', String(tailLines));
    return fetchJSON<string>(`/pods/${ns}/${name}/logs?${params}`);
  },
  getPodContainers: (ns: string, name: string) =>
    fetchJSON<any[]>(`/pods/${ns}/${name}/containers`),

  // Events
  listEvents: (namespace?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    if (limit) params.set('limit', String(limit));
    return fetchJSON<any[]>(`/events?${params}`);
  },

  // Visualizer
  getResourceGraph: (namespace?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    return fetchJSON<any>(`/visualizer/graph?${params}`);
  },

  // Search
  search: (q: string, namespace?: string, kinds?: string[]) => {
    const params = new URLSearchParams({ q });
    if (namespace) params.set('namespace', namespace);
    if (kinds) kinds.forEach(k => params.append('kinds', k));
    return fetchJSON<any[]>(`/search?${params}`);
  },
};
