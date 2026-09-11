import { useEffect, useState } from 'react';
import ParametrosIntegrarPage from './parametros-integrar-page';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface IntegracaoOpt { cod: number; integracao: string | null; }
interface ClienteLinxOpt { cod: number; razao: string | null; }

interface Integracao {
  cod: number; cliente: string | null; integrar: string | null;
  ticket: string | null; data: string | null;
  responsavel: string | null; status: string | null; cont: number | null;
}

const STATUS_OPTS = ['Aberto','Em Andamento','Concluido','Cancelado'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Aberto':       { bg: '#E8EDF7', color: '#204294' },
  'Em Andamento': { bg: '#FFF8CC', color: '#8A6800' },
  'Concluido':    { bg: '#D4F5E2', color: '#0E7E3B' },
  'Cancelado':    { bg: '#FDDEDE', color: '#9B2020' },
};

const emptyForm = { cliente: '', integrar: '', ticket: '', data: '', responsavel: '', status: 'Aberto' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function IntegracoesPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Integracao[]>([]);
  const [usuarios, setUsuarios]   = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [integracaoOpts, setIntegracaoOpts] = useState<IntegracaoOpt[]>([]);
  const [clienteOpts, setClienteOpts]         = useState<ClienteLinxOpt[]>([]);
  const [showParametros, setShowParametros] = useState(false);

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await http.get<Integracao[]>(`/api/operacoes/integracoes${params}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar integrações'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    http.get<IntegracaoOpt[]>('/api/operacoes/parametros-integrar')
      .then(d => setIntegracaoOpts([...d].sort((a, b) => (a.integracao || '').localeCompare(b.integracao || ''))))
      .catch(() => {});
    http.get<ClienteLinxOpt[]>('/api/cx/clientes')
      .then(d => setClienteOpts([...d].sort((a, b) => (a.razao || '').localeCompare(b.razao || ''))))
      .catch(() => {});
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsuarios([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (i: Integracao) => {
    setEditCod(i.cod);
    setForm({ cliente: i.cliente ?? '', integrar: i.integrar ?? '',
              ticket: i.ticket ?? '', data: i.data ?? '',
              responsavel: i.responsavel ?? '', status: i.status ?? 'Aberto' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente) { toast.error('Cliente é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/operacoes/integracoes/${editCod}`, form);
        toast.success('Integração atualizada!');
      } else {
        await http.post('/api/operacoes/integracoes', form);
        toast.success('Integração registrada!');
      }
      setShowModal(false); fetchData(search);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir esta integração?')) return;
    try { await http.del(`/api/operacoes/integracoes/${cod}`); toast.success('Excluída'); fetchData(search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  if (showParametros) return <ParametrosIntegrarPage onBack={() => setShowParametros(false)} />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Integrações</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Integrações de Clientes</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-plugin" style={{ color: '#7F77DD', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} integração(ões)`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: '#F9A825', color: '#5a4000', fontWeight: 700, fontSize: 12 }} onClick={() => setShowParametros(true)}>
              <i className="bi bi-sliders me-1" />Parâmetros
            </button>
            <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />Nova Integração
            </button>
          </div>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar por cliente, integração, responsável, ticket..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 360, fontSize: 13 }} />
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData(search)}>
            <i className="bi bi-search me-1" />Buscar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Cliente</th>
                  <th style={th}>Integração</th>
                  <th style={th}>Ticket</th>
                  <th style={th}>Data</th>
                  <th style={th}>Responsável</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma integração encontrada</td></tr>
                ) : filtered.map((item, i) => {
                  const si = STATUS_COLORS[item.status ?? ''] ?? { bg: '#eee', color: '#444' };
                  return (
                    <tr key={item.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.cliente || '—'}</td>
                      <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.integrar || '—'}</td>
                      <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{item.ticket || '—'}</td>
                      <td style={td}>{item.data || '—'}</td>
                      <td style={td}>{item.responsavel || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{item.status || '—'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(item)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(item.cod)}>
                            <i className="bi bi-trash me-1" />Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #7F77DD', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#7F77DD', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações — Integrações</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Integração' : 'Nova Integração'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Cliente *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}>
                  <option value="">Selecione o cliente...</option>
                  {clienteOpts.map(c => (
                    <option key={c.cod} value={c.razao || ''}>{c.razao || '—'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Integração</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.integrar} onChange={e => setForm(f => ({ ...f, integrar: e.target.value }))}>
                  <option value="">Selecione a integração...</option>
                  {integracaoOpts.map(o => (
                    <option key={o.cod} value={o.integracao || ''}>{o.integracao || '—'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticket} onChange={e => setForm(f => ({ ...f, ticket: e.target.value }))} placeholder="Nº do ticket" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Data</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} placeholder="dd/mm/aaaa" maxLength={10} />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Responsável</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
