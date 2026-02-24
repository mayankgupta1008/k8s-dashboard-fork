export interface K8sContext {
  name: string;
  cluster: string;
  user: string;
  namespace: string;
  active: boolean;
}

export interface CurrentContext extends Omit<K8sContext, 'active'> {
  cluster_info: ClusterInfo;
}

export interface ClusterInfo {
  version: string;
  platform: string;
  git_version: string;
}

export interface ResourceItem {
  name: string;
  namespace: string | null;
  kind: string;
  status: string | null;
  age: string | null;
  labels: Record<string, string> | null;
  annotations: Record<string, string> | null;
  raw: Record<string, unknown> | null;
}

export interface ResourceList {
  kind: string;
  items: ResourceItem[];
  total: number;
}

export interface ResourceDetail {
  name: string;
  namespace: string | null;
  kind: string;
  metadata: Record<string, unknown>;
  spec: Record<string, unknown> | null;
  status: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

export interface NamespaceSummary {
  namespace: string;
  pods: number;
  deployments: number;
  services: number;
  configmaps: number;
  secrets: number;
}

export interface GraphNode {
  id: string;
  kind: string;
  name: string;
  namespace: string | null;
  status: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface ResourceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface K8sEvent {
  name: string;
  namespace: string;
  kind: string;
  type: string;
  reason: string;
  message: string;
  source: string;
  first_timestamp: string | null;
  last_timestamp: string | null;
  count: number;
  involved_object: {
    kind: string;
    name: string;
    namespace: string;
  };
}

export interface ContainerInfo {
  name: string;
  image: string;
  ready: boolean;
  restart_count: number;
  state: string;
}

export type ResourceType =
  | 'pods' | 'deployments' | 'statefulsets' | 'daemonsets' | 'replicasets'
  | 'jobs' | 'cronjobs' | 'services' | 'ingresses' | 'endpoints'
  | 'networkpolicies' | 'configmaps' | 'secrets' | 'serviceaccounts'
  | 'pvs' | 'pvcs' | 'storageclasses'
  | 'roles' | 'rolebindings' | 'clusterroles' | 'clusterrolebindings'
  | 'events';

export interface ResourceTypeInfo {
  name: string;
  kind: string;
  api_group: string;
  namespaced: boolean;
  category: string;
}

export const RESOURCE_CATEGORIES: Record<string, ResourceType[]> = {
  'Workloads': ['pods', 'deployments', 'statefulsets', 'daemonsets', 'replicasets', 'jobs', 'cronjobs'],
  'Networking': ['services', 'ingresses', 'endpoints', 'networkpolicies'],
  'Config & Storage': ['configmaps', 'secrets', 'pvs', 'pvcs', 'storageclasses'],
  'Access Control': ['serviceaccounts', 'roles', 'rolebindings', 'clusterroles', 'clusterrolebindings'],
};
