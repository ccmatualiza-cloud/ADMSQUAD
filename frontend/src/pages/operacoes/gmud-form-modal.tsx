import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import {
  CHANGE_TYPE_LABELS, CHANGE_TYPE_ORDER, GMUD_COLOR, PRIORITY_LABELS, PRIORITY_ORDER,
  PROGRESSION_LABELS, PROGRESSION_ORDER, STATUS_LABELS, STATUS_ORDER, formatGmudNumber,
  type Gmud, type GmudClientOption, type GmudFields, type GmudStatus,
} from './gmud-types';

const text = (max: number) => z.string().max(max, `Máximo ${max} caracteres`);

const schema = z.object({
  client_cod: z.string(),
  project_name: z.string().trim().min(1, 'Informe o nome do projeto').max(255),
  project_ref: text(50), requester: text(150), cnpj: text(20), linx_contacts: text(255), cr: text(150),
  request_date: z.string().min(1, 'Informe a data'),
  priority: z.enum(['low', 'medium', 'high']),
  change_type: z.enum(['local_infra', 'cloud_infra', 'database', 'linx_dms', 'connectivity', 'other']),
  main_activity: z.string().trim().min(1, 'Informe a atividade principal').max(5000),
  reason: text(5000), expected_result: text(5000), estimated_time: text(255),
  additional_factors: text(5000), estimated_costs: text(255),
  release_notes: text(5000), update_process: text(5000), prerequisites: text(5000),
  impact_client_benefit: text(500), impact_client_risk: text(500),
  impact_ccm_benefit: text(500), impact_ccm_risk: text(500),
  impact_linx_benefit: text(500), impact_linx_risk: text(500),
  impact_other_benefit: text(500), impact_other_risk: text(500),
  notes: text(5000),
  progression: z.enum(['sequential', 'parallel', 'partial']),
  progression_detail: text(255), validation_1: text(255), validation_2: text(255), rollback_plan: text(5000),
  approver_client: text(150), approver_linx: text(150), approver_ccm: text(150),
  status: z.enum(['open', 'paused', 'cancelled', 'completed']),
});
type FormData = z.infer<typeof schema>;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY: FormData = {
  client_cod: '', project_name: '', project_ref: '', requester: 'SUSTENTAÇÃO CCM', cnpj: '', linx_contacts: '', cr: '',
  request_date: today(), priority: 'medium', change_type: 'cloud_infra', main_activity: '',
  reason: '', expected_result: '', estimated_time: '', additional_factors: '', estimated_costs: '',
  release_notes: '', update_process: '', prerequisites: '',
  impact_client_benefit: '', impact_client_risk: '', impact_ccm_benefit: '', impact_ccm_risk: '',
  impact_linx_benefit: '', impact_linx_risk: '', impact_other_benefit: '', impact_other_risk: '',
  notes: '', progression: 'sequential', progression_detail: '', validation_1: '', validation_2: '', rollback_plan: '',
  approver_client: '', approver_linx: '', approver_ccm: '', status: 'open',
};

function toForm(g: Gmud): FormData {
  const out = { ...EMPTY } as Record<string, string>;
  for (const key of Object.keys(EMPTY)) {
    const value = (g as unknown as Record<string, unknown>)[key];
    out[key] = value === null || value === undefined ? '' : String(value);
  }
  out.request_date = g.request_date.slice(0, 10);
  return out as FormData;
}

function toPayload(data: FormData): GmudFields & { status: GmudStatus } {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    payload[key] = typeof value === 'string' && value.trim() === '' ? null : value;
  }
  payload.client_cod = data.client_cod ? Number(data.client_cod) : null;
  if (data.progression !== 'partial') payload.progression_detail = null;
  return payload as unknown as GmudFields & { status: GmudStatus };
}

