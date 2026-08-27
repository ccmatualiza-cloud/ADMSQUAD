import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

interface ConsultaItem {
  cod: number; razao: string | null; sistema: string | null;
  versao: string | null; linxwebver: string | null;
  linx2camaut: string | null; linx3camaut: string | null;
  codigoc: string | null; pacote: string | null;
  useragend: string | null; dt_atualiza: string | null;
  concluido: string | number | null;
}

function concluidoBadge(val: string | number | null) {
  const v = String(val ?? '0').trim();
  if (v === '100') return <span style={{ background: '#D4F5E2', color: '#0E7E3B', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>100</span>;
  if (v === '0' || v === '') return <span style={{ background: '#fff', color: '#333', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 11, border: '1px solid #ddd' }}>0</span>;
  return <span style={{ background: '#F9E000', color: '#5a4000', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>{v}</span>;
}

function formatDateInput(d: string) {
  // converte yyyy-mm-dd (input date) para dd/mm/yyyy (formato do banco)
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function ConsultarAtualizacaoLinx({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<ConsultaItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dataFiltro, setDataFiltro] = useState('');

  const fetchClientes = async (q = '', data = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (data) params.set('data_filter', formatDateInput(data));
      const result = await http.get<ConsultaItem[]>(`/api/cx/consultar-atualizacao?${params}`);
      setClientes(result);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleSearch = () => fetchClientes(search, dataFiltro);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const handleCancelar = async (cod: number, razao: string) => {
    if (!confirm(`Cancelar agendamento de "${razao}"? Isso zerará a data e marcará como concluído.`)) return;
    try {
      await http.del(`/api/cx/consultar-atualizacao/${cod}/cancelar`);
      fetchClientes(search, dataFiltro);
    } catch { /* silent */ }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Consultar Atualização Linx</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Consultar Atualização Linx</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-search" style={{ color: '#F9A825', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} clientes`}
            </span>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, cliente ou sistema..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
            style={{ maxWidth: 320, fontSize: 13 }} />
          <input type="date" className="form-control" value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)} onKeyDown={handleKeyDown}
            style={{ maxWidth: 180, fontSize: 13 }} title="Filtrar por última atualização" />
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
                  <th style={{ ...th, fontSize: 9 }}>Razão Social</th>
                  <th style={{ ...th, fontSize: 9 }}>Sistema</th>
                  <th style={{ ...th, fontSize: 9 }}>Versão</th>
                  <th style={{ ...th, fontSize: 9 }}>Ver. Web</th>
                  <th style={{ ...th, fontSize: 9 }}>2Cam</th>
                  <th style={{ ...th, fontSize: 9 }}>3Cam</th>
                  <th style={{ ...th, fontSize: 9 }}>Cód-C</th>
                  <th style={{ ...th, fontSize: 9 }}>Pacote</th>
                  <th style={{ ...th, fontSize: 9 }}>Agendado Por</th>
                  <th style={{ ...th, fontSize: 9 }}>Dt. Update</th>
                  <th style={{ ...th, textAlign: 'center', fontSize: 9 }}>%</th>
                  <th style={{ ...th, textAlign: 'center', fontSize: 9 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={12} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente encontrado</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontSize: 11, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 220, minWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={{ ...td, fontSize: 11, color: 'var(--ccm-blue)', fontWeight: 600 }}>{c.sistema || '—'}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.versao || '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.linxwebver || '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.linx2camaut || '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.linx3camaut || '—'}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.codigoc || '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.pacote || '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.useragend ? c.useragend.toUpperCase() : '—'}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.dt_atualiza || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{concluidoBadge(c.concluido)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '2px 8px', lineHeight: 1 }}
                        onClick={() => handleCancelar(c.cod, c.razao || '')} title="Cancelar agendamento">
                        <i className="bi bi-x-lg" />
                      </button>
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
