import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import { useAuthStore } from '../../store/auth-store';

interface Atividade {
  cod: number; cliente: string; analista: string;
  ticketproj: string; atividade: string; tipoatividade: string; data: string;
  horainicio: string | null; horafim: string | null;
  duracao: string | null; status: string;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  'Nao Iniciado': { label: 'Não Iniciado', color: '#444',    bg: '#F0F0F0' },
  'Em Andamento': { label: 'Em Andamento', color: '#8A6800', bg: '#FFF8CC' },
  'Concluido':    { label: 'Concluído',    color: '#0E7E3B', bg: '#D4F5E2' },
  'Cancelado':    { label: 'Cancelado',    color: '#9B2020', bg: '#FDDEDE' },
};

const ATIVIDADE_OPTS = ['Incidente', 'Requisição', 'Implantação', 'Migração', 'Manutenção'];
const emptyForm = { cliente: '', analista: '', ticketproj: '', atividade: 'Incidente', tipoatividade: '', data: new Date().toISOString().split('T')[0] };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function MonitorAtividades({ onBack }: { onBack: () => void }) {
  const user = useAuthStore(s => s.user);
  const [items, setItems]         = useState<Atividade[]>([]);
  const [analistas, setAnalistas] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [timeModal, setTimeModal] = useState<{ cod: number; action: 'iniciar' | 'terminar' } | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterAtividade, setFilterAtividade] = useState('');
  const [filterAnalista, setFilterAnalista] = useState('');
  const [filterData, setFilterData]       = useState('');
  const [clienteSugs, setClienteSugs]     = useState<string[]>([]);
  const [showSugs, setShowSugs]           = useState(false);
  const clienteRef                        = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCliente)   params.set('q_cliente', filterCliente);
      if (filterAnalista)  params.set('q_analista', filterAnalista);
      if (filterData)      params.set('q_data', filterData);
      if (filterAtividade) params.set('q_atividade', filterAtividade);
      const [data, anal] = await Promise.all([
        http.get<Atividade[]>(`/api/operacoes/atividades?${params}`),
        http.get<{ id: number; name: string }[]>('/api/pendencias/analistas'),
      ]);
      setItems(data);
      setAnalistas(anal);
    } catch { toast.error('Erro ao carregar atividades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowSugs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleClienteSearch = async (val: string) => {
    setForm(f => ({ ...f, cliente: val }));
    if (val.length >= 2) {
      try {
        const s = await http.get<string[]>(`/api/pendencias/clientes-autocomplete?q=${encodeURIComponent(val)}`);
        setClienteSugs(s); setShowSugs(s.length > 0);
      } catch { setClienteSugs([]); }
    } else { setClienteSugs([]); setShowSugs(false); }
  };

  const handleSave = async () => {
    if (!form.cliente || !form.analista || !form.atividade || !form.tipoatividade || !form.data) {
      toast.error('Preencha todos os campos'); return;
    }
    setSaving(true);
    try {
      await http.post('/api/operacoes/atividades', form);
      toast.success('Atividade registrada!');
      setShowModal(false); setForm(emptyForm);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleAction = (cod: number, action: 'iniciar' | 'terminar' | 'cancelar') => {
    if (action === 'cancelar') {
      http.put(`/api/operacoes/atividades/${cod}/cancelar`, {})
        .then(() => { toast.success('Atividade cancelada!'); fetchData(); })
        .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Erro'));
    } else {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeInput(`${hh}:${mm}`);
      setTimeModal({ cod, action });
    }
  };

  const handleTimeConfirm = async () => {
    if (!timeModal) return;
    if (!/^\d{2}:\d{2}$/.test(timeInput)) { toast.error('Horário inválido. Use o formato hh:mm'); return; }
    try {
      await http.put(`/api/operacoes/atividades/${timeModal.cod}/${timeModal.action}`, { horario: timeInput });
      const msgs = { iniciar: 'Atividade iniciada!', terminar: 'Atividade concluída!' };
      toast.success(msgs[timeModal.action]);
      setTimeModal(null);
      fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
  };

  const isOwner = (analista: string) => user?.name?.toUpperCase() === analista?.toUpperCase();

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 10px', textAlign: 'left' as const, fontSize: 9, whiteSpace: 'nowrap' as const };
  const td = { padding: '8px 10px', fontSize: 11, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Monitor de Atividades</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Monitor de Atividades</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-activity" style={{ color: '#7F77DD', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>{filtered.length} atividade(s)</span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1" />Nova Atividade
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Cliente..." value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)} style={{ maxWidth: 180, fontSize: 12 }} />
          <input type="text" className="form-control" placeholder="Analista..." value={filterAnalista}
            onChange={e => setFilterAnalista(e.target.value)} style={{ maxWidth: 150, fontSize: 12 }} />
          <input type="date" className="form-control" value={filterData}
            onChange={e => setFilterData(e.target.value)} style={{ maxWidth: 160, fontSize: 12 }} />
          <select className="form-select" value={filterAtividade} onChange={e => setFilterAtividade(e.target.value)}
            style={{ maxWidth: 150, fontSize: 12 }}>
            <option value="">Atividade...</option>
            {ATIVIDADE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 160, fontSize: 12 }}>
            <option value="">Todos status</option>
            {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={fetchData} style={{ padding: '7px 16px' }}>
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
                  <th style={th}>Analista</th>
                  <th style={th}>Ticket/Proj</th>
                  <th style={th}>Atividade</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Data</th>
                  <th style={{ ...th, textAlign: 'center' }}>Início</th>
                  <th style={{ ...th, textAlign: 'center' }}>Fim</th>
                  <th style={{ ...th, textAlign: 'center' }}>Duração</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma atividade encontrada</td></tr>
                ) : filtered.map((a, i) => {
                  const si = STATUS_INFO[a.status] ?? { label: a.status, color: '#444', bg: '#eee' };
                  const owner = isOwner(a.analista);
                  return (
                    <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.cliente}</td>
                      <td style={td}>{a.analista}</td>
                      <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{a.ticketproj || '—'}</td>
                      <td style={td}>{a.atividade}</td>
                      <td style={{ ...td, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.tipoatividade}</td>
                      <td style={td}>{new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#0F6E56' }}>{a.horainicio || '—'}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#204294' }}>{a.horafim || '—'}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: '#7F77DD' }}>{a.duracao || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>{si.label}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                          <button className="btn btn-sm" title={!owner ? 'Só o analista responsável pode agir' : ''}
                            style={{ background: owner && a.status === 'Nao Iniciado' ? '#0F6E56' : '#ccc', color: '#fff', fontSize: 9, padding: '3px 7px' }}
                            disabled={!owner || a.status !== 'Nao Iniciado'} onClick={() => handleAction(a.cod, 'iniciar')}>
                            <i className="bi bi-play-fill me-1" />Iniciar
                          </button>
                          <button className="btn btn-sm" title={!owner ? 'Só o analista responsável pode agir' : ''}
                            style={{ background: owner && a.status === 'Em Andamento' ? '#204294' : '#ccc', color: '#fff', fontSize: 9, padding: '3px 7px' }}
                            disabled={!owner || a.status !== 'Em Andamento'} onClick={() => handleAction(a.cod, 'terminar')}>
                            <i className="bi bi-stop-fill me-1" />Terminar
                          </button>
                          <button className="btn btn-sm" title={!owner ? 'Só o analista responsável pode agir' : ''}
                            style={{ background: owner && (a.status === 'Nao Iniciado' || a.status === 'Em Andamento') ? '#E74C3C' : '#ccc', color: '#fff', fontSize: 9, padding: '3px 7px' }}
                            disabled={!owner || (a.status === 'Concluido' || a.status === 'Cancelado')} onClick={() => handleAction(a.cod, 'cancelar')}>
                            <i className="bi bi-x-lg me-1" />Cancelar
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #7F77DD', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#7F77DD', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Monitor — Atividades</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Nova Atividade</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12" ref={clienteRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => handleClienteSearch(e.target.value)} placeholder="Digite para buscar..." />
                {showSugs && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2e3e', border: '1px solid #1a3a6e', borderRadius: 4, zIndex: 100, maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                    {clienteSugs.map(s => (
                      <div key={s} onClick={() => { setForm(f => ({ ...f, cliente: s })); setShowSugs(false); }}
                        style={{ padding: '7px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #1a3a6e' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#204294')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{s}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Analista *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {analistas.map(a => <option key={a.id} value={a.name.toUpperCase()}>{a.name}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Data *</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket / Proj</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticketproj} onChange={e => setForm(f => ({ ...f, ticketproj: e.target.value }))}
                  placeholder="Nº Ticket ou Projeto" />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Atividade *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.atividade} onChange={e => setForm(f => ({ ...f, atividade: e.target.value }))}>
                  {ATIVIDADE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Tipo de Atividade *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.tipoatividade} onChange={e => setForm(f => ({ ...f, tipoatividade: e.target.value }))}
                  placeholder="Ex: Suporte, Treinamento..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Registrar</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Time Modal */}
      {timeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: `3px solid ${timeModal.action === 'iniciar' ? '#0F6E56' : '#204294'}`, borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: timeModal.action === 'iniciar' ? '#0F6E56' : '#204294', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Monitor de Atividades</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
                {timeModal.action === 'iniciar' ? 'Horário de Início' : 'Horário de Término'}
              </div>
            </div>
            <div className="mb-4">
              <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Horário (hh:mm) *</label>
              <input type="time" className="form-control mt-1"
                style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                value={timeInput} onChange={e => setTimeInput(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setTimeModal(null)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: timeModal.action === 'iniciar' ? '#0F6E56' : '#204294', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleTimeConfirm}>
                <i className="bi bi-check-lg me-1" />Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
