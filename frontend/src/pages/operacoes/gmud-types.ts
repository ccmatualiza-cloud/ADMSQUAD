export type GmudStatus = 'open' | 'paused' | 'cancelled' | 'completed';
export type GmudPriority = 'low' | 'medium' | 'high';
export type GmudChangeType = 'local_infra' | 'cloud_infra' | 'database' | 'linx_dms' | 'connectivity' | 'other';
export type GmudProgression = 'sequential' | 'parallel' | 'partial';

export interface GmudFields {
  client_cod: number | null;
  project_name: string;
  project_ref: string | null;
  requester: string | null;
  cnpj: string | null;
  linx_contacts: string | null;
  cr: string | null;
  request_date: string;
  priority: GmudPriority;
  change_type: GmudChangeType;
  main_activity: string;
  reason: string | null;
  expected_result: string | null;
  estimated_time: string | null;
  additional_factors: string | null;
  estimated_costs: string | null;
  release_notes: string | null;
  update_process: string | null;
  prerequisites: string | null;
  impact_client_benefit: string | null;
  impact_client_risk: string | null;
  impact_ccm_benefit: string | null;
  impact_ccm_risk: string | null;
  impact_linx_benefit: string | null;
  impact_linx_risk: string | null;
  impact_other_benefit: string | null;
  impact_other_risk: string | null;
  notes: string | null;
  progression: GmudProgression;
  progression_detail: string | null;
  validation_1: string | null;
  validation_2: string | null;
  rollback_plan: string | null;
  approver_client: string | null;
  approver_linx: string | null;
  approver_ccm: string | null;
}

export interface Gmud extends GmudFields {
  id: number;
  number: number;
  status: GmudStatus;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GmudListItem {
  id: number;
  number: number;
  project_name: string;
  requester: string | null;
  request_date: string;
  priority: GmudPriority;
  change_type: GmudChangeType;
  status: GmudStatus;
  created_at: string | null;
}

export interface GmudClientOption { cod: number; razao: string | null; cliente: string | null; cnpj: string | null; }

export const GMUD_COLOR = '#00C8B4';

export const STATUS_LABELS: Record<GmudStatus, string> = {
  open: 'Aberto', paused: 'Pausado', cancelled: 'Cancelado', completed: 'Concluído',
};
export const STATUS_STYLE: Record<GmudStatus, { bg: string; color: string; accent: string }> = {
  open:      { bg: '#E8EDF7', color: '#204294', accent: '#00B0FA' },
  paused:    { bg: '#FFF8CC', color: '#8A6800', accent: '#F9A825' },
  cancelled: { bg: '#FDDEDE', color: '#9B2020', accent: '#E74C3C' },
  completed: { bg: '#D4F5E2', color: '#0E7E3B', accent: '#1DB954' },
};
export const STATUS_ORDER: GmudStatus[] = ['open', 'paused', 'cancelled', 'completed'];

export const PRIORITY_LABELS: Record<GmudPriority, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto' };
export const PRIORITY_COLOR: Record<GmudPriority, string> = { low: '#1DB954', medium: '#F9A825', high: '#E74C3C' };
export const PRIORITY_ORDER: GmudPriority[] = ['low', 'medium', 'high'];

export const CHANGE_TYPE_LABELS: Record<GmudChangeType, string> = {
  local_infra: 'Infra Local', cloud_infra: 'Infra Cloud', database: 'Banco de Dados',
  linx_dms: 'Linx DMS', connectivity: 'Conectividade', other: 'Outros',
};
export const CHANGE_TYPE_ORDER: GmudChangeType[] = ['local_infra', 'cloud_infra', 'database', 'linx_dms', 'connectivity', 'other'];

export const PROGRESSION_LABELS: Record<GmudProgression, string> = { sequential: 'Sequencial', parallel: 'Paralela', partial: 'Parcial' };
export const PROGRESSION_ORDER: GmudProgression[] = ['sequential', 'parallel', 'partial'];

export const formatGmudNumber = (n: number) => String(n).padStart(4, '0');

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' without timezone shifts. */
export const formatDateBr = (iso: string | null | undefined) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
