import React from 'react';
import { UsersTablePanel } from './UsersTablePanel';
import { RolesTablePanel } from './RolesTablePanel';
import '../../styles/users.css';

interface UsersPageProps {
  /** Sidebar'dagi bo'lim: Foydalanuvchilar yoki Rollar va ruxsatlar */
  initialTab?: 'users' | 'roles';
}

export const UsersPage: React.FC<UsersPageProps> = ({ initialTab = 'users' }) =>
  initialTab === 'roles' ? <RolesTablePanel key="roles" /> : <UsersTablePanel key="users" />;
