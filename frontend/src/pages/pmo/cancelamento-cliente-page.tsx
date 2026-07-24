import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ClienteInativo {
  cod: number; razao: string | null; caminholoc: string | null;
  sistema: string | null; serverbd: string | null;
  dataoff: string | null; status: string | null; qtdusers: number | null;
}

interface ClienteInfo {
  cod: number; razao: string; qtdusers: number; grupo: string; status: string; caminholoc: string;
}

interface ClienteOpt { cod: number; razao: string | null; cliente: string | null; }

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const readStyle  = { background: '#0d1c28', border: '1px solid #1a3a6e', color: '#7FB3D3', fontSize: 13, cursor: 'not-allowed' };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function CancelamentoClientePage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes]   = useState<ClienteInativo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [clienteOpts, setClienteOpts] = useState<ClienteOpt[]>([]);
  const [selectedCod, setSelectedCod] = useState<number | ''>('');
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [cancelling, setCancelling]   = useState(false);

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await http.get<ClienteInativo[]>(`/api/pmo/inativos${params}`);
      setClientes(data);
    } catch { toast.error('Erro ao carregar clientes inativos'); }
    finally { setLoading(false); }
  };

  const fetchClienteOpts = async () => {
    try {
      const [ativos, vpu] = await Promise.all([
        http.get<ClienteOpt[]>('/api/cx/clientes?status_filter=6%20-%20ATIVO'),
        http.get<ClienteOpt[]>('/api/cx/clientes?status_filter=7%20-%20ATIVO%20VPU'),
      ]);
      const merged = [...ativos, ...vpu].sort((a, b) => (a.razao || '').localeCompare(b.razao || ''));
      setClienteOpts(merged);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchData(); fetchClienteOpts(); }, []);

  const handleSelectCliente = async (cod: number | '') => {
    setSelectedCod(cod);
    setClienteInfo(null);
    if (!cod) return;
    try {
      const d = await http.get<ClienteInfo>(`/api/pmo/cancelamento/cliente/${cod}`);
      setClienteInfo(d);
    } catch { toast.error('Erro ao buscar dados do cliente'); }
  };

  const handleCancelar = async () => {
    if (!selectedCod) { toast.error('Selecione um cliente'); return; }
    if (!confirm(`Confirma o cancelamento do cliente "${clienteInfo?.razao}"? Esta ação não pode ser desfeita.`)) return;
    setCancelling(true);
    try {
      await http.post('/api/pmo/cancelamento/cancelar', { cod: selectedCod });
      toast.success('Cliente cancelado com sucesso!');
      setShowModal(false);
      setSelectedCod('');
      setClienteInfo(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar');
    } finally { setCancelling(false); }
  };

  const openModal = () => { setSelectedCod(''); setClienteInfo(null); setShowModal(true); };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />PMO
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Cancelamento de Clientes</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Cancelamento de Clientes</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-x-circle-fill" style={{ color: '#E74C3C', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} cliente(s) inativo(s)`}
            </span>
          </div>
          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontWeight: 700, fontSize: 12 }} onClick={openModal}>
            <i className="bi bi-x-circle me-1" />Cancelar Cliente
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10 }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, sistema ou servidor..."
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
                  <th style={th}>Sistema</th>
                  <th style={th}>Server BD</th>
                  <th style={th}>Data Off</th>
                  <th style={th}>Obs</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente inativo encontrado</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{c.sistema || '—'}</td>
                    <td style={td}>{c.serverbd || '—'}</td>
                    <td style={td}>{c.dataoff || '—'}</td>
                    <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.caminholoc || '—'}</td>
                    <td style={td}>
                      <span style={{ background: '#FDDEDE', color: '#9B2020', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                        {c.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Cancelar Cliente */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #E74C3C', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#E74C3C', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>PMO — Cancelamento</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Cancelar Cliente</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Cliente *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={selectedCod} onChange={e => handleSelectCliente(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Selecione o cliente...</option>
                  {clienteOpts.map(c => (
                    <option key={c.cod} value={c.cod}>{c.razao || c.cliente || `COD ${c.cod}`}</option>
                  ))}
                </select>
              </div>

              <div className="col-6">
                <label style={labelStyle}>Qtd. Users</label>
                <input className="form-control mt-1" style={readStyle} readOnly value={clienteInfo ? clienteInfo.qtdusers : '—'} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Grupo</label>
                <input className="form-control mt-1" style={readStyle} readOnly value={clienteInfo ? clienteInfo.grupo || '—' : '—'} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Status</label>
                <input className="form-control mt-1" style={readStyle} readOnly value={clienteInfo ? clienteInfo.status || '—' : '—'} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Obs</label>
                <input className="form-control mt-1" style={readStyle} readOnly value={clienteInfo ? clienteInfo.caminholoc || '—' : '—'} />
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.3)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#E74C3C', fontWeight: 700 }}>
                <i className="bi bi-exclamation-triangle me-2" />
                Esta ação irá cancelar o cliente e não pode ser desfeita.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Fechar
              </button>
              <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }}
                onClick={handleCancelar} disabled={cancelling || !selectedCod}>
                {cancelling ? <><span className="spinner-border spinner-border-sm me-1" />Cancelando…</> : <><i className="bi bi-x-circle me-1" />Cancelar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
