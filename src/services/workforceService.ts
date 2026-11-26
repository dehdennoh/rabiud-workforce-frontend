
import { supabase } from '../lib/supabase';
import {
  Advance,
  Assignment,
  Attendance,
  ClientInvoice,
  Company,
  DocumentRecord,
  InputVatPurchase,
  Payroll,
  Worker,
} from '../types';

export type WorkforceData = {
  companies: Company[];
  workers: Worker[];
  assignments: Assignment[];
  attendance: Attendance[];
  payrollRows: Payroll[];
  advances: Advance[];
  documents: DocumentRecord[];
  invoices: ClientInvoice[];
  inputVatPurchases: InputVatPurchase[];
};

export function getInitialWorkforceData(): WorkforceData {
  return {
    companies: [],
    workers: [],
    assignments: [],
    attendance: [],
    payrollRows: [],
    advances: [],
    documents: [],
    invoices: [],
    inputVatPurchases: [],
  };
}

export async function getWorkforceData(
  signal?: AbortSignal,
): Promise<WorkforceData> {
  const [
  companiesResult,
  workersResult,
  assignmentsResult,
  attendanceResult,
  payrollResult,
  advancesResult,
  documentsResult,
  invoicesResult,
  invoiceLinesResult,
  invoicePaymentsResult,
  inputVatResult,
] = await Promise.all([
    supabase.from('companies').select('*').abortSignal(signal!),
    supabase.from('workers').select('*').abortSignal(signal!),
    supabase.from('assignments').select('*').abortSignal(signal!),
    supabase.from('attendance').select('*').abortSignal(signal!),
    supabase.from('payroll').select('*').abortSignal(signal!),
    supabase.from('advances').select('*').abortSignal(signal!),
    supabase.from('documents').select('*').abortSignal(signal!),
    supabase.from('client_invoices').select('*').abortSignal(signal!),
    supabase.from('invoice_lines').select('*').abortSignal(signal!),
    supabase.from('invoice_payments').select('*').abortSignal(signal!),
    supabase.from('input_vat_purchases').select('*').abortSignal(signal!),
  ]);

  const results = [
  companiesResult,
  workersResult,
  assignmentsResult,
  attendanceResult,
  payrollResult,
  advancesResult,
  documentsResult,
  invoicesResult,
  invoiceLinesResult,
  invoicePaymentsResult,
  inputVatResult,
];

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  const companies: Company[] = (companiesResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    contact: row.contact,
    phone: row.phone,
    email: row.email,
    status: row.status,
    vatWithholdingEnabled: row.vat_withholding_enabled,
  }));

  const workers: Worker[] = (workersResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    nationalId: row.national_id,
    role: row.role,
    companyId: row.company_id,
    payRate: Number(row.pay_rate),
    payFrequency: row.pay_frequency,
    paymentMethod: row.payment_method,
    status: row.status,
    advanceBalance: Number(row.advance_balance ?? 0),
  }));

  const assignments: Assignment[] = (assignmentsResult.data ?? []).map((row) => ({
    id: row.id,
    workerId: row.worker_id,
    companyId: row.company_id,
    role: row.role,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    status: row.status,
  }));

  const attendance: Attendance[] = (attendanceResult.data ?? []).map((row) => ({
    id: row.id,
    workerId: row.worker_id,
    date: row.date,
    hoursWorked: Number(row.hours_worked),
    overtimeHours: Number(row.overtime_hours),
    status: row.status,
  }));

const payrollRows: Payroll[] = (payrollResult.data ?? []).map((row) => ({
  id: row.id,
  workerId: row.worker_id,
  period: row.period,
  grossPay: Number(row.gross_pay),
  overtimePay: Number(row.overtime_pay),
  advances: Number(row.advances),
  deductions: Number(row.deductions),
  netPay: Number(row.net_pay),
  status: row.status,
  currency: row.currency ?? 'KES',
  paymentDate: row.payment_date ?? null,
  paymentMethod: row.payment_method ?? null,
  transactionReference: row.transaction_reference ?? null,
  paymentNotes: row.payment_notes ?? null,
}));
  const advances: Advance[] = (advancesResult.data ?? []).map((row) => ({
    id: row.id,
    workerId: row.worker_id,
    amount: Number(row.amount),
    date: row.date,
    reason: row.reason,
    approvedBy: row.approved_by ?? '',
    status: row.status,
  }));

  const documents: DocumentRecord[] = (documentsResult.data ?? []).map((row) => ({
    id: row.id,
    workerId: row.worker_id,
    type: row.type,
    number: row.number,
    expiryDate: row.expiry_date ?? '',
    status: row.status,
    verification: row.verification,
    filePath: row.file_path ?? undefined,
    fileName: row.file_name ?? undefined,
  }));

 const invoices: ClientInvoice[] = (invoicesResult.data ?? []).map((row) => ({
  id: row.id,
  companyId: row.company_id,
  invoiceNumber: row.invoice_number,
  issuedAt: row.issued_at,
  status: row.status,
  etimsControlNumber: row.etims_control_number ?? undefined,

  lines: (invoiceLinesResult.data ?? [])
    .filter((line) => line.invoice_id === row.id)
    .map((line) => ({
      id: line.id,
      description: line.description,
      category: line.category,
      amount: Number(line.amount),
      taxable: line.taxable,
      vatRatePercent: Number(line.vat_rate_percent),
    })),

  payments: (invoicePaymentsResult.data ?? [])
    .filter((payment) => payment.invoice_id === row.id)
    .map((payment) => ({
      id: payment.id,
      date: payment.date,
      amountReceived: Number(payment.amount_received),
      vatWithheldAmount: Number(payment.vat_withheld_amount),
      withholdingCertificateReference:
        payment.withholding_certificate_reference ?? undefined,
    })),
}));

  const inputVatPurchases: InputVatPurchase[] = (inputVatResult.data ?? []).map((row) => ({
    id: row.id,
    supplierName: row.supplier_name,
    taxInvoiceReference: row.tax_invoice_reference,
    purchaseDate: row.purchase_date,
    vatAmount: Number(row.vat_amount),
    claimable: row.claimable,
    status: row.status,
  }));

  return {
    companies,
    workers,
    assignments,
    attendance,
    payrollRows,
    advances,
    documents,
    invoices,
    inputVatPurchases,
  };
}
