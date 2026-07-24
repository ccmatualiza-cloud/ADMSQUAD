import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ClienteInativo {
  cod: number;
  razao: string | null;
  caminholoc: string | null;
  sistema: string | null;
  serverbd: string | null;
  dataoff: string | null;
  status: string | null;
  qtdusers: number | null;
}

export default function CancelamentoClientePage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<ClienteInativo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await http.get<ClienteInativo[]>(`/api/pmo/inativos${params}`);
      setClientes(data);
    } catch { toast.error('Erro ao carregar clientes inativos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

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
    </div>
  );
}
