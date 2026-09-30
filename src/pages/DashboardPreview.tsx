import React from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPreview: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const WELLS = [
    {
      id: 'UNG-W-104',
      name: 'Muborak #104',
      location: 'Qashqadaryo viloyati',
      depth: '4,870 m',
      target: '5,200 m',
      status: 'Aktiv burgilash',
      pressure: '280 bar',
      speed: '12.4 m/soat',
      statusColor: '#10B981',
    },
    {
      id: 'UNG-W-089',
      name: "Sho'rtan #89",
      location: 'Sho\'rtan konlar guruhi',
      depth: '3,920 m',
      target: '4,100 m',
      status: 'Kolonna tushirish',
      pressure: '245 bar',
      speed: '8.2 m/soat',
      statusColor: '#0066FF',
    },
    {
      id: 'UNG-W-112',
      name: 'Gazli #112',
      location: 'Buxoro viloyati',
      depth: '2,650 m',
      target: '3,500 m',
      status: 'Texnik tekshiruv',
      pressure: '190 bar',
      speed: '0.0 m/soat',
      statusColor: '#F59E0B',
    },
  ];

  return (
    <>
      {/* Main Container */}
      <div>
        {/* Welcome Banner */}
        <div
          style={{
            padding: '24px 30px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #0A2540 0%, #0052CC 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xl)',
            marginBottom: '32px',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ung-cyan-400)', fontWeight: 600 }}>
              <CheckCircle2 size={15} />
              <span>Avtorizatsiyadan muvaffaqiyatli o'tildi</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#FFFFFF' }}>
              {t.dashboard.welcome}, {user?.name}!
            </h2>
            <p style={{ fontSize: '14px', color: '#E2E8F0', marginTop: '4px' }}>
              {user?.department} • <strong>{user?.roleName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFFFF',
              color: 'var(--ung-primary-700)',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {t.dashboard.backToLogin}
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)' }}>
                {t.dashboard.activeWells}
              </span>
              <Activity size={20} color="var(--ung-primary-500)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              48 ta
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ung-emerald-500)', marginTop: '4px', fontWeight: 600 }}>
              ↑ 100% texnik barqaror
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)' }}>
                {t.dashboard.currentDepth}
              </span>
              <Layers size={20} color="var(--ung-cyan-500)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              4,870 m
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
              Maksimal chuqurlik: 5,640 m
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)' }}>
                {t.dashboard.dailyProgress}
              </span>
              <TrendingUp size={20} color="var(--ung-emerald-500)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              +142 m
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ung-emerald-500)', marginTop: '4px', fontWeight: 600 }}>
              Rejaga nisbatan 104.2%
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)' }}>
                {t.dashboard.safetyRate}
              </span>
              <ShieldCheck size={20} color="var(--ung-primary-500)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              99.8%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
              Hodisasiz 420 kun
            </div>
          </div>
        </div>

        {/* Wells Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--slate-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {t.dashboard.wellStatus}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Onlayn telemetrik ma'lumotlar oqimi
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)' }}>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Quduq nomi</th>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Hudud / Kon</th>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Hozirgi chuqurlik</th>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Bosim</th>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Tezlik</th>
                  <th style={{ padding: '12px 20px', color: 'var(--slate-600)', fontWeight: 600 }}>Holat</th>
                </tr>
              </thead>
              <tbody>
                {WELLS.map((well) => (
                  <tr key={well.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {well.name}
                      <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 400 }}>{well.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--slate-600)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--slate-400)" />
                        <span>{well.location}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--slate-800)' }}>
                      {well.depth} <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>/ {well.target}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--slate-700)' }}>{well.pressure}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--slate-700)' }}>{well.speed}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `${well.statusColor}15`,
                          color: well.statusColor,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: well.statusColor }} />
                        {well.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
