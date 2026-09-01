import { useEffect, useState } from 'react';
import AusenciasPage from './ausencias-page';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Colaborador {
  cod: number; colab: string | null; area: string | null; depto: string | null;
  nivel: string | null; dt_admissao: string | null; prx_calferias1: string | null; prx_calferias2: string | null; prx_calferias3: string | null; prx_anoref: string | null;
  horario: string | null; almoco: string | null; almocof: string | null;
  horariof: string | null; userr: string | null; email: string | null;
  bh: string | null; saidaemp: string | null; status: string | null;
}

const emptyForm = {
  colab: '', area: '', nivel: '', depto: '', dt_admissao: '', prx_calferias1: '', prx_calferias2: '', prx_calferias3: '', prx_anoref: '',
  horario: '', almoco: '', almocof: '', horariof: '', bh: '', userr: '', email: '', saidaemp: '', status: 'Ativo',
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ColaboradoresPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Colaborador[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [showAusencias, setShowAusencias] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Ativo');

  const fetchData = async (q = '', st = filterStatus) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (st) p.set('status_filter', st);
      const data = await http.get<Colaborador[]>(`/api/gestao/colaboradores${p.toString() ? '?' + p.toString() : ''}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar colaboradores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Colaborador) => {
    setEditCod(c.cod);
    setForm({
      colab: c.colab ?? '', area: c.area ?? '', depto: c.depto ?? '',
      nivel: c.nivel ?? '', dt_admissao: c.dt_admissao ?? '', prx_calferias1: c.prx_calferias1 ?? '',
      prx_calferias2: c.prx_calferias2 ?? '', prx_calferias3: c.prx_calferias3 ?? '',
      prx_anoref: c.prx_anoref ?? '', horario: c.horario ?? '',
      almoco: c.almoco ?? '', almocof: c.almocof ?? '', horariof: c.horariof ?? '',
      bh: c.bh ?? '', userr: c.userr ?? '', email: c.email ?? '', saidaemp: c.saidaemp ?? '', status: c.status ?? 'Ativo',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.colab) { toast.error('Nome do colaborador é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/colaboradores/${editCod}`, form);
        toast.success('Colaborador atualizado!');
      } else {
        await http.post('/api/gestao/colaboradores', form);
        toast.success('Colaborador cadastrado!');
      }
      setShowModal(false); fetchData(search, filterStatus);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const filtered = items;

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  const Field = ({ label, fkey }: { label: string; fkey: keyof typeof emptyForm }) => (
    <div className="col-12 col-md-6">
      <label style={labelStyle}>{label}</label>
      <input type="text" className="form-control mt-1" style={inputStyle}
        value={form[fkey]} onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))} />
    </div>
  );

  if (showAusencias) return <AusenciasPage onBack={() => setShowAusencias(false)} />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Colaboradores</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Colaboradores</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-people-fill" style={{ color: '#1DB954', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} colaborador(es)`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: '#F9A825', color: '#5a4000', fontWeight: 700, fontSize: 12 }} onClick={() => setShowAusencias(true)}>
              <i className="bi bi-calendar-x-fill me-1" />Ausências
            </button>
            <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />Novo Colaborador
            </button>
          </div>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar por nome, área, depto..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search, filterStatus)}
            style={{ maxWidth: 300, fontSize: 13 }} />
          <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchData(search, e.target.value); }} style={{ maxWidth: 150, fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData(search, filterStatus)}>
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
                  <th style={th}>Colaborador</th>
                  <th style={th}>Área</th>
                  <th style={th}>Nível</th>
                  <th style={th}>Depto</th>
                  <th style={th}>Dt. Admissão</th>
                  <th style={th}>Prx. Férias 1</th>
                  <th style={th}>Prx. Férias 2</th>
                  <th style={th}>Prx. Férias 3</th>
                  <th style={th}>Horário</th>
                  <th style={th}>Horário F.</th>
                  <th style={th}>Almoço</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={13} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum colaborador encontrado</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{c.colab || '—'}</td>
                    <td style={td}>{c.area || '—'}</td>
                    <td style={td}>{c.nivel || '—'}</td>
                    <td style={td}>{c.depto || '—'}</td>
                    <td style={td}>{c.dt_admissao || '—'}</td>
                    <td style={td}>{c.prx_calferias1 || '—'}</td>
                    <td style={td}>{c.prx_calferias2 || '—'}</td>
                    <td style={td}>{c.prx_calferias3 || '—'}</td>
                    <td style={td}>{c.horario || '—'}</td>
                    <td style={td}>{c.horariof || '—'}</td>
                    <td style={td}>{c.almoco || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ background: c.status === 'Ativo' ? '#D4F5E2' : '#FDDEDE', color: c.status === 'Ativo' ? '#0E7E3B' : '#9B2020', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{c.status || 'Ativo'}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => openEdit(c)}>
                        <i className="bi bi-pencil-fill me-1" />Editar
                      </button>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #1DB954', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 640, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#1DB954', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão — Colaboradores</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Colaborador' : 'Novo Colaborador'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Nome *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.colab} onChange={e => setForm(f => ({ ...f, colab: e.target.value }))} placeholder="Nome do colaborador" />
              </div>
              <Field label="Área"            fkey="area" />
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Nível</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {['ASSISTENTE','JUNIOR 1','JUNIOR 2','PLENO 1','PLENO 2','SENIOR 1','SENIOR 2'].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <Field label="Departamento"    fkey="depto" />
              <Field label="Dt. Admissão"    fkey="dt_admissao" />
              <Field label="Prx. Férias 1" fkey="prx_calferias1" />
              <Field label="Prx. Férias 2" fkey="prx_calferias2" />
              <Field label="Prx. Férias 3" fkey="prx_calferias3" />
              <Field label="Prx. Ano Ref."   fkey="prx_anoref" />
              <Field label="Horário"         fkey="horario" />
              <Field label="Horário F."      fkey="horariof" />
              <Field label="BH"                fkey="bh" />
              <Field label="Almoço"          fkey="almoco" />
              <Field label="Almoço F."       fkey="almocof" />
              <Field label="Usuário"         fkey="userr" />
              <div className="col-12">
                <label style={labelStyle}>Email</label>
                <input type="email" className="form-control mt-1" style={inputStyle}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
              </div>
              <Field label="Saída Emp."      fkey="saidaemp" />
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
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
