export interface BibliometricOverview {
  total_documents: number;
  timespan: string;
  unique_authors: number;
  unique_sources: number;
  unique_keywords: number;
  total_citations: number;
  avg_citations_per_doc: number;
  authors_per_doc: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  frequency: number;
  cluster: number;
  cluster_label: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  cooccurrences: number;
  weight: number;
}

export interface NetworkResponse {
  network_type: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  total_nodes: number;
  total_edges: number;
  cluster_count: number;
}

export interface ThematicCluster {
  cluster_id: number;
  name: string;
  keywords: string[];
  size: number;
  centrality: number;
  density: number;
  quadrant:
    | "Motor Themes"
    | "Niche Themes"
    | "Emerging or Declining"
    | "Basic & Transversal";
}

export interface ThematicMapResponse {
  clusters: ThematicCluster[];
  median_centrality: number;
  median_density: number;
  tikz_code?: string;
}

export interface SankeyNode {
  id: string;
  name: string;
  period: string;
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  inclusion_index: number;
}

export interface ThematicEvolutionResponse {
  time_slices: string[];
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface BradfordPoint {
  rank: number;
  ln_rank: number;
  source: string;
  articles: number;
  cum_articles: number;
}

export interface BradfordZone {
  name: string;
  source_count: number;
  article_count: number;
}

export interface BradfordData {
  total_sources: number;
  total_articles: number;
  zone1: BradfordZone;
  zone2: BradfordZone;
  zone3: BradfordZone;
  bradford_multiplier: number;
  zone1_cutoff_ln_rank?: number;
  zone2_cutoff_ln_rank?: number;
  curve: BradfordPoint[];
}

export interface LotkaPoint {
  papers: number;
  observed_authors: number;
  expected_authors: number;
  empirical_freq: number;
  theoretical_freq: number;
}

export interface LotkaData {
  total_authors: number;
  n_exponent: number;
  c_constant: number;
  ks_statistic: number;
  ks_critical_value: number;
  is_fit: boolean;
  plot: LotkaPoint[];
}

export interface BibliometricLawsResponse {
  bradford: BradfordData;
  lotka: LotkaData;
  bradford_tikz?: string;
}