const inputStyle: CSSProperties = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle: CSSProperties = { color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' };
const errorStyle: CSSProperties = { color: '#FF8A80', fontSize: 11, marginTop: 3 };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ color: GMUD_COLOR, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', borderBottom: '1px solid #1a3a6e', paddingBottom: 6, marginBottom: 12 }}>
        GMUD | {title}
      </div>
      <div className="row g-3">{children}</div>
    </div>
  );
}

interface Props {
  gmud: Gmud | null;
  onClose: () => void;
  onSaved: (saved: Gmud) => void;
}

export default function GmudFormModal({ gmud, onClose, onSaved }: Props) {
  const [clients, setClients] = useState<GmudClientOption[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = gmud !== null;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: gmud ? toForm(gmud) : EMPTY,
  });

  useEffect(() => {
    http.get<GmudClientOption[]>('/api/gmud/clients').then(setClients).catch(() => toast.error('Erro ao carregar clientes'));
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsers([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const onClientChange = (cod: string) => {
    setValue('client_cod', cod);
    const client = clients.find(c => String(c.cod) === cod);
    if (!client) return;
    setValue('project_name', client.razao || client.cliente || '', { shouldValidate: true });
    setValue('cnpj', client.cnpj || '');
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = toPayload(data);
      const saved = isEdit
        ? await http.put<Gmud>(`/api/gmud/${gmud.id}`, payload)
        : await http.post<Gmud>('/api/gmud/', payload);
      toast.success(isEdit ? 'GMUD atualizada!' : `GMUD ${formatGmudNumber(saved.number)} registrada!`);
      onSaved(saved);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar GMUD');
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof FormData, label: string, opts: { col?: string; rows?: number; placeholder?: string; type?: string; list?: string } = {}) => (
    <div className={opts.col ?? 'col-12'}>
      <label style={labelStyle}>{label}</label>
      {opts.rows
        ? <textarea className="form-control mt-1" style={inputStyle} rows={opts.rows} placeholder={opts.placeholder} {...register(name)} />
        : <input type={opts.type ?? 'text'} className="form-control mt-1" style={inputStyle} placeholder={opts.placeholder} list={opts.list} {...register(name)} />}
      {errors[name] && <div style={errorStyle}>{errors[name]?.message}</div>}
    </div>
  );

  const progression = watch('progression');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <form onSubmit={handleSubmit(onSubmit)}
        style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: `3px solid ${GMUD_COLOR}`, borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 980, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: GMUD_COLOR, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações | Gestão de Mudanças</div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
              {isEdit ? `Editar GMUD ${formatGmudNumber(gmud.number)}` : 'Nova GMUD'}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Identificação">
          <div className="col-12 col-md-6">
            <label style={labelStyle}>Cliente (cadastro)</label>
            <select className="form-select mt-1" style={inputStyle} value={watch('client_cod')} onChange={e => onClientChange(e.target.value)}>
              <option value="">Selecione o cliente...</option>
              {clients.map(c => <option key={c.cod} value={c.cod}>{c.razao || c.cliente || `#${c.cod}`}</option>)}
            </select>
          </div>
          {field('project_name', 'Nome do projeto *', { col: 'col-12 col-md-6' })}
          {field('requester', 'Solicitante', { col: 'col-12 col-md-4' })}
          {field('cnpj', 'CNPJ', { col: 'col-12 col-md-4' })}
          {field('project_ref', 'ID. Projeto', { col: 'col-6 col-md-2' })}
          {field('request_date', 'Data *', { col: 'col-6 col-md-2', type: 'date' })}
          {field('linx_contacts', 'Contatos Linx', { col: 'col-12 col-md-6' })}
          {field('cr', 'C.R.', { col: 'col-12 col-md-6' })}
          <div className="col-12 col-md-4">
            <label style={labelStyle}>Prioridade *</label>
            <select className="form-select mt-1" style={inputStyle} {...register('priority')}>
              {PRIORITY_ORDER.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label style={labelStyle}>Natureza da alteração *</label>
            <select className="form-select mt-1" style={inputStyle} {...register('change_type')}>
              {CHANGE_TYPE_ORDER.map(c => <option key={c} value={c}>{CHANGE_TYPE_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label style={labelStyle}>Status</label>
            <select className="form-select mt-1" style={inputStyle} {...register('status')}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Detalhamento">
          {field('main_activity', 'Atividade principal *', { rows: 2 })}
          {field('reason', 'Por que essa alteração é necessária?', { col: 'col-12 col-md-6', rows: 2 })}
          {field('expected_result', 'Qual o resultado pretendido?', { col: 'col-12 col-md-6', rows: 2 })}
          {field('estimated_time', 'Tempos estimados para atividades', { col: 'col-12 col-md-6', placeholder: 'Ex.: Previsão, duas (2) horas' })}
          {field('estimated_costs', 'Custos estimados', { col: 'col-12 col-md-6' })}
          {field('additional_factors', 'Fatores adicionais', { rows: 2 })}
        </Section>

        <Section title="Referências técnicas">
          {field('release_notes', 'Notas de atualização', { col: 'col-12 col-md-4', rows: 2 })}
          {field('update_process', 'Processo de atualização', { col: 'col-12 col-md-4', rows: 2 })}
          {field('prerequisites', 'Pré-requisitos', { col: 'col-12 col-md-4', rows: 2, placeholder: 'Ex.: Janela disponível pela CCM e Cliente' })}
        </Section>

        <Section title="Impacto nas operações">
          {field('impact_client_benefit', 'Cliente — benefícios potenciais', { col: 'col-12 col-md-6' })}
          {field('impact_client_risk', 'Cliente — potenciais efeitos adversos', { col: 'col-12 col-md-6' })}
          {field('impact_ccm_benefit', 'CCM — benefícios potenciais', { col: 'col-12 col-md-6' })}
          {field('impact_ccm_risk', 'CCM — potenciais efeitos adversos', { col: 'col-12 col-md-6' })}
          {field('impact_linx_benefit', 'Linx — benefícios potenciais', { col: 'col-12 col-md-6' })}
          {field('impact_linx_risk', 'Linx — potenciais efeitos adversos', { col: 'col-12 col-md-6' })}
          {field('impact_other_benefit', 'Outros — benefícios potenciais', { col: 'col-12 col-md-6' })}
          {field('impact_other_risk', 'Outros — potenciais efeitos adversos', { col: 'col-12 col-md-6' })}
        </Section>

        <Section title="Observações importantes">
          {field('notes', 'Observações (saem em destaque no PDF)', { rows: 2 })}
        </Section>

        <Section title="Informações complementares">
          <div className="col-12 col-md-4">
            <label style={labelStyle}>Progressão da atividade</label>
            <select className="form-select mt-1" style={inputStyle} {...register('progression')}>
              {PROGRESSION_ORDER.map(p => <option key={p} value={p}>{PROGRESSION_LABELS[p]}</option>)}
            </select>
          </div>
          {progression === 'partial' && field('progression_detail', 'Detalhe da progressão parcial', { col: 'col-12 col-md-8' })}
          {field('validation_1', '1ª validação da atividade', { col: 'col-12 col-md-6', placeholder: 'Ex.: Validação CCM' })}
          {field('validation_2', '2ª validação da atividade', { col: 'col-12 col-md-6', placeholder: 'Ex.: Validação cliente' })}
          {field('rollback_plan', 'Rollback', { rows: 2 })}
        </Section>

        <Section title="Aprovação">
          {field('approver_client', 'Cliente', { col: 'col-12 col-md-4' })}
          {field('approver_linx', 'Linx', { col: 'col-12 col-md-4' })}
          {field('approver_ccm', 'CCM', { col: 'col-12 col-md-4', list: 'gmud-users' })}
          <datalist id="gmud-users">{users.map(u => <option key={u.id} value={u.name} />)}</datalist>
        </Section>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-sm" style={{ background: GMUD_COLOR, color: '#0C1921', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{isEdit ? 'Salvar' : 'Registrar'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
