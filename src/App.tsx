import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ReferencesPage } from './features/references/ReferencesPage';
import { UsersPage } from './features/users/UsersPage';
import { OperationsListPage } from './features/operations/OperationsListPage';
import { OperationDetailPage } from './features/operations/OperationDetailPage';
import { AppLayout, getBreadcrumbs } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/Toast';
import { useHashRoute } from './hooks/useHashRoute';
import { Construction, Loader2 } from 'lucide-react';
import './styles/app.css';
import './styles/operations.css';
import './styles/drilling.css';
import './styles/dashboard.css';
import './styles/daily-report.css';
import { DrillingListPage } from './features/drilling/DrillingListPage';
import { DrillingDetailPage } from './features/drilling/DrillingDetailPage';
import { DailyReportPage } from './features/drilling/DailyReportPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { tr } from './i18n';

const AuthenticatedApp: React.FC = () => {
  const { segments, navigate } = useHashRoute();
  const [section = 'dashboard', subSection] = segments;
  const path =
    section === 'references'
      ? `references/${subSection ?? 'enterprises'}`
      : section === 'gqi-minora'
        ? 'gqi-minora'
        : section === 'gqi-burgulash'
          ? 'gqi-burgulash'
          : section === 'daily-report'
            ? 'daily-report'
            : segments.join('/') || 'dashboard';
  const operationId = section === 'gqi-minora' && subSection ? Number(subSection) : NaN;
  const drillingId = section === 'gqi-burgulash' && subSection ? Number(subSection) : NaN;
  const extraCrumbs = Number.isFinite(operationId)
    ? [tr('Operatsiya #{0}', operationId)]
    : Number.isFinite(drillingId)
      ? [tr('BPA Pasporti #{0}', drillingId)]
      : [];

  let page: React.ReactNode;
  if (section === 'references') page = <ReferencesPage activeKey={subSection} />;
  else if (section === 'users')
    page = <UsersPage initialTab="users" />;
  else if (section === 'roles')
    page = <UsersPage initialTab="roles" />;
  else if (section === 'daily-report')
    page = (
      <DailyReportPage
        initialBpaId={subSection ? Number(subSection) : undefined}
        onNavigate={navigate}
      />
    );
  else if (section === 'gqi-minora')
    page = Number.isFinite(operationId) ? (
      <OperationDetailPage key={operationId} id={operationId} onBack={() => navigate('gqi-minora')} />
    ) : (
      <OperationsListPage onOpen={(id) => navigate(`gqi-minora/${id}`)} />
    );
  else if (section === 'gqi-burgulash')
    page = Number.isFinite(drillingId) ? (
      <DrillingDetailPage key={drillingId} id={drillingId} onBack={() => navigate('gqi-burgulash')} />
    ) : (
      <DrillingListPage onOpen={(id) => navigate(`gqi-burgulash/${id}`)} />
    );
  else if (section === 'dashboard') page = <div className="page-padded"><DashboardPage /></div>;
  else if (section === 'audit-log') page = <AuditLogPage />;
  else
    page = (
      <div className="placeholder">
        <Construction size={28} />
        <h3>{getBreadcrumbs(path).at(-1) ?? tr('Sahifa')}</h3>
        <p>{tr("Ushbu bo'lim ishlab chiqilmoqda")}</p>
      </div>
    );

  return (
    <AppLayout path={path} onNavigate={navigate} extraCrumbs={extraCrumbs}>
      {page}
    </AppLayout>
  );
};

const MainView: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#051426',
          color: '#FFFFFF',
          gap: '16px',
        }}
      >
        <Loader2 size={36} color="var(--ung-cyan-400)" className="animate-spin" />
        <span style={{ fontSize: '14px', letterSpacing: '0.05em', color: '#94A3B8' }}>
          {tr("UNG BURG'ILASH TIZIMI YUKLANMOQDA...")}</span>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <MainView />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
