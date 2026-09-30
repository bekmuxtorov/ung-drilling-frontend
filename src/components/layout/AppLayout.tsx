import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileBadge,
  FileChartColumn,
  Info,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  Package,
  PanelLeft,
  Search,
  Settings,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { UngLogo } from '../common/UngLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { REFERENCES } from '../../features/references/config';

interface MenuLink {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface MenuGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  children: MenuLink[];
}

type MenuEntry = MenuLink | MenuGroup | 'divider';

const MENU: MenuEntry[] = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: 'gqi-minora', label: 'GQI (Minora montaji)', icon: Activity },
  { path: 'gqi-sinov', label: 'GQI (Sinov)', icon: ClipboardList },
  { path: 'gqi-burgulash', label: "GQI (Burg'ulash)", icon: TriangleAlert },
  'divider',
  { path: 'sb-burgulash', label: "SB (Burg'ulash)", icon: BriefcaseBusiness },
  { path: 'sb-minora', label: 'SB (Minora montaji)', icon: FileBadge },
  'divider',
  {
    key: 'references',
    label: "Ma'lumotnomalar",
    icon: Package,
    children: [
      ...REFERENCES.map((r) => ({ path: `references/${r.key}`, label: r.title, icon: r.icon })),
      { path: 'users', label: 'Foydalanuvchilar', icon: UserRound },
    ],
  },
  {
    key: 'reports',
    label: 'Hisobotlar',
    icon: FileChartColumn,
    children: [{ path: 'reports/fq-burgulash', label: "FQ (Burg'ulash)", icon: Map }],
  },
  { path: 'audit-log', label: 'Audit log', icon: Info },
];

const isGroup = (entry: MenuEntry): entry is MenuGroup => typeof entry === 'object' && 'children' in entry;

/** Joriy yo'l bo'yicha breadcrumb: ["Ma'lumotnomalar", "Tashkilotlar"] */
export const getBreadcrumbs = (path: string): string[] => {
  for (const entry of MENU) {
    if (entry === 'divider') continue;
    if (isGroup(entry)) {
      const child = entry.children.find((c) => c.path === path);
      if (child) return [entry.label, child.label];
    } else if (entry.path === path) return [entry.label];
  }
  return [];
};

interface AppLayoutProps {
  path: string;
  onNavigate: (path: string) => void;
  /** Ichki sahifalar uchun qo'shimcha breadcrumb (masalan operatsiya detali) */
  extraCrumbs?: string[];
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'ung_sidebar_collapsed';
const MOBILE_QUERY = '(max-width: 960px)';

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ path, onNavigate, extraCrumbs = [], children }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  // Yig'ilgan holat faqat desktopda; mobilda sidebar chiquvchi menyu bo'ladi
  const iconOnly = collapsed && !isMobile;
  const [userMenu, setUserMenu] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ references: true, reports: true });
  const searchRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Ctrl+K — global qidiruvga fokus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const close = (e: MouseEvent) => !userRef.current?.contains(e.target as Node) && setUserMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenu]);

  const go = (target: string) => {
    onNavigate(target);
    setMobileOpen(false);
  };

  const breadcrumbs = getBreadcrumbs(path);

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1');
      } catch {
        // Saqlash imkoni bo'lmasa ham ishlayveradi
      }
      return !prev;
    });

  // Yig'ilgan holatda nom tooltip sifatida ko'rsatiladi
  const tip = (label: string) => (iconOnly ? label : undefined);

  return (
    <div className={`layout ${iconOnly ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar__logo">
          <UngLogo size="sm" theme="banner" showText={!iconOnly} />
        </div>

        <nav className="sidebar__menu">
          {MENU.map((entry, i) => {
            if (entry === 'divider') return <div key={`d-${i}`} className="sidebar__divider" />;

            if (isGroup(entry)) {
              const open = openGroups[entry.key];
              const Icon = entry.icon;
              return (
                <div key={entry.key}>
                  <button
                    type="button"
                    className="menu-item"
                    title={tip(entry.label)}
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.key]: !prev[entry.key] }))}
                  >
                    <Icon size={15} />
                    <span className="menu-item__label">{entry.label}</span>
                    <ChevronDown size={14} className={`menu-item__chevron ${open ? '' : 'is-closed'}`} />
                  </button>
                  {open &&
                    entry.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.path}
                          type="button"
                          className={`menu-item menu-item--sub ${path === child.path ? 'is-active' : ''}`}
                          title={tip(child.label)}
                          onClick={() => go(child.path)}
                        >
                          <ChildIcon size={14} />
                          <span className="menu-item__label">{child.label}</span>
                        </button>
                      );
                    })}
                </div>
              );
            }

            const Icon = entry.icon;
            return (
              <button
                key={entry.path}
                type="button"
                className={`menu-item ${path === entry.path ? 'is-active' : ''}`}
                title={tip(entry.label)}
                onClick={() => go(entry.path)}
              >
                <Icon size={15} />
                <span className="menu-item__label">{entry.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar__bottom">
          <button
            type="button"
            className={`menu-item ${path === 'settings' ? 'is-active' : ''}`}
            title={tip('Sozlamalar')}
            onClick={() => go('settings')}
          >
            <Settings size={15} />
            <span className="menu-item__label">Sozlamalar</span>
          </button>
          <div className="sidebar__user" ref={userRef}>
            <button type="button" className="user-card" title={tip(user?.name ?? '')} onClick={() => setUserMenu((v) => !v)}>
              <span className="user-card__avatar">{user?.name?.[0] ?? 'U'}</span>
              <span className="user-card__meta">
                <span className="user-card__name">{user?.name}</span>
                <span className="user-card__role">{user?.roleName}</span>
              </span>
            </button>
            {userMenu && (
              <div className="dropdown dropdown--up">
                <button type="button" className="dropdown__item dropdown__item--danger" onClick={logout}>
                  <LogOut size={14} />
                  {t.dashboard.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="layout__main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__icon topbar__toggle"
            onClick={() => (isMobile ? setMobileOpen(true) : toggleCollapsed())}
            aria-label="Menyu"
          >
            <PanelLeft size={16} className="hide-mobile" />
            <Menu size={18} className="show-mobile" />
          </button>
          <span className="topbar__sep" />
          <nav className="topbar__crumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((c, i) => (
              <React.Fragment key={c}>
                {i > 0 && <ChevronRight size={12} />}
                {extraCrumbs.length > 0 && i === breadcrumbs.length - 1 ? (
                  <button type="button" className="topbar__crumb-link" onClick={() => onNavigate(path)}>
                    {c}
                  </button>
                ) : (
                  <span>{c}</span>
                )}
              </React.Fragment>
            ))}
            {extraCrumbs.map((c) => (
              <React.Fragment key={`x-${c}`}>
                <ChevronRight size={12} />
                <span>{c}</span>
              </React.Fragment>
            ))}
          </nav>

          <div className="topbar__right">
            <label className="global-search">
              <Search size={13} />
              <input ref={searchRef} placeholder="Quduq hududi va raqami bilan qidirish..." />
              <kbd>Ctrl K</kbd>
            </label>
            <button type="button" className="topbar__icon" aria-label="Bildirishnomalar">
              <Bell size={16} />
            </button>
            <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} variant="light" />
          </div>
        </header>

        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
};
