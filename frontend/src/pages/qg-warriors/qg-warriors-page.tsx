import { useNavigate } from 'react-router-dom';

export default function QgWarriorsPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-eyebrow">Dashboard | QG Warriors</div>
          <div className="section-title">QG Warriors</div>
        </div>
        <button className="btn btn-sm" onClick={() => navigate('/dashboard')}
          style={{ background: 'rgba(32,66,148,.08)', color: '#204294', fontSize: 11, fontWeight: 700, padding: '5px 12px' }}>
          <i className="bi bi-arrow-left me-1" />Voltar ao Dashboard
        </button>
      </div>

      <div className="chart-card" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <i className="bi bi-dribbble" style={{ fontSize: 48, color: '#2F6FE4' }} aria-hidden="true" />
        <div style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ccm-ink)', marginTop: 12 }}>
          QG <span style={{ color: '#2F6FE4' }}>Warriors</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ccm-gray-dark)', marginTop: 8 }}>
          Área da Squad Warriors em construção.
        </div>
      </div>
    </>
  );
}
