import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Apoio {
  cod: number; requisitante: string; tipo: string; assunto: string;
  descricao: string | null; squad: string; apoiador: string;
  ticket: string | null; kb: string | null; status: string;
}

const STATUS_INFO: Record<string, { color: string; bg: string }> = {
  'Aberto':      { color: '#204294', bg: '#E8EDF7' },
  'Em Andamento':{ color: '#8A6800', bg: '#FFF8CC' },
  'Concluido':   { color: '#0E7E3B', bg: '#D4F5E2' },
  'Cancelado':   { color: '#9B2020', bg: '#FDDEDE' },
};

const TIPO_OPTS = ['Dúvida', 'Incidente', 'Requisição', 'Melhoria', 'Treinamento', 'Outro'];
const SQUAD_OPTS = ['BULLS', 'LAKERS', 'ROCKETS', 'WARRIORS', 'ENGENHARIA', 'GRC'];
const STATUS_OPTS = ['Aberto', 'Em Andamento', 'Concluido', 'Cancelado'];

const emptyForm = {
  requisitante: '', tipo: 'Dúvida', assunto: '', descricao: '',
  squad: '', apoiador: '', ticket: '', kb: '', status: 'Aberto',
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ApoiosHelpPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Apoio[]>([]);
  const [usuarios, setUsuarios]   = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([
        http.get<Apoio[]>('/api/operacoes/apoios'),
        http.get<{ id: number; name: string }[]>('/api/user/by-role'),
      ]);
      setItems(data);
      setUsuarios(users);
    } catch { toast.error('Erro ao carregar apoios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a: Apoio) => {
    setEditCod(a.cod);
    setForm({ requisitante: a.requisitante, tipo: a.tipo, assunto: a.assunto,
              descricao: a.descricao ?? '', squad: a.squad, apoiador: a.apoiador,
              ticket: a.ticket ?? '', kb: a.kb ?? '', status: a.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.requisitante || !form.assunto) { toast.error('Requisitante e Assunto são obrigatórios'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/operacoes/apoios/${editCod}`, form);
        toast.success('Apoio atualizado!');
      } else {
        await http.post('/api/operacoes/apoios', form);
        toast.success('Apoio registrado!');
      }
      setShowModal(false); fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try { await http.del(`/api/operacoes/apoios/${cod}`); toast.success('Excluído'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const handleConcluir = async (cod: number) => {
    try { await http.put(`/api/operacoes/apoios/${cod}`, { status: 'Concluido' }); toast.success('Apoio concluído!'); fetchData(); }
    catch { toast.error('Erro ao concluir'); }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };
  const sortedUsers = [...usuarios].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Apoios — Help</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Apoios — Help</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-life-preserver" style={{ color: '#F9A825', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} registro(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 200, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
                  <th style={th}>Requisitante</th>
                  <th style={th}>Ticket</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Assunto</th>
                  <th style={th}>Squad</th>
                  <th style={th}>Apoiador</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={th}>KB / Link</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum registro encontrado</td></tr>
                ) : filtered.map((a, i) => {
                  const si = STATUS_INFO[a.status] ?? { color: '#444', bg: '#eee' };
                  return (
                    <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{a.requisitante}</td>
                      <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{a.ticket || '—'}</td>
                      <td style={td}>{a.tipo}</td>
                      <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.assunto}</td>
                      <td style={td}>{a.squad || '—'}</td>
                      <td style={td}>{a.apoiador || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{a.status}</span>
                      </td>
                      <td style={td}>
                        {a.kb ? (
                          <a href={a.kb.startsWith('http') ? a.kb : `https://${a.kb}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#1DB954', fontSize: 11, textDecoration: 'none' }}>
                            <i className="bi bi-box-arrow-up-right me-1" />Ver KB
                          </a>
                        ) : (
                          <span style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--ccm-gray-medium)' }}>Aguardando KB</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(a)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          {a.status !== 'Concluido' && (
                            <button className="btn btn-sm"
                              style={{ background: a.kb ? '#1DB954' : '#ccc', color: '#fff', fontSize: 10, padding: '3px 9px' }}
                              disabled={!a.kb}
                              title={!a.kb ? 'Preencha o KB antes de concluir' : ''}
                              onClick={() => handleConcluir(a.cod)}>
                              <i className="bi bi-check-lg me-1" />Concluir
                            </button>
                          )}
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(a.cod)}>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #F9A825', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 580, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#F9A825', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações — Apoios Help</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Apoio' : 'Novo Apoio'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Requisitante *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.requisitante} onChange={e => setForm(f => ({ ...f, requisitante: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {sortedUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Tipo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Assunto *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} placeholder="Descreva o assunto" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Descrição</label>
                <textarea className="form-control mt-1" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do apoio..." />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Squad</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.squad} onChange={e => setForm(f => ({ ...f, squad: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {SQUAD_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Apoiador</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.apoiador} onChange={e => setForm(f => ({ ...f, apoiador: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {sortedUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticket} onChange={e => setForm(f => ({ ...f, ticket: e.target.value }))} placeholder="Nº do ticket" />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>KB (Link)</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.kb} onChange={e => setForm(f => ({ ...f, kb: e.target.value }))} placeholder="https://..." />
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
              <button className="btn btn-sm" style={{ background: '#F9A825', color: '#5a4000', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
