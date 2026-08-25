import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

export default function CaminhoAppPage({ onBack }: { onBack: () => void }) {
  const [status, setStatus]   = useState<'S' | 'N' | null>(null);
  const [dataapp, setDatabd]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const d = await http.get<{ caminhoapp: string; dataapp: string }>('/api/gestao/caminho-app/status');
      setStatus((d.caminhoapp === 'S' ? 'S' : 'N') as 'S' | 'N');
      setDatabd(d.dataapp || '');
    } catch { toast.error('Erro ao carregar status'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleToggle = async () => {
    if (status === null) return;
    const novoValor: 'S' | 'N' = status === 'S' ? 'N' : 'S';
    setSaving(true);
    try {
      const r = await http.put<{ updated: boolean; caminhoapp: string; dataapp: string }>(
        '/api/gestao/caminho-app/update', { valor: novoValor }
      );
      setStatus(r.caminhoapp === 'S' ? 'S' : 'N');
      setDatabd(r.dataapp || '');
      toast.success(novoValor === 'S' ? 'Caminho APP habilitado!' : 'Caminho APP desabilitado!');
    } catch { toast.error('Erro ao atualizar'); }
    finally { setSaving(false); }
  };

  const habilitado = status === 'S';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Caminho APP</span>
      </div>

      <div style={{ maxWidth: 480, margin: '40px auto' }}>
        <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 10, padding: '36px 40px', boxShadow: '0 2px 12px rgba(12,25,33,.08)', textAlign: 'center' }}>

          {/* Title */}
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--ccm-gray-dark)', marginBottom: 32 }}>
            Alterar Aplicativo dos atualizadores
          </div>

          {loading ? (
            <div style={{ padding: 40 }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  style={{
                    width: 80, height: 40, borderRadius: 99, border: 'none', cursor: saving ? 'wait' : 'pointer',
                    background: habilitado ? '#1DB954' : '#ccc',
                    position: 'relative', transition: 'background .3s',
                    boxShadow: habilitado ? '0 0 0 4px rgba(29,185,84,.2)' : '0 0 0 4px rgba(0,0,0,.05)',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 4, left: habilitado ? 44 : 4,
                    width: 32, height: 32, borderRadius: '50%', background: '#fff',
                    transition: 'left .3s', boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                  }} />
                </button>

                {/* Badge */}
                <span style={{
                  background: habilitado ? '#D4F5E2' : '#F5F5F5',
                  color: habilitado ? '#0E7E3B' : '#888',
                  borderRadius: 99, padding: '4px 18px',
                  fontSize: 13, fontWeight: 700, letterSpacing: '.08em',
                }}>
                  {habilitado ? 'S — Habilitado' : 'N — Desabilitado'}
                </span>
              </div>

              {/* Info */}
              <div style={{ background: '#F7F8FA', borderRadius: 8, padding: '14px 20px', fontSize: 12, color: 'var(--ccm-gray-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>Status atual:</span>
                  <span style={{ color: habilitado ? '#0E7E3B' : '#888', fontWeight: 700 }}>{habilitado ? 'Habilitado (S)' : 'Desabilitado (N)'}</span>
                </div>
                {dataapp && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>Última atualização:</span>
                    <span>{dataapp}</span>
                  </div>
                )}
              </div>

              {saving && (
                <div style={{ marginTop: 16, color: 'var(--ccm-gray-dark)', fontSize: 12 }}>
                  <span className="spinner-border spinner-border-sm me-2" />Salvando...
                </div>
              )}

              {/* Instructions */}
              <div style={{ marginTop: 24, background: '#F7F8FA', borderRadius: 8, padding: '16px 20px', textAlign: 'left', borderLeft: '3px solid #F9A825' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#F9A825', marginBottom: 10 }}>Instruções</div>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
                    Dentro do servidor All-in-One, colocar os arquivos corretos em:
                    <div style={{ marginTop: 6 }}>
                      <code style={{ background: '#E8EDF7', padding: '2px 8px', borderRadius: 4, fontSize: 11, display: 'block' }}>C:\laragon\www\linx\linxapp\Linxapp.zip</code>
                    </div>
                  </li>
                  <li style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
                    Ativar o botão desta página.
                  </li>
                  <li style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
                    Quando o sistema abrir no servidor do cliente, ele irá substituir os arquivos que contém app para baixar e instalar além das atualizações normais dos pacotes do DVI-Linx.
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
