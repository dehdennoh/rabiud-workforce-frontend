export type Company = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  vatWithholdingEnabled?: boolean;
};

export type Worker = {
  id: number;
  name: string;
  phone: string;
  nationalId: string;
  role: string;
  companyId: number;
  payRate: number;
  payFrequency: 'Daily' | 'Weekly' | 'Monthly';
  paymentMethod: 'Mobile Money' | 'Bank Transfer' | 'Cash';
  status: 'Active' | 'Inactive';
  advanceBalance: number;
};

export type Assignment = {
  id: number;
  workerId: number;
  companyId: number;
  role: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Ended';
};

export type Attendance = {
  id: number;
  workerId: number;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  status: 'Approved' | 'Pending';
};

export type Payroll = {
  id: number;
  workerId: number;
  period: string;
  grossPay: number;
  overtimePay: number;
  advances: number;
  deductions: number;
  netPay: number;
  status: 'Pending' | 'Paid';
  currency: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionReference: string | null;
  paymentNotes: string | null;
};

export type Advance = {
  id: number;
  workerId: number;
  amount: number;
  date: string;
  reason: string;
  approvedBy: string;
  status: 'Pending' | 'Approved' | 'Settled';
};

export type DocumentRecord = {
  id: number;
  workerId: number;
  type: string;
  number: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired' | 'Missing';
  verification: 'Verified' | 'Pending';
  filePath?: string;
  fileName?: string;
};

export type Payment = {
  id: number;
  workerId: number;
  amount: number;
  date: string;
  method: 'Mobile Money' | 'Bank Transfer';
  status: 'Completed' | 'Pending';
};

export type InvoiceLineCategory = 'Worker wages' | 'Employer NSSF' | 'Housing Levy' | 'Management fee' | 'Other';

export type InvoiceLine = {
  id: number;
  description: string;
  category: InvoiceLineCategory;
  amount: number;
  taxable: boolean;
  vatRatePercent: number;
};

export type InvoicePayment = {
  id: number;
  date: string;
  amountReceived: number;
  vatWithheldAmount: number;
  withholdingCertificateReference?: string;
};

export type ClientInvoice = {
  id: number;
  companyId: number;
  invoiceNumber: string;
  issuedAt: string;
  status: 'Draft' | 'Issued' | 'Void';
  etimsControlNumber?: string;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
};

export type InputVatPurchase = {
  id: number;
  supplierName: string;
  taxInvoiceReference: string;
  purchaseDate: string;
  vatAmount: number;
  claimable: boolean;
  status: 'Draft' | 'Valid' | 'Void';
};

export type VatReturn = {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: 'Draft' | 'Ready to file' | 'Filed';
  filedAt?: string;
  submissionReference?: string;
};

export type UserRole = 'Admin' | 'Operations Manager' | 'HR Officer' | 'Payroll Officer' | 'Supervisor' | 'Viewer';

export type Permission =
  | 'dashboard:view'
  | 'companies:view'
  | 'companies:manage'
  | 'workers:view'
  | 'workers:manage'
  | 'assignments:view'
  | 'assignments:manage'
  | 'attendance:view'
  | 'attendance:manage'
  | 'payroll:view'
  | 'payroll:manage'
  | 'vat:view'
  | 'vat:manage'
  | 'documents:view'
  | 'documents:manage'
  | 'reports:view'
  | 'users:manage'
  | 'invoices:view'
  | 'invoices:manage';


export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Invited' | 'Inactive';
};