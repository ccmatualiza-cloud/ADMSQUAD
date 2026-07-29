import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Cliente {
  cod: number; razao: string | null; cliente: string | null;
  sistema: string | null; versao: string | null;
  qtdusers: number | null; qtdusersts: number | null; serverbd: string | null;
  codigoc: string | null; grupo: string | null; status: string | null; doc: string | null;
}

interface ClienteDetalhe {
  cod: number; razao: string | null; cliente: string | null; bandeira: string | null;
  sistema: string | null; versao: string | null; bd: string | null; serverbd: string | null;
  qtdusers: number | null; qtdusersts: number | null; qtdsistemas: number | null; qtdsrv: string | null; status: string | null;
  contatos: string | null; telefones: string | null; emails: string | null; reg: string | null;
  local: string | null; grupo: string | null; tipo: string | null; pacote: string | null;
  dt_atualiza: string | null; versaoat: string | null; franq: string | null; ufmatriz: string | null;
  integracoes: string | null; infraprod: string | null; infrats: string | null; shape: string | null;
  ocpu: string | null; mem: string | null; tsplus: string | null; detalhes: string | null;
  implat: string | null; datastart: string | null; prxcontat: string | null; cnpj: string | null;
  codigoc: string | null; agtazure: string | null; linxwebver: string | null; doc: string | null;
  link1: string | null; link2: string | null; link3: string | null;
}

type EditForm = {
  razao: string; sistema: string; versao: string; bd: string; serverbd: string;
  qtdusers: string; qtdsistemas: string; qtdsrv: string;
  status: string; franq: string; ufmatriz: string; reg: string; bandeira: string;
  implat: string; contatos: string; telefones: string; emails: string;
  local: string; prxcontat: string; codigoc: string; cnpj: string; grupo: string;
  tipo: string; pacote: string; dt_atualiza: string; versaoat: string;
  datastart: string; agtazure: string; linxwebver: string;
  shape: string; ocpu: string; mem: string; tsplus: string;
  integracoes: string; infraprod: string; infrats: string; detalhes: string; doc: string;
  link1: string; link2: string; link3: string;
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  '6 - ATIVO':             { color: '#0E7E3B', bg: '#D4F5E2' },
  '7 - ATIVO VPU':         { color: '#0E7E3B', bg: '#C8F0D8' },
  '0 - IMPLANTAÇÃO':       { color: '#8A6800', bg: '#FFF8CC' },
  'X - ATIVO COMPLEMENTO': { color: '#204294', bg: '#E8EDF7' },
  '9 - INATIVO':           { color: '#9B2020', bg: '#FDDEDE' },
};

function statusBadge(s: string | null) {
  if (!s) return <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 11 }}>—</span>;
  const c = STATUS_COLORS[s] ?? { color: '#444', bg: '#eee' };
  return <span style={{ background: c.bg, color: c.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{s}</span>;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ccm-gray-dark)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ccm-ink)', wordBreak: 'break-word' }}>{String(value)}</div>
    </div>
  );
}

const GRUPO_OPTS = ['SEG','SMT','TER','QUA','QUI','SEX','CCM','INT','PMO','FRQ','CLI','AUT','2AI','3AI','4AI','5AI'];
const STATUS_OPTS = [
  '0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO','2 - SMART CLOUD','3 - SMART DBA',
  '4 - BASE','5 - CONFIGURAR ATUALIZADOR','6 - ATIVO','7 - ATIVO VPU',
  '8 - CONSULTA','9 - INATIVO','X - ATIVO COMPLEMENTO',
];

const emptyEditForm: EditForm = {
  razao: '', sistema: '', versao: '', bd: '', serverbd: '',
  qtdusers: '', qtdsistemas: '', qtdsrv: '',
  status: '', franq: '', ufmatriz: '', reg: '', bandeira: '',
  implat: '', contatos: '', telefones: '', emails: '',
  local: '', prxcontat: '', codigoc: '', cnpj: '', grupo: '',
  tipo: '', pacote: '', dt_atualiza: '', versaoat: '',
  datastart: '', agtazure: '', linxwebver: '',
  shape: '', ocpu: '', mem: '', tsplus: '',
  integracoes: '', infraprod: '', infrats: '', detalhes: '', doc: '',
  link1: '', link2: '', link3: '',
};

