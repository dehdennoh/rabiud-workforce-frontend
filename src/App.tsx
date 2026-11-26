import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { roleDefinitions } from './auth/authorization';
import {
  Advance,
  ClientInvoice,
  Company,
  Payroll,
  Permission,
  User,
  UserRole,
  Worker,
} from './types';
import { useWorkforceData, WorkforceDataProvider } from './services/WorkforceDataProvider';
import { calculateInvoiceAmounts, calculateVatPeriodSummary } from './services/vatService';
import { supabase } from './lib/supabase';

const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString('en-KE')}`;

const companyValues = [
  'Professionalism',
  'Integrity',
  'Honesty',
  'Teamwork',
  'Respect for clients and workers',
  'Equality',
  'Efficient customer service and excellence',
];

function BrandLogo() {
  return <img className="brand-symbol" src="/rabiud-mark.png" alt="Rabiud Services logo" />;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', permission: 'dashboard:view' },
  { label: 'Workforce', path: '/workforce', permission: 'companies:view' },
  { label: 'Companies', path: '/companies', permission: 'companies:view' },
  { label: 'Workers', path: '/workers', permission: 'workers:view' },
  { label: 'Assignments', path: '/assignments', permission: 'assignments:view' },
  { label: 'Attendance', path: '/attendance', permission: 'attendance:view' },
  { label: 'Payroll', path: '/payroll', permission: 'payroll:view' },
  { label: 'Advances', path: '/advances', permission: 'payroll:view' },
  { label: 'Invoices', path: '/invoices', permission: 'invoices:view' },
  { label: 'VAT', path: '/vat', permission: 'vat:view' },
  { label: 'Documents', path: '/documents', permission: 'documents:view' },
  { label: 'Reports', path: '/reports', permission: 'reports:view' },
  { label: 'Users & access', path: '/users', permission: 'users:manage' },
];


function LoginPage({ onLogin }: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onLogin(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-layout">
        <section className="login-story" aria-label="About Rabiud Services">
          <div className="login-brand">
            <div className="brand-mark"><BrandLogo /></div>
            <div>
              <div className="brand-name">Rabiud Services (K) Limited</div>
              <small>Manpower suppliers &amp; real estate management</small>
            </div>
          </div>

          <div className="login-story-copy">
            <span className="login-kicker">People. Opportunity. Progress.</span>
            <h1>Connecting job seekers to a brighter future.</h1>
            <div className="login-purpose">
              <section>
                <h2>Our vision</h2>
                <p>To become the leading manpower suppliers in Kenya by linking job seekers to companies and employers.</p>
              </section>
              <section>
                <h2>Our mission</h2>
                <p>To promote improved livelihoods and wealth creation by creating employment opportunities for Kenyan youth.</p>
              </section>
            </div>
            <div className="login-values">
              <h2>Our core values</h2>
              <ul>
                {companyValues.map((value) => <li key={value}>{value}</li>)}
              </ul>
            </div>
          </div>
          <div className="login-story-footer">Professional workforce and property services in Kenya</div>
        </section>

        <section className="login-card">
          <div className="login-form-heading">
            <span className="login-form-kicker">Operations portal</span>
            <h2>Welcome back</h2>
            <p>Sign in to manage your workforce operations.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {error && <p className="form-feedback form-feedback-error" role="alert">{error}</p>}

            <button type="submit" className="primary-button full-width" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="login-support">Secure access for authorised Rabiud Services team members.</p>
        </section>
      </div>
    </div>
  );
}

function PermissionRoute({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <AccessDeniedPage />;
}

function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : null;
}

function AccessDeniedPage() {
  return (
    <section className="panel access-denied">
      <span className="eyebrow">Access restricted</span>
      <h2>You do not have permission to view this page.</h2>
      <p>Contact an administrator if you need access for your role.</p>
      <NavLink className="secondary-button" to="/dashboard">Return to dashboard</NavLink>
    </section>
  );
}

function StatCard({ label, value, accent, detail }: { label: string; value: string; accent: string; detail?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className={`stat-value ${accent}`}>{value}</strong>
      {detail && <small className="stat-detail">{detail}</small>}
    </div>
  );
}

function Layout({ children, onLogout, currentUser, users, onUserChange }: {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: User | null;
  users: User[];
  onUserChange: (userId: string) => void;
}) {
  const { can } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><BrandLogo /></div>
          <div>
            <div className="brand-name">Rabiud Services (K) Limited</div>
            <small>Workforce operations</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.filter((item) => can(item.permission as Permission)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <p className="eyebrow">Workforce operations</p>
            <h1>Dashboard</h1>
          </div>

          <div className="header-actions">
            <div className="live-indicator">
              <span className="live-dot" />
              Live operations
            </div>
            {can('workers:manage') && <button className="primary-button">+ Add worker</button>}
            <span className="user-pill">
  {currentUser?.role ?? 'Not signed in'}
</span>
            <button className="secondary-button" onClick={onLogout}>Logout</button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

function DashboardPage() {
  const { currentUser } = useAuth();
  const { attendance, companies, documents, payrollRows, workers } = useWorkforceData().data;
  const activeWorkers = workers.filter((worker) => worker.status === 'Active').length;
  const pendingPayroll = payrollRows.filter((row) => row.status === 'Pending').length;
  const documentsNeedingAttention = documents.filter((document) => document.status !== 'Valid').length;
  const approvedAttendance = attendance.filter((entry) => entry.status === 'Approved').length;
  const paidPayroll = payrollRows.filter((row) => row.status === 'Paid').length;
  const validDocuments = documents.filter((document) => document.status === 'Valid').length;
  const activeWorkforceRate = workers.length ? Math.round((activeWorkers / workers.length) * 100) : 0;
  const payrollReadiness = payrollRows.length ? Math.round((paidPayroll / payrollRows.length) * 100) : 0;
  const complianceHealth = documents.length ? Math.round((validDocuments / documents.length) * 100) : 0;

  return (
    <div className="page-space dashboard-page">
      <section className="dashboard-hero panel">
        <div className="hero-copy">
          <div className="hero-heading">
            <div>
              <span className="hero-kicker">Workforce operations</span>
              <h2>Welcome back, {currentUser?.name?.split(' ')[0] ?? 'User'}</h2>
            </div>
            <span className="hero-date">
              {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </span>
          </div>
          <p>Your teams, attendance, and payroll at a glance.</p>
        </div>

        <div className="hero-metrics">
          <div>
            <span>Active workforce</span>
            <strong>{activeWorkers}</strong>
          </div>
          <div>
            <span>Attendance approved</span>
            <strong>{approvedAttendance}</strong>
          </div>
          <div>
            <span>Payroll pending</span>
            <strong>{pendingPayroll}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total workers" value={String(workers.length)} accent="blue" detail={`${activeWorkers} currently active`} />
        <StatCard label="Active companies" value={String(companies.filter((company) => company.status === 'Active').length)} accent="green" detail="Across your operations" />
        <StatCard label="Payroll pending" value={String(pendingPayroll)} accent="amber" detail="Awaiting approval" />
        <StatCard label="Documents to review" value={String(documentsNeedingAttention)} accent="red" detail="Expired or expiring" />
      </section>

      <section className="dashboard-grid">
        <div className="panel overview-panel">
          <div className="panel-header">
            <h3>Operations snapshot</h3>
            <span className="tag">Live</span>
          </div>

          <div className="metric-stack">
            <div className="progress-row">
              <div className="row-copy">
                <strong>Active workforce</strong>
                <small>{activeWorkers} of {workers.length} workers active</small>
              </div>
              <span>{activeWorkforceRate}%</span>
            </div>
            <div className="progress-track"><span style={{ width: `${activeWorkforceRate}%` }} /></div>

            <div className="progress-row">
              <div className="row-copy">
                <strong>Payroll readiness</strong>
                <small>{paidPayroll} of {payrollRows.length} payroll records paid</small>
              </div>
              <span>{payrollReadiness}%</span>
            </div>
            <div className="progress-track"><span style={{ width: `${payrollReadiness}%` }} /></div>

            <div className="progress-row">
              <div className="row-copy">
                <strong>Compliance health</strong>
                <small>{validDocuments} of {documents.length} documents valid</small>
              </div>
              <span>{complianceHealth}%</span>
            </div>
            <div className="progress-track"><span style={{ width: `${complianceHealth}%` }} /></div>
          </div>
        </div>

        <div className="panel priority-panel">
          <div className="panel-header">
            <div>
              <h3>Needs attention</h3>
              <p className="panel-caption">Documents and payroll to review</p>
            </div>
            <span className="tag tag-warning">{documentsNeedingAttention + pendingPayroll} items</span>
          </div>

          <div className="priority-list">
            {documents.filter((document) => document.status !== 'Valid').map((document) => {
              const worker = workers.find((item) => item.id === document.workerId);
              return (
                <div className="priority-item" key={`document-${document.id}`}>
                  <strong>{worker?.name ?? 'Unknown worker'}</strong>
                  <small>{document.type} · {document.status}</small>
                </div>
              );
            })}
            {payrollRows.filter((row) => row.status === 'Pending').map((row) => {
              const worker = workers.find((item) => item.id === row.workerId);
              return (
                <div className="priority-item" key={`payroll-${row.id}`}>
                  <strong>{worker?.name ?? 'Unknown worker'}</strong>
                  <small>{row.period} payroll awaiting approval</small>
                </div>
              );
            })}
            {documentsNeedingAttention + pendingPayroll === 0 && (
              <p className="empty-state">Everything is up to date.</p>
            )}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Recent payroll</h3>
            <span className="tag">This month</span>
          </div>
          <div className="list-box">
            {payrollRows.map((row) => {
              const worker = workers.find((w) => w.id === row.workerId);
              return (
                <div key={row.id} className="list-row">
                  <div>
                    <strong>{worker?.name}</strong>
                    <small>{row.period}</small>
                  </div>
                  <div className="amount">{formatCurrency(row.netPay)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Alerts</h3>
            <span className="tag tag-warning">Needs attention</span>
          </div>
          <div className="list-box">
            {documents.filter((d) => d.status !== 'Valid').map((doc) => {
              const worker = workers.find((item) => item.id === doc.workerId);
              return (
                <div key={doc.id} className="list-row">
                  <div>
                    <strong>{worker?.name}</strong>
                    <small>{doc.type} • {doc.status}</small>
                  </div>
                  <span className="status-badge status-warning">{doc.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel quick-actions-panel">
        <div className="panel-header">
          <div>
            <h3>Quick actions</h3>
            <p className="panel-caption">Common workforce tasks</p>
          </div>
        </div>
        <div className="quick-actions-grid">
          <PermissionGate permission="workers:manage"><NavLink to="/workers" className="quick-action action-blue">
            <span className="quick-action-mark" aria-hidden="true">+</span>
            <span><strong>Register worker</strong><small>Add a team member</small></span>
          </NavLink></PermissionGate>
          <PermissionGate permission="attendance:manage"><NavLink to="/attendance" className="quick-action action-green">
            <span className="quick-action-mark" aria-hidden="true">&#10003;</span>
            <span><strong>Record attendance</strong><small>Review hours worked</small></span>
          </NavLink></PermissionGate>
          <PermissionGate permission="payroll:manage"><NavLink to="/payroll" className="quick-action action-red">
            <span className="quick-action-mark" aria-hidden="true">KSh</span>
            <span><strong>Review payroll</strong><small>Check pending payments</small></span>
          </NavLink></PermissionGate>
          <PermissionGate permission="documents:manage"><NavLink to="/documents" className="quick-action action-amber">
            <span className="quick-action-mark" aria-hidden="true">!</span>
            <span><strong>Check documents</strong><small>Review expiry alerts</small></span>
          </NavLink></PermissionGate>
        </div>
      </section>

      <section className="panel company-profile-panel">
        <div className="company-profile-heading">
          <div className="brand-mark"><BrandLogo /></div>
          <div>
            <span className="eyebrow">Our company</span>
            <h3>Rabiud Services (K) Limited</h3>
            <p>Manpower suppliers &amp; real estate management</p>
          </div>
        </div>
        <div className="company-profile-grid">
          <div>
            <h4>Our vision</h4>
            <p>To become the leading manpower suppliers in Kenya by linking job seekers to companies and employers.</p>
          </div>
          <div>
            <h4>Our mission</h4>
            <p>To promote improved livelihoods and wealth creation through creating employment opportunities for Kenyan youth.</p>
          </div>
          <div>
            <h4>Our core values</h4>
            <ul>{companyValues.map((value) => <li key={value}>{value}</li>)}</ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function CompaniesPage() {
  const { data, createCompany, updateCompany } = useWorkforceData();
  const { companies, workers } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [companyForm, setCompanyForm] = useState<Omit<Company, 'id'>>({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'Active',
  });
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredCompanies = companies.filter((company) =>
    [company.name, company.contact, company.phone, company.email]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );

  const startNewCompany = () => {
    setEditingCompanyId(null);
    setCompanyForm({ name: '', contact: '', phone: '', email: '', status: 'Active' });
    setFeedback('');
    setFormOpen(true);
  };

  const startEditingCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      contact: company.contact,
      phone: company.phone,
      email: company.email,
      status: company.status,
    });
    setFeedback('');
    setFormOpen(true);
  };

  const saveCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      ...companyForm,
      name: companyForm.name.trim(),
      contact: companyForm.contact.trim(),
      phone: companyForm.phone.trim(),
      email: companyForm.email.trim(),
    };
    try {
      if (editingCompanyId === null) {
        const company = await createCompany(values);
        setSearchQuery(company.name);
        setFeedback(`${company.name} was created.`);
      } else {
        const company = await updateCompany(editingCompanyId, values);
        setSearchQuery(company.name);
        setFeedback(`${company.name} was updated.`);
      }
      setFormOpen(false);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Unable to save company.');
    }
  };

  return (
    <div className="page-space">
      <PermissionGate permission="companies:manage">{formOpen && <div className="panel form-panel">
        <div className="panel-header">
          <h3>{editingCompanyId === null ? 'New company' : 'Edit company'}</h3>
          <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancel</button>
        </div>
        <form className="details-form" onSubmit={saveCompany}>
          <div className="form-grid">
            <label>
              Company name
              <input required type="text" value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} />
            </label>
            <label>
              Contact person
              <input required type="text" value={companyForm.contact} onChange={(event) => setCompanyForm({ ...companyForm, contact: event.target.value })} />
            </label>
            <label>
              Phone
              <input required type="tel" value={companyForm.phone} onChange={(event) => setCompanyForm({ ...companyForm, phone: event.target.value })} />
            </label>
            <label>
              Email
              <input required type="email" value={companyForm.email} onChange={(event) => setCompanyForm({ ...companyForm, email: event.target.value })} />
            </label>
            <label>
              Status
              <select value={companyForm.status} onChange={(event) => setCompanyForm({ ...companyForm, status: event.target.value as Company['status'] })}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <button type="submit" className="primary-button">{editingCompanyId === null ? 'Create company' : 'Save changes'}</button>
        </form>
      </div>}</PermissionGate>

      <div className="panel">
        <div className="panel-header">
          <h3>Companies</h3>
          <PermissionGate permission="companies:manage"><button type="button" className="primary-button" onClick={startNewCompany}>New company</button></PermissionGate>
        </div>
        {feedback && <p className="form-feedback" role="status">{feedback}</p>}
        <label className="search-control">
          <span>Search companies</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Company, contact, phone, or email"
          />
        </label>
        <div className="relationship-results" aria-live="polite">
          {filteredCompanies.length === 0 ? (
            <p className="search-empty">No companies match “{searchQuery}”.</p>
          ) : filteredCompanies.map((company) => {
            const companyWorkers = workers.filter((worker) => worker.companyId === company.id);
            return (
              <article className="relationship-result" key={company.id}>
                <div className="relationship-heading">
                  <div>
                    <h4>{company.name}</h4>
                    <p>Contact: {company.contact}</p>
                  </div>
                  <div className="relationship-actions">
                    <span className={`status-badge ${company.status === 'Active' ? 'status-ok' : 'status-warning'}`}>
                      {company.status}
                    </span>
                    <PermissionGate permission="companies:manage">
                      <button type="button" className="edit-button" onClick={() => startEditingCompany(company)}>Edit</button>
                    </PermissionGate>
                  </div>
                </div>
                <div className="relationship-meta">
                  <span><strong>Phone</strong>{company.phone}</span>
                  <span><strong>Email</strong>{company.email}</span>
                </div>
                <div className="related-workers">
                  <h5>Workers ({companyWorkers.length})</h5>
                  {companyWorkers.length === 0 ? (
                    <p className="search-empty">No workers are linked to this company.</p>
                  ) : companyWorkers.map((worker) => (
                    <div className="related-worker-row" key={worker.id}>
                      <div>
                        <strong>{worker.name}</strong>
                        <span>{worker.role} · {worker.status}</span>
                      </div>
                      <div>
                        <strong>{worker.phone}</strong>
                        <span>ID: {worker.nationalId}</span>
                      </div>
                      <div>
                        <strong>{formatCurrency(worker.payRate)} / {worker.payFrequency.toLowerCase()}</strong>
                        <span>{worker.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkersPage() {
  const { data, createWorker, updateWorker } = useWorkforceData();
  const { companies, workers } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Worker['status'] | 'All'>('Active');
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [workerForm, setWorkerForm] = useState<Omit<Worker, 'id'>>({
    name: '',
    phone: '',
    nationalId: '',
    role: '',
    companyId: companies[0]?.id ?? 0,
    payRate: 0,
    payFrequency: 'Daily',
    paymentMethod: 'Mobile Money',
    status: 'Active',
    advanceBalance: 0,
  });
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredWorkers = workers.filter((worker) => {
    if (statusFilter !== 'All' && worker.status !== statusFilter) {
      return false;
    }
    const company = companies.find((item) => item.id === worker.companyId);
    return [worker.name, worker.phone, worker.nationalId, worker.role, worker.status, company?.name ?? '']
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });

  const startNewWorker = () => {
    setEditingWorkerId(null);
    setWorkerForm({
      name: '',
      phone: '',
      nationalId: '',
      role: '',
      companyId: companies[0]?.id ?? 0,
      payRate: 0,
      payFrequency: 'Daily',
      paymentMethod: 'Mobile Money',
      status: 'Active',
      advanceBalance: 0,
    });
    setFeedback('');
    setFeedbackIsError(false);
    setFormOpen(true);
  };

  const startEditingWorker = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setWorkerForm({
      name: worker.name,
      phone: worker.phone,
      nationalId: worker.nationalId,
      role: worker.role,
      companyId: worker.companyId,
      payRate: worker.payRate,
      payFrequency: worker.payFrequency,
      paymentMethod: worker.paymentMethod,
      status: worker.status,
      advanceBalance: worker.advanceBalance,
    });
    setFeedback('');
    setFeedbackIsError(false);
    setFormOpen(true);
  };

  const changeWorkerStatus = async (worker: Worker) => {
    const nextStatus: Worker['status'] = worker.status === 'Active' ? 'Inactive' : 'Active';
    const action = nextStatus === 'Inactive' ? 'remove from the active workforce' : 'restore to the active workforce';
    const historyNote = nextStatus === 'Inactive'
      ? 'Their payroll and other historical records will be retained.'
      : 'They will appear in active workforce views again.';
    if (!window.confirm(`Are you sure you want to ${action} ${worker.name}? ${historyNote}`)) {
      return;
    }

    try {
      await updateWorker(worker.id, {
        name: worker.name,
        phone: worker.phone,
        nationalId: worker.nationalId,
        role: worker.role,
        companyId: worker.companyId,
        payRate: worker.payRate,
        payFrequency: worker.payFrequency,
        paymentMethod: worker.paymentMethod,
        status: nextStatus,
        advanceBalance: worker.advanceBalance,
      });
      setFeedbackIsError(false);
      setFeedback(nextStatus === 'Inactive'
        ? `${worker.name} was removed from the active workforce. Historical records were retained.`
        : `${worker.name} was restored to the active workforce.`);
      setStatusFilter('Active');
    } catch (cause) {
      setFeedbackIsError(true);
      setFeedback(cause instanceof Error ? cause.message : `Unable to ${action} ${worker.name}.`);
    }
  };

  const saveWorker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      ...workerForm,
      name: workerForm.name.trim(),
      phone: workerForm.phone.trim(),
      nationalId: workerForm.nationalId.trim(),
      role: workerForm.role.trim(),
    };
    try {
      if (editingWorkerId === null) {
        const worker = await createWorker(values);
        setSearchQuery(worker.name);
        setFeedback(`${worker.name} was registered.`);
      } else {
        const worker = await updateWorker(editingWorkerId, values);
        setSearchQuery(worker.name);
        setFeedback(`${worker.name} was updated.`);
      }
      setFormOpen(false);
      setFeedbackIsError(false);
    } catch (cause) {
      setFeedbackIsError(true);
      setFeedback(cause instanceof Error ? cause.message : 'Unable to save worker.');
    }
  };

  return (
    <div className="page-space">
      <PermissionGate permission="workers:manage">{formOpen && <div className="panel form-panel">
        <div className="panel-header">
          <h3>{editingWorkerId === null ? 'Register worker' : 'Edit worker'}</h3>
          <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancel</button>
        </div>
        <form className="details-form" onSubmit={saveWorker}>
          <div className="form-grid">
            <label>
              Full name
              <input required type="text" value={workerForm.name} onChange={(event) => setWorkerForm({ ...workerForm, name: event.target.value })} />
            </label>
            <label>
              Phone number
              <input required type="tel" value={workerForm.phone} onChange={(event) => setWorkerForm({ ...workerForm, phone: event.target.value })} />
            </label>
            <label>
              National ID
              <input required type="text" value={workerForm.nationalId} onChange={(event) => setWorkerForm({ ...workerForm, nationalId: event.target.value })} />
            </label>
            <label>
              Role
              <input required type="text" value={workerForm.role} onChange={(event) => setWorkerForm({ ...workerForm, role: event.target.value })} />
            </label>
            <label>
              Company
              <select required value={workerForm.companyId || ''} onChange={(event) => setWorkerForm({ ...workerForm, companyId: Number(event.target.value) })}>
                <option value="" disabled>Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </label>
            <label>
              Pay rate (KSh)
              <input required type="number" min="0" step="1" value={workerForm.payRate} onChange={(event) => setWorkerForm({ ...workerForm, payRate: Number(event.target.value) })} />
            </label>
            <label>
              Pay frequency
              <select value={workerForm.payFrequency} onChange={(event) => setWorkerForm({ ...workerForm, payFrequency: event.target.value as Worker['payFrequency'] })}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
            <label>
              Payment method
              <select value={workerForm.paymentMethod} onChange={(event) => setWorkerForm({ ...workerForm, paymentMethod: event.target.value as Worker['paymentMethod'] })}>
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
              </select>
            </label>
            <label>
              Status
              <select value={workerForm.status} onChange={(event) => setWorkerForm({ ...workerForm, status: event.target.value as Worker['status'] })}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              Advance balance (KSh)
              <input type="number" min="0" step="1" value={workerForm.advanceBalance} onChange={(event) => setWorkerForm({ ...workerForm, advanceBalance: Number(event.target.value) })} />
            </label>
          </div>
          <button type="submit" className="primary-button" disabled={companies.length === 0}>
            {editingWorkerId === null ? 'Register worker' : 'Save changes'}
          </button>
          {companies.length === 0 && <p className="form-note">Create a company before registering a worker.</p>}
        </form>
      </div>}</PermissionGate>

      <div className="panel">
        <div className="panel-header">
          <h3>Workers</h3>
          <PermissionGate permission="workers:manage"><button type="button" className="primary-button" onClick={startNewWorker}>Register worker</button></PermissionGate>
        </div>
        {feedback && <p className={`form-feedback ${feedbackIsError ? 'form-feedback-error' : ''}`} role={feedbackIsError ? 'alert' : 'status'}>{feedback}</p>}
        <div className="worker-list-filters">
          <label className="search-control">
            <span>Search workers</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, phone, national ID, role, or company"
            />
          </label>
          <label className="search-control">
            <span>Worker status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Worker['status'] | 'All')}>
              <option value="Active">Active workers</option>
              <option value="Inactive">Removed workers</option>
              <option value="All">All workers</option>
            </select>
          </label>
        </div>
        <div className="relationship-results" aria-live="polite">
          {filteredWorkers.length === 0 ? (
            <p className="search-empty">No workers match “{searchQuery}”.</p>
          ) : filteredWorkers.map((worker) => {
            const company = companies.find((item) => item.id === worker.companyId);
            return (
              <article className="relationship-result worker-result" key={worker.id}>
                <div className="relationship-heading">
                  <div>
                    <h4>{worker.name}</h4>
                    <p>{worker.role} · {worker.status}</p>
                  </div>
                  <div className="relationship-actions">
                    <span className={`status-badge ${worker.status === 'Active' ? 'status-ok' : 'status-warning'}`}>
                      {worker.status}
                    </span>
                    <PermissionGate permission="workers:manage">
                      <button type="button" className="edit-button" onClick={() => startEditingWorker(worker)}>Edit</button>
                      <button
                        type="button"
                        className={worker.status === 'Active' ? 'remove-button' : 'restore-button'}
                        onClick={() => void changeWorkerStatus(worker)}
                      >
                        {worker.status === 'Active' ? 'Remove' : 'Restore'}
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                <div className="relationship-meta worker-meta">
                  <span><strong>Phone</strong>{worker.phone}</span>
                  <span><strong>National ID</strong>{worker.nationalId}</span>
                  <span><strong>Pay rate</strong>{formatCurrency(worker.payRate)} / {worker.payFrequency.toLowerCase()}</span>
                  <span><strong>Payment method</strong>{worker.paymentMethod}</span>
                  <span><strong>Advance balance</strong>{formatCurrency(worker.advanceBalance)}</span>
                </div>
                <div className="worker-company">
                  <h5>Company</h5>
                  {company ? (
                    <div className="relationship-meta">
                      <span><strong>Name</strong>{company.name}</span>
                      <span><strong>Contact</strong>{company.contact}</span>
                      <span><strong>Phone</strong>{company.phone}</span>
                      <span><strong>Email</strong>{company.email}</span>
                    </div>
                  ) : <p className="search-empty">No company is linked to this worker.</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkforcePage() {
  const { companies, workers } = useWorkforceData().data;
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredCompanies = companies.map((company) => ({
    company,
    workers: workers.filter((worker) => worker.companyId === company.id),
  })).filter(({ company, workers: companyWorkers }) => {
    if (!normalizedQuery) {
      return true;
    }
    return [company.name, company.contact, company.phone, company.email, ...companyWorkers.flatMap((worker) => [
      worker.name, worker.phone, worker.nationalId, worker.role,
    ])].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });

  return (
    <div className="page-space">
      <section className="panel workforce-intro">
        <div>
          <span className="eyebrow">Combined directory</span>
          <h2>Companies and workers</h2>
          <p>Search a company to see its team, or search a worker to see their company.</p>
        </div>
        <div className="workforce-counts">
          <div><strong>{companies.length}</strong><span>Companies</span></div>
          <div><strong>{workers.length}</strong><span>Workers</span></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Workforce directory</h3>
            <p className="panel-caption">Company contacts and linked worker profiles in one view.</p>
          </div>
          <span className="tag">{filteredCompanies.length} companies</span>
        </div>
        <label className="search-control">
          <span>Search companies or workers</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Company, worker, phone, ID, role, or email"
          />
        </label>

        <div className="relationship-results" aria-live="polite">
          {filteredCompanies.length === 0 ? (
            <p className="search-empty">No companies or workers match “{searchQuery}”.</p>
          ) : filteredCompanies.map(({ company, workers: companyWorkers }) => (
            <article className="relationship-result" key={company.id}>
              <div className="relationship-heading">
                <div>
                  <h4>{company.name}</h4>
                  <p>{company.contact} · {company.phone} · {company.email}</p>
                </div>
                <div className="relationship-actions">
                  <span className={`status-badge ${company.status === 'Active' ? 'status-ok' : 'status-warning'}`}>{company.status}</span>
                  <NavLink className="edit-button" to="/companies">Company details</NavLink>
                </div>
              </div>
              <div className="related-workers">
                <h5>Workers ({companyWorkers.length})</h5>
                {companyWorkers.length === 0 ? (
                  <p className="search-empty">No workers are linked to this company.</p>
                ) : companyWorkers.map((worker) => (
                  <div className="related-worker-row" key={worker.id}>
                    <div>
                      <strong>{worker.name}</strong>
                      <span>{worker.role} · {worker.status}</span>
                    </div>
                    <div>
                      <strong>{worker.phone}</strong>
                      <span>National ID: {worker.nationalId}</span>
                    </div>
                    <div>
                      <strong>{formatCurrency(worker.payRate)} / {worker.payFrequency.toLowerCase()}</strong>
                      <span>{worker.paymentMethod} · Advance {formatCurrency(worker.advanceBalance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AssignmentsPage() {
  const {
    data: { assignments, companies, workers },
    createAssignment,
  } = useWorkforceData();

  const [assignmentWorkerId, setAssignmentWorkerId] = useState('');
  const [assignmentCompanyId, setAssignmentCompanyId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('');
  const [assignmentStartDate, setAssignmentStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const saveAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!assignmentWorkerId || !assignmentCompanyId || !assignmentRole.trim()) {
    alert('Please select a worker, company, and enter a role.');
    return;
  }

  setAssignmentSaving(true);

  try {
    await createAssignment({
      workerId: Number(assignmentWorkerId),
      companyId: Number(assignmentCompanyId),
      role: assignmentRole.trim(),
      startDate: assignmentStartDate,
      endDate: undefined,
      status: 'Active',
    });

    setAssignmentWorkerId('');
    setAssignmentCompanyId('');
    setAssignmentRole('');
    setAssignmentStartDate(new Date().toISOString().slice(0, 10));

    alert('Assignment created successfully.');
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Unable to create assignment.'
    );
  } finally {
    setAssignmentSaving(false);
  }
};
  return (
    <div className="page-space">
      <PermissionGate permission="assignments:manage"><div className="panel form-panel">
        <div className="panel-header">
          <h3>Assignment form</h3>
        </div>

       
<form className="details-form" onSubmit={saveAssignment}>
  <div className="form-grid">
    <label>
      Worker
      <select
        value={assignmentWorkerId}
        onChange={(event) => setAssignmentWorkerId(event.target.value)}
        required
      >
        <option value="">Select worker</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.name}
          </option>
        ))}
      </select>
    </label>

    <label>
      Company
      <select
        value={assignmentCompanyId}
        onChange={(event) => setAssignmentCompanyId(event.target.value)}
        required
      >
        <option value="">Select company</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>

    <label>
      Job role
      <input
        type="text"
        value={assignmentRole}
        onChange={(event) => setAssignmentRole(event.target.value)}
        placeholder="e.g. Electrician, Mason, Security Guard"
        required
      />
    </label>

    <label>
      Start date
      <input
        type="date"
        value={assignmentStartDate}
        onChange={(event) => setAssignmentStartDate(event.target.value)}
        required
      />
    </label>
  </div>

  <button
    type="submit"
    className="primary-button"
    disabled={
      assignmentSaving ||
      workers.length === 0 ||
      companies.length === 0
    }
  >
    {assignmentSaving ? 'Saving assignment...' : 'Create assignment'}
  </button>

  {(workers.length === 0 || companies.length === 0) && (
    <p className="form-note">
      You must register at least one worker and one company before creating an assignment.
    </p>
  )}
</form>

      </div></PermissionGate>

      <div className="panel">
        <div className="panel-header">
          <h3>Assignments</h3>
          <PermissionGate permission="assignments:manage"><button className="secondary-button">Assign worker</button></PermissionGate>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Company</th>
                <th>Role</th>
                <th>Start date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const worker = workers.find((item) => item.id === assignment.workerId);
                const company = companies.find((item) => item.id === assignment.companyId);
                return (
                  <tr key={assignment.id}>
                    <td>{worker?.name ?? 'Unassigned worker'}</td>
                    <td>{company?.name}</td>
                    <td>{assignment.role}</td>
                    <td>{assignment.startDate}</td>
                    <td><span className={`status-badge ${assignment.status === 'Active' ? 'status-ok' : 'status-warning'}`}>{assignment.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendancePage() {
  const {
  data: { attendance, workers },
  createAttendance,
  approveAttendance,
} = useWorkforceData();;

  const [attendanceWorkerId, setAttendanceWorkerId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [hoursWorked, setHoursWorked] = useState('8');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const saveAttendance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!attendanceWorkerId) {
      alert('Please select a worker.');
      return;
    }

    setAttendanceSaving(true);

    try {
      await createAttendance({
        workerId: Number(attendanceWorkerId),
        date: attendanceDate,
        hoursWorked: Number(hoursWorked),
        overtimeHours: Number(overtimeHours),
        status: 'Pending',
      });

      alert('Attendance recorded successfully.');
      setAttendanceWorkerId('');
      setHoursWorked('8');
      setOvertimeHours('0');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save attendance.');
    } finally {
      setAttendanceSaving(false);
    }
  };
  return (
    <div className="page-space">
      <PermissionGate permission="attendance:manage"><div className="panel form-panel">
        <div className="panel-header">
          <h3>Attendance entry</h3>
        </div>

      <form className="details-form" onSubmit={saveAttendance}>
  <div className="form-grid">
    <label>
      Worker
      <select
        value={attendanceWorkerId}
        onChange={(e) => setAttendanceWorkerId(e.target.value)}
        required
      >
        <option value="">Select worker</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.name}
          </option>
        ))}
      </select>
    </label>

    <label>
      Date
      <input
        type="date"
        value={attendanceDate}
        onChange={(e) => setAttendanceDate(e.target.value)}
        required
      />
    </label>

    <label>
      Hours worked
      <input
        type="number"
        min="0"
        step="0.5"
        value={hoursWorked}
        onChange={(e) => setHoursWorked(e.target.value)}
        required
      />
    </label>

    <label>
      Overtime
      <input
        type="number"
        min="0"
        step="0.5"
        value={overtimeHours}
        onChange={(e) => setOvertimeHours(e.target.value)}
        required
      />
    </label>
  </div>

  <button
    type="submit"
    className="primary-button"
    disabled={attendanceSaving || workers.length === 0}
  >
    {attendanceSaving ? 'Saving...' : 'Record attendance'}
  </button>
</form>
      </div></PermissionGate>

      <div className="panel">
        <div className="panel-header">
          <h3>Attendance</h3>
          <PermissionGate permission="attendance:manage"><button className="secondary-button">Log hours</button></PermissionGate>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Date</th>
                <th>Hours</th>
               <th>OT</th>
               <th>Status</th>
               <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((entry) => {
                const worker = workers.find((item) => item.id === entry.workerId);
                return (
                  <tr key={entry.id}>
                    <td>{worker?.name}</td>
                    <td>{entry.date}</td>
                    <td>{entry.hoursWorked}</td>
                    <td>{entry.overtimeHours}</td>
<td>
  <span className="status-badge status-ok">{entry.status}</span>
</td>
<td>
  {entry.status === 'Pending' && (
    <PermissionGate permission="attendance:manage">
      <button
        className="primary-button"
        onClick={async () => {
          try {
            await approveAttendance(entry.id);
            alert('Attendance approved successfully.');
          } catch (error) {
            alert(
              error instanceof Error
                ? error.message
                : 'Unable to approve attendance.',
            );
          }
        }}
      >
        Approve
      </button>
    </PermissionGate>
  )}
</td>                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



function PayrollPage() {
  const { data, generatePayroll, recordPayrollPayment } = useWorkforceData();
  const { payrollRows, workers, companies } = data;

  const [period, setPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const totalGross = payrollRows.reduce(
    (total, row) => total + row.grossPay + row.overtimePay,
    0,
  );

  const totalAdvances = payrollRows.reduce(
    (total, row) => total + row.advances,
    0,
  );

  const totalDeductions = payrollRows.reduce(
    (total, row) => total + row.deductions,
    0,
  );

  const totalNet = payrollRows.reduce(
    (total, row) => total + row.netPay,
    0,
  );

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setMessage('');

    try {
      const generated = await generatePayroll(period);
      setMessage(
        generated.length > 0
          ? `Successfully generated payroll for ${generated.length} worker(s).`
          : 'No new payroll generated. Check approved attendance or whether payroll already exists for this period.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Payroll generation failed.',
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleRecordPayment = async (id: number) => {
    if (!paymentDate || !paymentMethod) {
      setMessage('Please enter the payment date and method.');
      return;
    }

    setSavingPayment(true);
    setMessage('');

    try {
      await recordPayrollPayment(id, {
        paymentDate,
        paymentMethod,
        transactionReference,
        paymentNotes,
      });

      setMessage('Payroll payment recorded successfully.');
      setSelectedPayrollId(null);
      setTransactionReference('');
      setPaymentNotes('');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not record payment.',
      );
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="page-space">
      <div className="panel form-panel">
        <div className="panel-header">
          <h3>Payroll summary</h3>
        </div>

        <div className="summary-box">
          <div>
            <span>Gross pay</span>
            <strong>{formatCurrency(totalGross)}</strong>
          </div>
          <div>
            <span>Advances</span>
            <strong>{formatCurrency(totalAdvances)}</strong>
          </div>
          <div>
            <span>Deductions</span>
            <strong>{formatCurrency(totalDeductions)}</strong>
          </div>
          <div>
            <span>Net pay</span>
            <strong>{formatCurrency(totalNet)}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Payroll</h3>
            <p className="panel-caption">
              Select a month to generate payroll from approved attendance.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Payroll period
            <input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </label>

          <div>
            <PermissionGate permission="payroll:manage">
              <button
                type="button"
                className="primary-button"
                onClick={handleGeneratePayroll}
                disabled={generating || !period}
              >
                {generating ? 'Generating...' : 'Generate payroll'}
              </button>
            </PermissionGate>
          </div>
        </div>

        {message && (
          <p className="form-note" role="status">
            {message}
          </p>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Period</th>
                <th>Gross</th>
                <th>Overtime</th>
                <th>Advances</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((row) => {
                const worker = workers.find(
                  (item) => item.id === row.workerId,
                );

                return (
                  <>
                    <tr key={row.id}>
                      <td>{worker?.name ?? `Worker #${row.workerId}`}</td>
                      <td>{row.period}</td>
                      <td>{formatCurrency(row.grossPay)}</td>
                      <td>{formatCurrency(row.overtimePay)}</td>
                      <td>{formatCurrency(row.advances)}</td>
                      <td>{formatCurrency(row.deductions)}</td>
                      <td>{formatCurrency(row.netPay)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            row.status === 'Paid'
                              ? 'status-success'
                              : 'status-warning'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        {row.status === 'Pending' ? (
                          <PermissionGate permission="payroll:manage">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => {
                                setSelectedPayrollId(
                                  selectedPayrollId === row.id ? null : row.id,
                                );
                                setMessage('');
                              }}
                            >
                              {selectedPayrollId === row.id
                                ? 'Close'
                                : 'Record payment'}
                            </button>
                          </PermissionGate>
                        ) : (
                          <span>
                            {row.paymentMethod ?? 'Paid'}
                            {row.paymentDate
                              ? ` (${row.paymentDate})`
                              : ''}
                          </span>
                        )}
                      </td>
                      <td>
  <button
    type="button"
    className="primary-button"
    onClick={() =>
      printPayslip(
        row,
        workers.find((item) => item.id === row.workerId),
        companies.find(
          (company) =>
            company.id ===
            workers.find((item) => item.id === row.workerId)?.companyId,
        ),
      )
    }
  >
    Print payslip
  </button>

