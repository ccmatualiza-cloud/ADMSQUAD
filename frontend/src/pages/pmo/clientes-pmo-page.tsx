import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ClientePmo {
  cod: number;
  razao: string | null;
  implat: string | null;
  franq: string | null;
  qtdusers: number | null;
  prxcontat: string | null;
  datprev: string | null;
  stimplant: string | null;
  status: string | null;
  tsplus: string | null;
  qtdusersts: number | null;
}

interface Franquia { cod: number; contato: string | null; nome: string | null; }

const emptyForm = {
  razao: '', cliente: '', qtdusers: '' as string | number,
  datprev: '', sistema: '', prxcontat: '',
  franq: '', implat: '', stimplant: '',
  tsplus: 'Nao', qtdusersts: '' as string | number,
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

const SISTEMA_OPTS = ['APOLLO', 'AUTOSHOP', 'BRAVOS', 'HPE', 'APOLLO / HPE', 'APOLLO / BRAVOS'];
const STIMPLANT_OPTS = ['PLANEJAMENTO','ANDAMENTO','MIGRACAO','HOMOLOGACAO','GO-LIVE','ACOMPANHAMENTO','ENCERRAMENTO'];

function toDateInput(val: string): string {
  if (!val) return '';
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}

function fromDateInput(val: string): string {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

export default function ClientesPmoPage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes]   = useState<ClientePmo[]>([]);
  const [franquias, setFranquias] = useState<Franquia[]>([]);
  const [implantadores, setImplantadores] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  // date input states (yyyy-mm-dd)
  const [datprevInput, setDatprevInput]   = useState('');
  const [prxcontatInput, setPrxcontatInput] = useState('');

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const [data, frqs] = await Promise.all([
        http.get<ClientePmo[]>(`/api/pmo/clientes${params}`),
        http.get<Franquia[]>('/api/pmo/franquias'),
      ]);
      setClientes(data);
      setFranquias(frqs);
      // busca implantadores separado para não quebrar se falhar
      http.get<{ id: number; name: string }[]>('/api/user/by-role?role=operador_pmo')
        .then(setImplantadores)
        .catch(() => {});
    } catch { toast.error('Erro ao carregar clientes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditCod(null); setForm(emptyForm);
    setDatprevInput(''); setPrxcontatInput('');
    setShowModal(true);
  };

  const openEdit = (c: ClientePmo) => {
    setEditCod(c.cod);
    setForm({
      razao: c.razao ?? '', cliente: '',
      qtdusers: c.qtdusers ?? '',
      datprev: c.datprev ?? '', sistema: '',
      prxcontat: c.prxcontat ?? '',
      franq: c.franq ?? '', implat: c.implat ?? '',
      stimplant: c.stimplant ?? '',
      tsplus: c.tsplus ?? 'Nao',
      qtdusersts: c.qtdusersts ?? '',
    });
    setDatprevInput(toDateInput(c.datprev ?? ''));
    setPrxcontatInput(toDateInput(c.prxcontat ?? ''));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.razao || (!editCod && !form.cliente)) {
      toast.error('Razão Social e Cliente são obrigatórios'); return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        qtdusers: form.qtdusers ? Number(form.qtdusers) : null,
        qtdusersts: form.qtdusersts ? Number(form.qtdusersts) : null,
        datprev: fromDateInput(datprevInput) || form.datprev,
        prxcontat: fromDateInput(prxcontatInput) || form.prxcontat,
      };
      if (editCod !== null) {
        await http.put(`/api/pmo/clientes/${editCod}`, body);
        toast.success('Cliente atualizado!');
      } else {
        await http.post('/api/pmo/clientes', body);
        toast.success('Cliente cadastrado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleAcaoRapida = async (cod: number, acao: 'concluir' | 'cancelar') => {
    const msgs = { concluir: 'Confirma concluir esta implantação?', cancelar: 'Confirma cancelar esta implantação?' };
    if (!confirm(msgs[acao])) return;
    try {
      await http.put(`/api/pmo/clientes/${cod}/${acao}-implantacao`, {});
      const ok = { concluir: 'Implantação concluída!', cancelar: 'Implantação cancelada!' };
      toast.success(ok[acao]);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />PMO
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Clientes em Implantação</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Clientes em Implantação</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-building" style={{ color: '#F9E000', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} clientes`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Cliente
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10 }}>
          <input type="text" className="form-control" placeholder="Buscar razão, implantador ou franquia..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 360, fontSize: 13 }} />
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
                  <th style={th}>Razão Social</th>
                  <th style={th}>Implantador</th>
                  <th style={th}>Franqueado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Users</th>
                  <th style={th}>TS</th>
                  <th style={{ ...th, textAlign: 'center' }}>Users-TS</th>
                  <th style={th}>Próx. Contato</th>
                  <th style={th}>Prev. Conclusão</th>
                  <th style={th}>Status Impl.</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente em implantação</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={td}>{c.implat || '—'}</td>
                    <td style={td}>{c.franq || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusers ?? '—'}</td>
                    <td style={td}>{c.tsplus || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusersts ?? '—'}</td>
                    <td style={td}>{c.prxcontat || '—'}</td>
                    <td style={td}>{c.datprev || '—'}</td>
                    <td style={td}>
                      {c.stimplant ? (
                        <span style={{ background: '#FFF8CC', color: '#8A6800', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                          {c.stimplant}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil-fill me-1" />Editar
                        </button>
                        <button className="btn btn-sm" style={{ background: '#1DB954', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => handleAcaoRapida(c.cod, 'concluir')}>
                          <i className="bi bi-check-lg me-1" />Concluir
                        </button>
                        <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => handleAcaoRapida(c.cod, 'cancelar')}>
                          <i className="bi bi-x-lg me-1" />Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #F9E000', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 580, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#F9E000', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>PMO — Implantação</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
                  {editCod !== null ? 'Editar Cliente' : 'Novo Cliente'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Razão Social *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.razao} onChange={e => setForm(f => ({ ...f, razao: e.target.value }))} placeholder="Nome completo da empresa" />
              </div>

              {!editCod && (
                <div className="col-12 col-md-6">
                  <label style={labelStyle}>Cliente (Código) *</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Código do cliente" />
                </div>
              )}

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Sistema</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.sistema} onChange={e => setForm(f => ({ ...f, sistema: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {SISTEMA_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Qtd. Usuários</label>
                <input type="number" className="form-control mt-1" style={inputStyle}
                  value={form.qtdusers} onChange={e => setForm(f => ({ ...f, qtdusers: e.target.value }))} placeholder="0" />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>TSPlus</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.tsplus} onChange={e => setForm(f => ({ ...f, tsplus: e.target.value }))}>
                  <option value="Nao">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Qtd. Usuários TS</label>
                <input type="number" className="form-control mt-1" style={inputStyle}
                  value={form.qtdusersts} onChange={e => setForm(f => ({ ...f, qtdusersts: e.target.value }))} placeholder="0" />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Previsão de Conclusão</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={datprevInput} onChange={e => setDatprevInput(e.target.value)} />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Próximo Contato</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={prxcontatInput} onChange={e => setPrxcontatInput(e.target.value)} />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Franqueado</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.franq} onChange={e => setForm(f => ({ ...f, franq: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {[...franquias].sort((a, b) => (a.contato ?? a.nome ?? '').localeCompare(b.contato ?? b.nome ?? '')).map(f => (
                    <option key={f.cod} value={f.contato ?? f.nome ?? ''}>{f.contato || f.nome || '—'}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Implantador</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.implat} onChange={e => setForm(f => ({ ...f, implat: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {implantadores.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Status Implantação</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.stimplant} onChange={e => setForm(f => ({ ...f, stimplant: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {STIMPLANT_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Status</label>
                <input type="text" className="form-control mt-1" style={{ ...inputStyle, opacity: 0.6 }}
                  value="0 - IMPLANTAÇÃO" readOnly />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-sm" style={{ background: '#F9E000', color: '#5a4000', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar Alterações' : 'Cadastrar Cliente'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