export default function ClientesListPage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [statusOpts, setStatusOpts]   = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterGrupo, setFilterGrupo]     = useState('');
  const [filterServerbd, setFilterServerbd] = useState('');
  const [detalhe, setDetalhe]         = useState<ClienteDetalhe | null>(null);
  const [loadingDet, setLoadingDet]   = useState(false);
  const [editItem, setEditItem]       = useState<ClienteDetalhe | null>(null);
  const [editForm, setEditForm]       = useState<EditForm>(emptyEditForm);
  const [savingEdit, setSavingEdit]   = useState(false);

  const fetchClientes = async (q = '', s = '', g = '', srv = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (s) params.set('status_filter', s);
      if (g) params.set('grupo_filter', g);
      if (srv) params.set('serverbd_filter', srv);
      const data = await http.get<Cliente[]>(`/api/cx/clientes?${params}`);
      setClientes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClientes();
    http.get<string[]>('/api/cx/clientes/status-options').then(setStatusOpts).catch(() => {});
  }, []);

  const handleSearch = () => fetchClientes(search, filterStatus, filterGrupo, filterServerbd);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const openDetalhe = async (cod: number) => {
    setDetalhe(null);
    setLoadingDet(true);
    try {
      const d = await http.get<ClienteDetalhe>(`/api/cx/clientes/${cod}`);
      setDetalhe(d);
    } catch { /* silent */ }
    finally { setLoadingDet(false); }
  };

  const openEdit = async (cod: number) => {
    try {
      const d = await http.get<ClienteDetalhe>(`/api/cx/clientes/${cod}`);
      setEditItem(d);
      setEditForm({
        razao: d.razao ?? '', sistema: d.sistema ?? '', versao: d.versao ?? '',
        bd: d.bd ?? '', serverbd: d.serverbd ?? '',
        qtdusers: String(d.qtdusers ?? ''), qtdsistemas: String(d.qtdsistemas ?? ''),
        qtdsrv: d.qtdsrv ?? '', status: d.status ?? '',
        franq: d.franq ?? '', ufmatriz: d.ufmatriz ?? '', reg: d.reg ?? '',
        bandeira: d.bandeira ?? '', implat: d.implat ?? '',
        contatos: d.contatos ?? '', telefones: d.telefones ?? '',
        emails: d.emails ?? '', local: d.local ?? '',
        prxcontat: d.prxcontat ?? '', codigoc: d.codigoc ?? '', cnpj: d.cnpj ?? '', grupo: d.grupo ?? '',
        tipo: d.tipo ?? '', pacote: d.pacote ?? '',
        dt_atualiza: d.dt_atualiza ?? '', versaoat: d.versaoat ?? '',
        datastart: d.datastart ?? '', agtazure: d.agtazure ?? '',
        linxwebver: d.linxwebver ?? '', shape: d.shape ?? '',
        ocpu: d.ocpu ?? '', mem: d.mem ?? '', tsplus: d.tsplus ?? '',
        integracoes: d.integracoes ?? '', infraprod: d.infraprod ?? '',
        infrats: d.infrats ?? '', detalhes: d.detalhes ?? '', doc: d.doc ?? '',
        link1: d.link1 ?? '', link2: d.link2 ?? '', link3: d.link3 ?? '',
      });
    } catch { toast.error('Erro ao carregar dados do cliente'); }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    try {
      const body = { ...editForm, qtdusers: editForm.qtdusers ? Number(editForm.qtdusers) : null };
      await http.put(`/api/cx/clientes/${editItem.cod}`, body);
      toast.success('Cliente atualizado!');
      setEditItem(null);
      fetchClientes(search, filterStatus, filterGrupo, filterServerbd);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSavingEdit(false); }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };
  const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
  const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Clientes</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Clientes Parceria Linx</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-people-fill" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} clientes`}
            </span>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, cliente ou sistema..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
            style={{ maxWidth: 340, fontSize: 13 }} />
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 220, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" className="form-control" placeholder="Grupo..."
            value={filterGrupo} onChange={e => setFilterGrupo(e.target.value)}
            onKeyDown={handleKeyDown} style={{ maxWidth: 120, fontSize: 13 }} />
          <input type="text" className="form-control" placeholder="Server BD..."
            value={filterServerbd} onChange={e => setFilterServerbd(e.target.value)}
            onKeyDown={handleKeyDown} style={{ maxWidth: 140, fontSize: 13 }} />
          <button className="btn btn-ccm-primary btn-sm" onClick={handleSearch} style={{ padding: '7px 18px' }}>
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
                  <th style={th}>Cliente</th>
                  <th style={th}>Sistema</th>
                  <th style={th}>Versão</th>
                  <th style={{ ...th, textAlign: 'center' }}>Users</th>
                  <th style={{ ...th, textAlign: 'center' }}>Users-TS</th>
                  <th style={th}>Server BD</th>
                  <th style={th}>Código-C</th>
                  <th style={th}>Grupo</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente encontrado</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-gray-dark)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{c.sistema || '—'}</td>
                    <td style={td}>{c.versao || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusers ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusersts ?? '—'}</td>
                    <td style={td}>{c.serverbd || '—'}</td>
                    <td style={td}>{c.codigoc || '—'}</td>
                    <td style={td}>{c.grupo || '—'}</td>
                    <td style={td}>{statusBadge(c.status)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-sm" style={{ background: '#00B0FA', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                          onClick={() => openDetalhe(c.cod)}>
                          <i className="bi bi-eye me-1" />Ver
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                          onClick={() => openEdit(c.cod)}>
                          <i className="bi bi-pencil-fill me-1" />Editar
                        </button>
                        {c.doc && (
                          <button className="btn btn-sm" style={{ background: '#1DB954', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                            onClick={() => { const url = c.doc!.startsWith('http') ? c.doc! : `https://${c.doc}`; window.open(url, '_blank'); }} title="Abrir documentação">
                            <i className="bi bi-file-earmark-text me-1" />Doc
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalhe */}
      {(detalhe || loadingDet) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, borderTop: '3px solid #00B0FA', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.3)' }}>
            {loadingDet ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
                <span className="spinner-border spinner-border-sm me-2" />Carregando...
              </div>
            ) : detalhe && (
              <>
                <div style={{ background: 'var(--ccm-ink)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
                  <div>
                    <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — Detalhe</div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{detalhe.razao || detalhe.cliente}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {statusBadge(detalhe.status)}
                    <button onClick={() => setDetalhe(null)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
                  </div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  {[
                    { title: 'Identificação', fields: [['Razão Social', detalhe.razao], ['Cliente', detalhe.cliente], ['Bandeira', detalhe.bandeira], ['CNPJ', detalhe.cnpj], ['Grupo', detalhe.grupo], ['UF Matriz', detalhe.ufmatriz], ['Franquia', detalhe.franq], ['Região', detalhe.reg], ['Local', detalhe.local], ['Data Start', detalhe.datastart], ['Documentação', detalhe.doc]] },
                    { title: 'Sistema', fields: [['Sistema', detalhe.sistema], ['Versão', detalhe.versao], ['Versão Atual', detalhe.versaoat], ['Pacote', detalhe.pacote], ['Tipo', detalhe.tipo], ['Qtd. Users', detalhe.qtdusers], ['Qtd. Users-TS', detalhe.qtdusersts], ['Qtd. Sistemas', detalhe.qtdsistemas], ['Linx Web Ver.', detalhe.linxwebver], ['Últ. Atualização', detalhe.dt_atualiza]] },
                    { title: 'Infraestrutura', fields: [['BD', detalhe.bd], ['Server BD', detalhe.serverbd], ['Qtd. Servidores', detalhe.qtdsrv], ['Shape', detalhe.shape], ['oCPU', detalhe.ocpu], ['Memória', detalhe.mem], ['TSPlus', detalhe.tsplus], ['Azure Agent', detalhe.agtazure], ['Infra Prod', detalhe.infraprod], ['Infra TS', detalhe.infrats], ['Integrações', detalhe.integracoes]] },
                    { title: 'Contato', fields: [['Contatos', detalhe.contatos], ['Telefones', detalhe.telefones], ['Emails', detalhe.emails], ['Próx. Contato', detalhe.prxcontat]] },
                  ].map(section => (
                    <div key={section.title}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>{section.title}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                        {section.fields.map(([label, val]) => <Field key={String(label)} label={String(label)} value={val} />)}
                      </div>
                    </div>
                  ))}
                  {(detalhe.link1 || detalhe.link2 || detalhe.link3) && <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Links</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[['Link 1', detalhe.link1], ['Link 2', detalhe.link2], ['Link 3', detalhe.link3]].map(([label, val]) => val ? (
                        <div key={String(label)}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ccm-gray-dark)', marginBottom: 2 }}>{label}</div>
                          <a href={String(val).startsWith('http') ? String(val) : `https://${val}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 13, color: '#00B0FA', wordBreak: 'break-all', textDecoration: 'none' }}>
                            <i className="bi bi-box-arrow-up-right me-1" style={{ fontSize: 11 }} />{val}
                          </a>
                        </div>
                      ) : null)}
                    </div>
                  </>}
                  {detalhe.detalhes && <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Observações</div>
                    <div style={{ fontSize: 13, color: 'var(--ccm-ink)', lineHeight: 1.6, background: '#F7F8FA', padding: '10px 14px', borderRadius: 4 }}>{detalhe.detalhes}</div>
                  </>}
                </div>
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--ccm-line)', textAlign: 'right' }}>
                  <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 12, padding: '7px 20px' }} onClick={() => setDetalhe(null)}>Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 620, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — Editar Cliente</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{editItem.razao || editItem.cliente}</div>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div className="row g-3">
              {/* Identificação */}
              <div className="col-12"><div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid #1a3a6e', paddingBottom: 4, marginBottom: 4 }}>Identificação</div></div>
              {([
                ['Razão Social', 'razao'], ['Bandeira', 'bandeira'], ['CNPJ', 'cnpj'],
                ['UF Matriz', 'ufmatriz'], ['Região', 'reg'],
                ['Franquia', 'franq'], ['Implantador', 'implat'],
                ['Local', 'local'], ['Data Start', 'datastart'], ['Próx. Contato', 'prxcontat'], ['Código-C', 'codigoc'],
              ] as [string, keyof EditForm][]).map(([label, key]) => (
                <div key={key} className="col-12 col-md-6">
                  <label style={labelStyle}>{label}</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {/* Grupo — combobox */}
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Grupo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={editForm.grupo} onChange={e => setEditForm(f => ({ ...f, grupo: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {GRUPO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Sistema */}
              <div className="col-12"><div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid #1a3a6e', paddingBottom: 4, marginBottom: 4, marginTop: 4 }}>Sistema</div></div>
              {([
                ['Sistema', 'sistema'], ['Versão', 'versao'], ['Versão Atual', 'versaoat'],
                ['Tipo', 'tipo'], ['Pacote', 'pacote'], ['Qtd. Usuários', 'qtdusers'],
                ['Qtd. Sistemas', 'qtdsistemas'], ['Linx Web Ver.', 'linxwebver'],
                ['Últ. Atualização', 'dt_atualiza'],
              ] as [string, keyof EditForm][]).map(([label, key]) => (
                <div key={key} className="col-12 col-md-6">
                  <label style={labelStyle}>{label}</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {/* Status — combobox */}
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Infraestrutura */}
              <div className="col-12"><div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid #1a3a6e', paddingBottom: 4, marginBottom: 4, marginTop: 4 }}>Infraestrutura</div></div>
              {([
                ['BD', 'bd'], ['Server BD', 'serverbd'], ['Qtd. Servidores', 'qtdsrv'], ['Documentação (URL)', 'doc'],
                ['Shape', 'shape'], ['oCPU', 'ocpu'], ['Memória', 'mem'],
                ['TSPlus', 'tsplus'], ['Azure Agent', 'agtazure'],
                ['Infra Prod', 'infraprod'], ['Infra TS', 'infrats'], ['Integrações', 'integracoes'],
              ] as [string, keyof EditForm][]).map(([label, key]) => (
                <div key={key} className="col-12 col-md-6">
                  <label style={labelStyle}>{label}</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {/* Contato */}
              <div className="col-12"><div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid #1a3a6e', paddingBottom: 4, marginBottom: 4, marginTop: 4 }}>Contato</div></div>
              {([
                ['Contatos', 'contatos'], ['Telefones', 'telefones'], ['E-mails', 'emails'],
              ] as [string, keyof EditForm][]).map(([label, key]) => (
                <div key={key} className="col-12 col-md-6">
                  <label style={labelStyle}>{label}</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {/* Links */}
              <div className="col-12"><div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid #1a3a6e', paddingBottom: 4, marginBottom: 4, marginTop: 4 }}>Links</div></div>
              {([['Link 1', 'link1'], ['Link 2', 'link2'], ['Link 3', 'link3']] as [string, keyof EditForm][]).map(([label, key]) => (
                <div key={key} className="col-12">
                  <label style={labelStyle}>{label}</label>
                  <input type="text" className="form-control mt-1" style={inputStyle}
                    value={editForm[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="https://..." />
                </div>
              ))}
              <div className="col-12">
                <label style={labelStyle}>Observações</label>
                <textarea className="form-control mt-1" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  value={editForm.detalhes}
                  onChange={e => setEditForm(f => ({ ...f, detalhes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setEditItem(null)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Salvar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