</td>
                    </tr>

                    {selectedPayrollId === row.id && row.status === 'Pending' && (
                      <tr key={`${row.id}-payment`}>
                        <td colSpan={10}>
                          <div className="form-grid">
                            <label>
                              Payment date
                              <input
                                type="date"
                                value={paymentDate}
                                onChange={(event) =>
                                  setPaymentDate(event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Payment method
                              <select
                                value={paymentMethod}
                                onChange={(event) =>
                                  setPaymentMethod(event.target.value)
                                }
                              >
                                <option value="M-Pesa">M-Pesa</option>
                                <option value="Bank">Bank transfer</option>
                                <option value="Cash">Cash</option>
                              </select>
                            </label>

                            <label>
                              Transaction reference
                              <input
                                type="text"
                                value={transactionReference}
                                onChange={(event) =>
                                  setTransactionReference(event.target.value)
                                }
                                placeholder="e.g. M-Pesa transaction code"
                              />
                            </label>

                            <label>
                              Payment notes
                              <input
                                type="text"
                                value={paymentNotes}
                                onChange={(event) =>
                                  setPaymentNotes(event.target.value)
                                }
                                placeholder="Optional notes"
                              />
                            </label>

                            <div>
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() => handleRecordPayment(row.id)}
                                disabled={savingPayment}
                              >
                                {savingPayment ? 'Saving...' : 'Confirm payment'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {payrollRows.length === 0 && (
                <tr>
                  <td colSpan={9}>No payroll records available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function printPayslip(
  row: Payroll,
  worker: Worker | undefined,
  company: Company | undefined,
) {
  if (!worker) {
    alert('Worker details could not be found.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('Please allow pop-ups to print the payslip.');
    return;
  }

  const money = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: row.currency || 'KES',
    }).format(amount);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payslip - ${worker.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 35px; color: #222; }
          .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 15px; }
          h1 { margin-bottom: 5px; }
          .details { margin: 25px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 12px; text-align: left; }
          th { background: #f2f2f2; }
          .net { font-size: 20px; font-weight: bold; margin-top: 25px; text-align: right; }
          .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${company?.name ?? 'Company Payslip'}</h1>
          <p>${company?.email ?? ''} ${company?.phone ?? ''}</p>
          <h2>EMPLOYEE PAYSLIP</h2>
          <p>Payroll period: ${row.period}</p>
        </div>

        <div class="details">
          <div><strong>Employee:</strong> ${worker.name}</div>
          <div><strong>National ID:</strong> ${worker.nationalId}</div>
          <div><strong>Phone:</strong> ${worker.phone}</div>
          <div><strong>Role:</strong> ${worker.role}</div>
          <div><strong>Payment status:</strong> ${row.status}</div>
          <div><strong>Payment date:</strong> ${row.paymentDate ?? 'Not recorded'}</div>
          <div><strong>Payment method:</strong> ${row.paymentMethod ?? 'Not recorded'}</div>
          <div><strong>Transaction reference:</strong> ${row.transactionReference ?? 'Not recorded'}</div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Gross pay</td><td>${money(row.grossPay)}</td></tr>
            <tr><td>Overtime pay</td><td>${money(row.overtimePay)}</td></tr>
            <tr><td>Advances</td><td>${money(row.advances)}</td></tr>
            <tr><td>Other deductions</td><td>${money(row.deductions)}</td></tr>
          </tbody>
        </table>

        <div class="net">NET PAY: ${money(row.netPay)}</div>

        <div class="footer">
          <p>This payslip was generated electronically.</p>
          <p>${company?.name ?? 'Company'}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}


function printInvoice(invoice: ClientInvoice, company: Company | undefined) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('Please allow pop-ups to print the invoice.');
    return;
  }

  const escapeHtml = (value: string | number) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const amounts = calculateInvoiceAmounts(invoice);
  const amountReceived = invoice.payments.reduce(
    (sum, payment) => sum + payment.amountReceived,
    0,
  );
  const outstanding = Math.max(0, amounts.total - amountReceived);
  const money = (amount: number) => formatCurrency(amount);
  const lineRows = invoice.lines.map((line) => `
    <tr>
      <td>${escapeHtml(line.description)}</td>
      <td>${escapeHtml(line.category)}</td>
      <td>${line.taxable ? `${line.vatRatePercent}%` : 'Zero-rated'}</td>
      <td class="amount">${money(line.amount)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; color: #172033; font-family: Arial, sans-serif; }
          .document { max-width: 900px; margin: 0 auto; }
          .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #244b78; padding-bottom: 18px; }
          .brand h1 { margin: 0 0 5px; font-size: 22px; }
          .brand p { margin: 3px 0; color: #526176; font-size: 13px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0 0 8px; color: #244b78; font-size: 28px; }
          .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 24px 0; }
          .party-grid h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #526176; }
          .party-grid p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #244b78; color: white; text-align: left; padding: 10px 8px; font-size: 12px; }
          td { border-bottom: 1px solid #dce2ea; padding: 10px 8px; font-size: 13px; }
          .amount { text-align: right; white-space: nowrap; }
          .totals { width: 330px; margin-left: auto; margin-top: 18px; }
          .totals div { display: flex; justify-content: space-between; padding: 7px 0; }
          .totals .grand-total { border-top: 2px solid #244b78; margin-top: 5px; padding-top: 12px; font-size: 18px; font-weight: bold; }
          .footer { border-top: 1px solid #dce2ea; margin-top: 36px; padding-top: 12px; color: #526176; font-size: 11px; text-align: center; }
          @media print { body { padding: 12mm; } }
        </style>
      </head>
      <body>
        <main class="document">
          <div class="brand">
            <div>
              <h1>Rabiud Services (K) Limited</h1>
              <p>Manpower suppliers &amp; real estate management</p>
            </div>
            <div class="invoice-title">
              <h2>TAX INVOICE</h2>
              <p><strong>Invoice:</strong> ${escapeHtml(invoice.invoiceNumber)}</p>
              <p><strong>Date:</strong> ${escapeHtml(invoice.issuedAt)}</p>
            </div>
          </div>

          <div class="party-grid">
            <section>
              <h3>Bill to</h3>
              <p><strong>${escapeHtml(company?.name ?? 'Unknown client')}</strong></p>
              <p>${escapeHtml(company?.contact ?? '')}</p>
              <p>${escapeHtml(company?.email ?? '')}</p>
              <p>${escapeHtml(company?.phone ?? '')}</p>
            </section>
            <section>
              <h3>Invoice status</h3>
              <p><strong>${escapeHtml(invoice.status)}</strong></p>
              ${invoice.etimsControlNumber ? `<p><strong>eTIMS control:</strong> ${escapeHtml(invoice.etimsControlNumber)}</p>` : ''}
            </section>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>VAT</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>${lineRows}</tbody>
          </table>

          <div class="totals">
            <div><span>Taxable value</span><strong>${money(amounts.taxableValue)}</strong></div>
            <div><span>Non-taxable value</span><strong>${money(amounts.nonTaxableValue)}</strong></div>
            <div><span>VAT</span><strong>${money(amounts.outputVat)}</strong></div>
            <div class="grand-total"><span>Invoice total</span><span>${money(amounts.total)}</span></div>
            <div><span>Amount received</span><strong>${money(amountReceived)}</strong></div>
            <div><span>Outstanding balance</span><strong>${money(outstanding)}</strong></div>
          </div>

          <div class="footer">
            <p>Thank you for your business.</p>
            <p>This invoice was generated by Rabiud Services (K) Limited.</p>
          </div>
        </main>
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `);

  printWindow.document.close();
}


function VatPage() {
  const { companies, invoices, inputVatPurchases } = useWorkforceData().data;
  const [period, setPeriod] = useState('2026-10');
  const [filingStatus, setFilingStatus] = useState('Draft');
  const [periodYear, periodMonth] = period.split('-').map(Number);
  const periodStart = `${period}-01`;
  const periodEnd = new Date(Date.UTC(periodYear, periodMonth, 0)).toISOString().slice(0, 10);
  const summary = calculateVatPeriodSummary(invoices, inputVatPurchases, periodStart, periodEnd);
  const invoiceRows = invoices
    .filter((invoice) => invoice.status === 'Issued' && invoice.issuedAt >= periodStart && invoice.issuedAt <= periodEnd)
    .map((invoice) => ({
      invoice,
      company: companies.find((company) => company.id === invoice.companyId),
      amounts: calculateInvoiceAmounts(invoice),
    }));

  return (
    <div className="page-space">
      <section className="panel vat-intro">
        <div>
          <span className="eyebrow">Tax workspace</span>
          <h2>VAT return preparation</h2>
          <p>Review issued client invoices and eligible input VAT for the selected period.</p>
        </div>
        <div className="vat-controls">
          <label>
            Filing period
            <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Filing period" />
          </label>
          <label>
            Status
            <select value={filingStatus} onChange={(event) => setFilingStatus(event.target.value)} aria-label="Filing status">
              <option>Draft</option>
              <option>Ready to file</option>
              <option>Filed</option>
            </select>
          </label>
        </div>
      </section>

      <div className="vat-summary-grid">
        <StatCard label="Taxable value" value={formatCurrency(summary.taxableValue)} accent="blue" detail={period} />
        <StatCard label="Output VAT" value={formatCurrency(summary.outputVat)} accent="green" detail="Issued invoices" />
        <StatCard label="Input VAT" value={formatCurrency(summary.inputVat)} accent="amber" detail="Eligible purchases" />
        <StatCard label="Net VAT payable" value={formatCurrency(summary.netVatPayable)} accent="red" detail={`Withheld: ${formatCurrency(summary.vatWithheld)}`} />
        <StatCard label="Invoiced but unpaid" value={formatCurrency(summary.invoicedButUnpaid)} accent="blue" detail="Outstanding invoice balance" />
        <StatCard label="Filing status" value={filingStatus} accent="red" detail="Current return" />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Issued client invoices</h3>
            <p className="panel-caption">Invoice values include wages, employer statutory costs, and fees as individually classified on each line.</p>
          </div>
          <PermissionGate permission="vat:manage"><button type="button" className="primary-button" onClick={() => setFilingStatus('Ready to file')}>Mark ready to file</button></PermissionGate>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Company</th>
                <th>Taxable value</th>
                <th>Output VAT</th>
                <th>Invoice total</th>
                <th>VAT withheld</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map(({ invoice, company, amounts }) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.invoiceNumber}</strong><small>{invoice.issuedAt}</small></td>
                  <td>{company?.name ?? `Company #${invoice.companyId}`}</td>
                  <td>{formatCurrency(amounts.taxableValue)}</td>
                  <td>{formatCurrency(amounts.outputVat)}</td>
                  <td>{formatCurrency(amounts.total)}</td>
                  <td>{formatCurrency(invoice.payments
                    .filter((payment) => payment.date >= periodStart && payment.date <= periodEnd)
                    .reduce((total, payment) => total + payment.vatWithheldAmount, 0))}</td>
                </tr>
              ))}
              {invoiceRows.length === 0 && <tr><td colSpan={6}>No issued invoices for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <p className="form-note">Employee deductions are excluded from client invoice lines. Taxable line treatment and input VAT eligibility must be confirmed with your accountant or KRA; only valid issued invoices and approved eligible purchase VAT are included.</p>
    </div>
  );
}

function AdvancesPage() {
  const { data, createAdvance, updateAdvanceStatus } = useWorkforceData();
  const { advances, workers } = data;

  const [workerId, setWorkerId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPending = advances
    .filter((item) => item.status === 'Pending')
    .reduce((total, item) => total + item.amount, 0);

  const totalApproved = advances
    .filter((item) => item.status === 'Approved')
    .reduce((total, item) => total + item.amount, 0);

  const handleCreateAdvance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await createAdvance({
        workerId: Number(workerId),
        amount: Number(amount),
        date,
        reason: reason.trim(),
        approvedBy: 'Pending',
        status: 'Pending',
      });

      setWorkerId('');
      setAmount('');
      setReason('');
      setMessage('Advance request recorded successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not record advance.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    id: number,
    status: Advance['status'],
  ) => {
    setMessage('');

    try {
      await updateAdvanceStatus(
        id,
        status,
        status === 'Approved' ? 'Admin' : undefined,
      );
      setMessage(`Advance ${status.toLowerCase()} successfully.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not update advance.',
      );
    }
  };

  return (
    <div className="page-space">
      <div className="panel form-panel">
        <div className="panel-header">
          <h3>Advances summary</h3>
        </div>

        <div className="summary-box">
          <div>
            <span>Total requests</span>
            <strong>{advances.length}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>{formatCurrency(totalPending)}</strong>
          </div>
          <div>
            <span>Approved</span>
            <strong>{formatCurrency(totalApproved)}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Record advance request</h3>
            <p className="panel-caption">
              Record an advance requested by a worker.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAdvance}>
          <div className="form-grid">
            <label>
              Worker
              <select
                value={workerId}
                onChange={(event) => setWorkerId(event.target.value)}
                required
              >
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount (KES)
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <label>
              Reason
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving || workers.length === 0}
          >
            {saving ? 'Saving...' : 'Record advance'}
          </button>
        </form>

        {message && (
          <p className="form-note" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Advance records</h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Approved by</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((advance) => {
                const worker = workers.find(
                  (item) => item.id === advance.workerId,
                );

                return (
                  <tr key={advance.id}>
                    <td>{worker?.name ?? `Worker #${advance.workerId}`}</td>
                    <td>{advance.date}</td>
                    <td>{formatCurrency(advance.amount)}</td>
                    <td>{advance.reason}</td>
                    <td>{advance.approvedBy}</td>
                    <td>{advance.status}</td>
                    <td>
                      {advance.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(advance.id, 'Approved')
                            }
                          >
                            Approve
                          </button>
                        </>
                      )}

                      {advance.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(advance.id, 'Settled')
                          }
                        >
                          Mark settled
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {advances.length === 0 && (
                <tr>
                  <td colSpan={7}>No advance records available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function InvoicesPage() {
  const { data, createClientInvoice, updateClientInvoice, recordInvoicePayment } = useWorkforceData();
  const { invoices, companies } = data;

  const [companyId, setCompanyId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
const [paymentAmount, setPaymentAmount] = useState('');
const [vatWithheld, setVatWithheld] = useState('0');
const [paymentDate, setPaymentDate] = useState(
  new Date().toISOString().slice(0, 10),
);
const [certificateReference, setCertificateReference] = useState('');


  const handleCreateInvoice = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await createClientInvoice({
        companyId: Number(companyId),
        invoiceNumber: invoiceNumber.trim(),
        issuedAt: new Date().toISOString().slice(0, 10),
        status: 'Issued',
        lines: [
          {
            description: description.trim(),
            category: 'Other',
            amount: Number(amount),
            taxable: true,
            vatRatePercent: 16,
          },
        ],
      });

      setCompanyId('');
      setInvoiceNumber('');
      setDescription('');
      setAmount('');
      setMessage('Invoice created successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not create invoice.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  try {
    await recordInvoicePayment(Number(paymentInvoiceId), {
      date: paymentDate,
      amountReceived: Number(paymentAmount),
      vatWithheldAmount: Number(vatWithheld),
      withholdingCertificateReference: certificateReference.trim() || undefined,
    });

    setPaymentInvoiceId('');
    setPaymentAmount('');
    setVatWithheld('0');
    setCertificateReference('');
    setMessage('Client payment recorded successfully.');
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : 'Could not record payment.',
    );
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Invoices</h1>
        <p className="text-gray-500">
          Create invoices and track payments received.
        </p>
      </div>

      <form onSubmit={handleCreateInvoice} className="space-y-4 rounded-lg border p-5">
        <h2 className="text-lg font-semibold">Create Invoice</h2>

        <select
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          required
          className="w-full rounded border p-2"
        >
          <option value="">Select client company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <input
          value={invoiceNumber}
          onChange={(event) => setInvoiceNumber(event.target.value)}
          placeholder="Invoice number"
          required
          className="w-full rounded border p-2"
        />

        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Invoice description"
          required
          className="w-full rounded border p-2"
        />

        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount (KES)"
          required
          className="w-full rounded border p-2"
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Invoice'}
        </button>

        {message && <p>{message}</p>}
      </form>


<form onSubmit={handleRecordPayment} className="space-y-4 rounded-lg border p-5">
  <h2 className="text-lg font-semibold">Record Client Payment</h2>

  <select
    value={paymentInvoiceId}
    onChange={(event) => setPaymentInvoiceId(event.target.value)}
    required
    className="w-full rounded border p-2"
  >
    <option value="">Select invoice</option>
    {invoices
      .filter((invoice) => invoice.status === 'Issued')
      .map((invoice) => (
        <option key={invoice.id} value={invoice.id}>
          {invoice.invoiceNumber}
        </option>
      ))}
  </select>

  <input
    type="date"
    value={paymentDate}
    onChange={(event) => setPaymentDate(event.target.value)}
    required
    className="w-full rounded border p-2"
  />

  <input
    type="number"
    min="0.01"
    step="0.01"
    value={paymentAmount}
    onChange={(event) => setPaymentAmount(event.target.value)}
    placeholder="Amount received (KES)"
    required
    className="w-full rounded border p-2"
  />

  <input
    type="number"
    min="0"
    step="0.01"
    value={vatWithheld}
    onChange={(event) => setVatWithheld(event.target.value)}
    placeholder="VAT withheld (KES)"
    className="w-full rounded border p-2"
  />

  <input
    value={certificateReference}
    onChange={(event) => setCertificateReference(event.target.value)}
    placeholder="Withholding certificate reference (optional)"
    className="w-full rounded border p-2"
  />

  <button type="submit" className="rounded bg-blue-600 px-5 py-2 text-white">
    Record Payment
  </button>
</form>


      <div className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Invoice Records</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Invoice</th>
                <th className="p-2">Client</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Amount (KES)</th>
                <th className="p-2">Received</th>
                <th className="p-2">Balance (KES)</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const amounts = calculateInvoiceAmounts(invoice);
                const received = invoice.payments.reduce(
                  (sum, payment) => sum + payment.amountReceived,
                  0,
                );
                const outstanding = Math.max(0, amounts.total - received);
                const company = companies.find((item) => item.id === invoice.companyId);


                return (
                  <tr key={invoice.id} className="border-b">
                    <td className="p-2">{invoice.invoiceNumber}</td>
                    <td className="p-2">
                      {company?.name ?? 'Unknown'}
                    </td>
                    <td className="p-2">{invoice.issuedAt}</td>
                    <td className="p-2">{invoice.status}</td>
                    <td className="p-2">{amounts.total.toLocaleString()}</td>
                    <td className="p-2">{received.toLocaleString()}</td>
                    <td className="p-2">{outstanding.toLocaleString()}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded bg-blue-600 px-3 py-2 text-white"
                          onClick={() => printInvoice(invoice, company)}
                        >
                          Print Invoice
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={async () => {
                            const invoiceNumber = window.prompt('Invoice number', invoice.invoiceNumber)?.trim();
                            if (!invoiceNumber) return;
                            try {
                              await updateClientInvoice(invoice.id, {
                                companyId: invoice.companyId,
                                invoiceNumber,
                                issuedAt: invoice.issuedAt,
                                status: invoice.status,
                              });
                              setMessage('Invoice updated successfully.');
                            } catch (error) {
                              setMessage(error instanceof Error ? error.message : 'Could not update invoice.');
                            }
                          }}
                        >
                          Edit
                        </button>
                        {invoice.status !== 'Void' && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={async () => {
                              if (!window.confirm(`Void invoice ${invoice.invoiceNumber}?`)) return;
                              try {
                                await updateClientInvoice(invoice.id, {
                                  companyId: invoice.companyId,
                                  invoiceNumber: invoice.invoiceNumber,
                                  issuedAt: invoice.issuedAt,
                                  status: 'Void',
                                });
                                setMessage('Invoice voided successfully.');
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : 'Could not void invoice.');
                              }
                            }}
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center">
                    No invoices recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function DocumentsPage() {
  const { data, createDocument } = useWorkforceData();
  const { documents, workers } = data;
  const [workerId, setWorkerId] = useState('');
  const [documentType, setDocumentType] = useState('National ID');
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage('Select a document file to upload.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await createDocument({
        workerId: Number(workerId),
        type: documentType,
        number: documentNumber.trim(),
        expiryDate,
        file,
      });
      setWorkerId('');
      setDocumentNumber('');
      setExpiryDate('');
      setFile(null);
      setMessage('Document uploaded successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-space">
      <PermissionGate permission="documents:manage"><div className="panel form-panel">
        <div className="panel-header">
          <h3>Document upload</h3>
        </div>

        <form className="details-form" onSubmit={handleUpload}>
          <div className="form-grid">
            <label>
              Worker
              <select value={workerId} onChange={(event) => setWorkerId(event.target.value)} required>
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </label>
            <label>
              Document type
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                <option>SHA</option>
                <option>NSSF</option>
                <option>National ID</option>
                <option>Contract</option>
              </select>
            </label>
            <label>
              Document number
              <input type="text" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} required />
            </label>
            <label>
              Expiry date
              <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
            </label>
            <label>
              File
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
            </label>
          </div>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Uploading...' : 'Upload document'}</button>
          {message && <p>{message}</p>}
        </form>
      </div></PermissionGate>

      <div className="panel">
        <div className="panel-header">
          <h3>Documents</h3>
          <PermissionGate permission="documents:manage"><button className="secondary-button">Upload</button></PermissionGate>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Type</th>
                <th>Number</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const worker = workers.find((item) => item.id === doc.workerId);
                return (
                  <tr key={doc.id}>
                    <td>{worker?.name}</td>
                    <td>{doc.type}</td>
                    <td>{doc.number}</td>
                    <td>{doc.expiryDate}</td>
                    <td><span className="status-badge status-warning">{doc.status}</span></td>
                    <td>
                      {doc.filePath ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={async () => {
                            const { data: signed, error } = await supabase.storage
                              .from('employee-documents')
                              .createSignedUrl(doc.filePath!, 3600);
                            if (error) {
                              setMessage(error.message);
                              return;
                            }
                            if (signed?.signedUrl) window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          Open
                        </button>
                      ) : 'No file'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  const { advances, attendance, companies, documents, invoices, payrollRows, workers } = useWorkforceData().data;

  const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-space">
      <section className="stats-grid">
        <StatCard label="Advance pending" value={String(advances.filter((a) => a.status !== 'Settled').length)} accent="amber" />
        <StatCard label="Workers active" value={String(workers.filter((w) => w.status === 'Active').length)} accent="green" />
        <StatCard label="Documents needing review" value={String(documents.filter((d) => d.status !== 'Valid').length)} accent="blue" />
        <StatCard label="Payroll paid" value={String(payrollRows.filter((p) => p.status === 'Paid').length)} accent="green" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Operational reports</h3>
            <p className="panel-caption">Exports are generated from live Supabase records.</p>
          </div>
        </div>
        <div className="form-grid">
          <button type="button" className="primary-button" onClick={() => downloadCsv('workers.csv', workers.map((worker) => ({
            name: worker.name, nationalId: worker.nationalId, role: worker.role, companyId: worker.companyId, status: worker.status,
          })))}>Export workers</button>
          <button type="button" className="primary-button" onClick={() => downloadCsv('attendance.csv', attendance.map((entry) => ({
            workerId: entry.workerId, date: entry.date, hoursWorked: entry.hoursWorked, overtimeHours: entry.overtimeHours, status: entry.status,
          })))}>Export attendance</button>
          <button type="button" className="primary-button" onClick={() => downloadCsv('payroll.csv', payrollRows.map((row) => ({
            workerId: row.workerId, period: row.period, grossPay: row.grossPay, deductions: row.deductions, netPay: row.netPay, status: row.status,
          })))}>Export payroll</button>
          <button type="button" className="primary-button" onClick={() => downloadCsv('invoices.csv', invoices.map((invoice) => ({
            invoiceNumber: invoice.invoiceNumber, companyId: invoice.companyId, issuedAt: invoice.issuedAt, status: invoice.status,
            total: calculateInvoiceAmounts(invoice).total,
          })))}>Export invoices</button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Companies" value={String(companies.length)} accent="blue" />
        <StatCard label="Approved attendance" value={String(attendance.filter((entry) => entry.status === 'Approved').length)} accent="green" />
        <StatCard label="Invoices" value={String(invoices.length)} accent="blue" />
        <StatCard label="Outstanding invoices" value={String(invoices.filter((invoice) => invoice.status === 'Issued' && invoice.payments.reduce((sum, payment) => sum + payment.amountReceived, 0) < calculateInvoiceAmounts(invoice).total).length)} accent="red" />
      </section>
    </div>
  );
}

function UsersPage() {
  const { users, updateUserRole } = useAuth();
  const roles = Object.keys(roleDefinitions) as UserRole[];

  return (
    <div className="page-space">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Users & access</h3>
            <p className="panel-caption">Assign each team member the access needed for their work.</p>
          </div>
          <span className="tag">{users.length} users</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Status</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small className="table-subtext">{user.email}</small>
                  </td>
                  <td><span className={`status-badge ${user.status === 'Active' ? 'status-ok' : 'status-warning'}`}>{user.status}</span></td>
                  <td>
                    <select
                      className="role-select"
                      aria-label={`Role for ${user.name}`}
                      value={user.role}
                      onChange={(event) => updateUserRole(user.id, event.target.value as UserRole)}
                    >
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Role permissions</h3>
            <p className="panel-caption">Access applied by the frontend role preview.</p>
          </div>
        </div>
        <div className="role-definition-list">
          {roles.map((role) => (
            <article className="role-definition" key={role}>
              <div className="role-definition-heading">
                <strong>{role}</strong>
                <span>{roleDefinitions[role].permissions.length} permissions</span>
              </div>
              <p>{roleDefinitions[role].description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}


function AppContent() {
  const {
    loading: authLoading,
    currentUser,
    signIn,
    signOut,
    users,
    selectUser,
  } = useAuth();

  const { isLoading, error, reload } = useWorkforceData();

  // Wait until Supabase checks the saved login session.
  if (authLoading) {
    return (
      <main className="data-state">
        <p>Checking your login...</p>
      </main>
    );
  }

  // Show the real login page if nobody is signed in.
  if (!currentUser) {
    return <LoginPage onLogin={signIn} />;
  }

  // Wait for workforce data after authentication.
  if (isLoading) {
    return (
      <main className="data-state">
        <p>Loading workforce data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="data-state">
        <h1>Could not load workforce data</h1>
        <p>{error}</p>
        <button className="primary-button" onClick={reload}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <Layout
      onLogout={() => {
        void signOut();
      }}
      currentUser={currentUser}
      users={users}
      onUserChange={selectUser}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PermissionRoute permission="dashboard:view"><DashboardPage /></PermissionRoute>} />
        <Route path="/companies" element={<PermissionRoute permission="companies:view"><CompaniesPage /></PermissionRoute>} />
        <Route path="/workers" element={<PermissionRoute permission="workers:view"><WorkersPage /></PermissionRoute>} />
        <Route path="/workforce" element={<PermissionRoute permission="companies:view"><WorkforcePage /></PermissionRoute>} />
        <Route path="/assignments" element={<PermissionRoute permission="assignments:view"><AssignmentsPage /></PermissionRoute>} />
        <Route path="/attendance" element={<PermissionRoute permission="attendance:view"><AttendancePage /></PermissionRoute>} />
        <Route path="/payroll" element={<PermissionRoute permission="payroll:view"><PayrollPage /></PermissionRoute>} />
        <Route path="/advances" element={<PermissionRoute permission="payroll:view"><AdvancesPage /></PermissionRoute>} /> 
        <Route
  path="/invoices"
  element={
    <PermissionRoute permission="invoices:view">
      <InvoicesPage />
    </PermissionRoute>
}
/>       
        <Route path="/vat" element={<PermissionRoute permission="vat:view"><VatPage /></PermissionRoute>} />
        <Route path="/documents" element={<PermissionRoute permission="documents:view"><DocumentsPage /></PermissionRoute>} />
        <Route path="/reports" element={<PermissionRoute permission="reports:view"><ReportsPage /></PermissionRoute>} />
        <Route path="/users" element={<PermissionRoute permission="users:manage"><UsersPage /></PermissionRoute>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkforceDataProvider>
        <AppContent />
      </WorkforceDataProvider>
    </AuthProvider>
  );
}
