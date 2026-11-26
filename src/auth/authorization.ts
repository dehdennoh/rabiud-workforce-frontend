import { Permission, UserRole } from '../types';

export const roleDefinitions: Record<UserRole, { description: string; permissions: Permission[] }> = {
  Admin: {
    description: 'Full access to workforce operations and user access.',
    permissions: [
      'dashboard:view', 'companies:view', 'companies:manage', 'workers:view', 'workers:manage',
      'assignments:view', 'assignments:manage', 'attendance:view', 'attendance:manage',
'payroll:view', 'payroll:manage',
'invoices:view', 'invoices:manage',
'vat:view', 'vat:manage',
'documents:view', 'documents:manage',
'reports:view', 'users:manage',    ],
  },
  'Operations Manager': {
    description: 'Manage day-to-day staffing, sites, attendance, and payroll review.',
    permissions: [
      'dashboard:view', 'companies:view', 'companies:manage', 'workers:view', 'workers:manage',
      'assignments:view', 'assignments:manage', 'attendance:view', 'attendance:manage',
'payroll:view',
'invoices:view', 'invoices:manage',
'vat:view', 'vat:manage',
'documents:view', 'documents:manage', 'reports:view',
    ],
  },
  'HR Officer': {
    description: 'Manage worker records, assignments, attendance, and compliance documents.',
    permissions: [
      'dashboard:view', 'companies:view', 'workers:view', 'workers:manage', 'assignments:view',
      'assignments:manage', 'attendance:view', 'attendance:manage', 'payroll:view',
      'vat:view', 'documents:view', 'documents:manage', 'reports:view',
    ],
  },
  'Payroll Officer': {
    description: 'Review workforce details and manage payroll processing.',
    permissions: [
      'dashboard:view', 'workers:view', 'attendance:view', 'payroll:view', 'payroll:manage',
      'vat:view', 'vat:manage', 'documents:view', 'reports:view',
    ],
  },
  Supervisor: {
    description: 'View assigned workforce and record attendance.',
    permissions: [
      'dashboard:view', 'workers:view', 'assignments:view', 'attendance:view', 'attendance:manage', 'vat:view', 'reports:view',
    ],
  },
  Viewer: {
    description: 'Read-only access to workforce operations.',
    permissions: [
      'dashboard:view', 'companies:view', 'workers:view', 'assignments:view', 'attendance:view',
      'payroll:view', 'vat:view', 'documents:view', 'reports:view',
    ],
  },
};

export const hasPermission = (role: UserRole, permission: Permission) =>
  roleDefinitions[role].permissions.includes(permission);
