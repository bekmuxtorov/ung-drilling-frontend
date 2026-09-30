import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { UsersTablePanel } from './UsersTablePanel';
import { RolesTablePanel } from './RolesTablePanel';
import '../../styles/users.css';

interface UsersPageProps {
  initialTab?: 'users' | 'roles';
  onTabChange?: (tab: 'users' | 'roles') => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ initialTab = 'users', onTabChange }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab: 'users' | 'roles') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <div className="users-page">
      {/* Top Tabs Bar */}
      <div className="users-tabs-bar">
        <div className="users-tabs">
          <button
            type="button"
            className={`users-tab ${activeTab === 'users' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('users')}
          >
            <UserRound size={16} />
            <span>Foydalanuvchilar</span>
          </button>

          <button
            type="button"
            className={`users-tab ${activeTab === 'roles' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('roles')}
          >
            <ShieldCheck size={16} />
            <span>Rollar va Ruxsatlar</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' ? <UsersTablePanel /> : <RolesTablePanel />}
    </div>
  );
};
