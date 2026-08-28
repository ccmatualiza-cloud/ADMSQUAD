import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ClienteOpt { cod: number; razao: string | null; }

interface TouchPoint {
  cod: number; cliente: string; contato: string | null; data: string | null; periodo: string | null;
  hora: string | null; nota_contato: string | null; nota: number | null;
  analista: string | null; crm: string | null; status: string;
}

const STATUS_OPTS = ['Agendado', 'Concluido', 'Cancelado'];
const PERIODO_OPTS = ['Mensal', 'Bimestral', 'Trimestral'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Agendado':  { bg: '#E8EDF7', color: '#204294' },
  'Concluido': { bg: '#D4F5E2', color: '#0E7E3B' },
  'Cancelado': { bg: '#FDDEDE', color: '#9B2020' },
};

const emptyForm = { cliente: '', contato: '', data: '', periodo: 'Mensal', hora: '', nota_contato: '', nota: null as number | null, analista: '', crm: '', status: 'Agendado' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function TouchPointsPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<TouchPoint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dataIni, setDataIni]     = useState('');
  const [clientes, setClientes]   = useState<ClienteOpt[]>([]);
  const [usuarios, setUsuarios]   = useState<{ id: number; name: string }[]>([]);
  const [dataFim, setDataFim]     = useState('');

  const fetchData = async (q = '', ini = dataIni, fim = dataFim) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (ini) p.set('data_ini', ini);
      if (fim) p.set('data_fim', fim);
      const data = await http.get<TouchPoint[]>(`/api/cx/touchpoints${p.toString() ? '?' + p.toString() : ''}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar touchpoints'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsuarios([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
    http.get<ClienteOpt[]>('/api/cx/clientes?status_filter=6%20-%20ATIVO')
      .then(d => {
        http.get<ClienteOpt[]>('/api/cx/clientes?status_filter=7%20-%20ATIVO%20VPU').then(d2 => {
          const merged = [...d, ...d2].sort((a, b) => (a.razao || '').localeCompare(b.razao || ''));
          setClientes(merged);
        });
      })
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (t: TouchPoint) => {
    setEditCod(t.cod);
    setForm({ cliente: t.cliente, contato: t.contato ?? '', data: t.data ?? '', periodo: t.periodo ?? 'Mensal',
              hora: t.hora ?? '', nota_contato: t.nota_contato ?? '',
              nota: t.nota ?? null, analista: t.analista ?? '', crm: t.crm ?? '', status: t.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente) { toast.error('Cliente é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/cx/touchpoints/${editCod}`, form);
        toast.success('Atualizado!');
      } else {
        await http.post('/api/cx/touchpoints', form);
        toast.success('Registrado!');
      }
      setShowModal(false); fetchData(search);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir este touchpoint?')) return;
    try { await http.del(`/api/cx/touchpoints/${cod}`); toast.success('Excluído'); fetchData(search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const totalReg = filtered.length;
  const notasPreenchidas = filtered.filter(i => i.nota !== null && i.nota !== undefined);
  const mediaNota = notasPreenchidas.length > 0
    ? (notasPreenchidas.reduce((s, i) => s + (i.nota ?? 0), 0) / notasPreenchidas.length).toFixed(1)
    : '—';

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>TouchPoints</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>TouchPoints</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-telephone-fill" style={{ color: '#1DB954', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>TouchPoints</span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar cliente, CRM..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 220, fontSize: 13 }} />
          <input type="text" className="form-control" placeholder="dd/mm/aaaa"
            value={dataIni} onChange={e => setDataIni(e.target.value)}
            style={{ maxWidth: 130, fontSize: 13 }} maxLength={10} />
          <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12 }}>até</span>
          <input type="text" className="form-control" placeholder="dd/mm/aaaa"
            value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ maxWidth: 130, fontSize: 13 }} maxLength={10} />
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData(search, dataIni, dataFim)}>
            <i className="bi bi-search me-1" />Buscar
          </button>

          {/* Mini cards */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <div style={{ background: '#E8EDF7', borderRadius: 6, padding: '6px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#204294', letterSpacing: '.1em' }}>Registros</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#204294' }}>{loading ? '…' : totalReg}</div>
            </div>
            <div style={{ background: '#D4F5E2', borderRadius: 6, padding: '6px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#0E7E3B', letterSpacing: '.1em' }}>Nota Média</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0E7E3B' }}>{loading ? '…' : mediaNota}</div>
            </div>
          </div>
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
                  <th style={th}>Contato</th>
                  <th style={th}>Data</th>
                  <th style={th}>Período</th>
                  <th style={th}>Hora</th>
                  <th style={th}>Analista</th>
                  <th style={th}>Nota</th>
                  <th style={th}>Relato do Contato</th>
                  <th style={th}>CRM</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum registro encontrado</td></tr>
                ) : filtered.map((t, i) => {
                  const si = STATUS_COLORS[t.status] ?? { bg: '#eee', color: '#444' };
                  return (
                    <tr key={t.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.cliente}</td>
                      <td style={{ ...td, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.contato || '—'}</td>
                      <td style={td}>{t.data ? (t.data.includes('-') ? t.data.split('-').reverse().join('/') : t.data) : '—'}</td>
                      <td style={td}>{t.periodo || '—'}</td>
                      <td style={td}>{t.hora || '—'}</td>
                      <td style={td}>{t.analista || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {t.nota !== null && t.nota !== undefined ? (
                          <span style={{ background: t.nota >= 8 ? '#D4F5E2' : t.nota >= 5 ? '#FFF8CC' : '#FDDEDE', color: t.nota >= 8 ? '#0E7E3B' : t.nota >= 5 ? '#8A6800' : '#9B2020', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                            {t.nota}/10
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nota_contato || '—'}</td>
                      <td style={{ ...td, maxWidth: 140 }}>
                        {t.crm ? (
                          <a href={t.crm.startsWith('http') ? t.crm : `https://${t.crm}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#1DB954', fontSize: 11, textDecoration: 'none' }}>
                            <i className="bi bi-box-arrow-up-right me-1" />Abrir CRM
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{t.status}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(t)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(t.cod)}>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #1DB954', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 580, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#1DB954', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — TouchPoints</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar TouchPoint' : 'Novo TouchPoint'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Cliente *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}>
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => <option key={c.cod} value={c.razao || ''}>{c.razao || '—'}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Contato</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="Nome do contato" />
              </div>

              <div className="col-12 col-md-4">
                <label style={labelStyle}>Data</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  placeholder="dd/mm/aaaa" maxLength={10} />
              </div>
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Período</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
                  {PERIODO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Hora</label>
                <input type="time" className="form-control mt-1" style={inputStyle}
                  value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Analista</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>

              <div className="col-12">
                <label style={labelStyle}>Nota do Cliente (1 a 10)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm(f => ({ ...f, nota: f.nota === n ? null : n }))}
                      style={{
                        width: 38, height: 38, borderRadius: 6, border: '2px solid',
                        borderColor: form.nota === n ? (n >= 8 ? '#1DB954' : n >= 5 ? '#F9A825' : '#E74C3C') : '#1a3a6e',
                        background: form.nota === n ? (n >= 8 ? '#1DB954' : n >= 5 ? '#F9A825' : '#E74C3C') : 'transparent',
                        color: form.nota === n ? '#fff' : '#9BA4AB',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Relato do Contato</label>
                <textarea className="form-control mt-1" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  value={form.nota_contato} onChange={e => setForm(f => ({ ...f, nota_contato: e.target.value }))} placeholder="Descreva o contato..." />
              </div>
              <div className="col-12 col-md-8">
                <label style={labelStyle}>CRM (Link)</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <input type="url" className="form-control" style={inputStyle}
                    value={form.crm} onChange={e => setForm(f => ({ ...f, crm: e.target.value }))} placeholder="https://..." />
                  {form.crm && (
                    <a href={form.crm.startsWith('http') ? form.crm : `https://${form.crm}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#1DB954', fontSize: 18, flexShrink: 0 }} title="Abrir link">
                      <i className="bi bi-box-arrow-up-right" />
                    </a>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
