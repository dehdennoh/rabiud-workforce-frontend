
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import {
  Advance,
  Assignment,
  Attendance,
  Company,
  DocumentRecord,
  Payroll,
  Worker,
  ClientInvoice,
  InvoiceLine,
  InvoicePayment,
} from '../types';
import {
  getInitialWorkforceData,
  getWorkforceData,
  WorkforceData,
} from './workforceService';

type CompanyValues = Omit<Company, 'id'>;
type WorkerValues = Omit<Worker, 'id'>;
type AssignmentValues = Omit<Assignment, 'id'>;
type AttendanceValues = Omit<Attendance, 'id'>;
type PayrollValues = Omit<Payroll, 'id'>;
type ClientInvoiceValues = Omit<ClientInvoice, 'id' | 'lines' | 'payments'> & {
  lines: Omit<InvoiceLine, 'id'>[];
};

type InvoicePaymentValues = Omit<InvoicePayment, 'id'>;



type WorkforceDataContextValue = {
  data: WorkforceData;
  isLoading: boolean;
  error: string | null;
  reload: () => void;

  createCompany: (values: CompanyValues) => Promise<Company>;
  updateCompany: (id: number, values: CompanyValues) => Promise<Company>;

  createWorker: (values: WorkerValues) => Promise<Worker>;
  updateWorker: (id: number, values: WorkerValues) => Promise<Worker>;

  createAssignment: (values: AssignmentValues) => Promise<Assignment>;
  createAttendance: (values: AttendanceValues) => Promise<Attendance>;
  approveAttendance: (id: number) => Promise<Attendance>;

  generatePayroll: (period: string) => Promise<Payroll[]>;

  recordPayrollPayment: (
    id: number,
    payment: {
      paymentDate: string;
      paymentMethod: string;
      transactionReference?: string;
      paymentNotes?: string;
    },
  ) => Promise<Payroll>;

  createAdvance: (values: Omit<Advance, 'id'>) => Promise<Advance>;
  updateAdvanceStatus: (
    id: number,
    status: Advance['status'],
    approvedBy?: string,
  ) => Promise<Advance>;

  createClientInvoice: (values: ClientInvoiceValues) => Promise<ClientInvoice>;
  updateClientInvoice: (
    invoiceId: number,
    values: Pick<ClientInvoice, 'companyId' | 'invoiceNumber' | 'issuedAt' | 'status'>,
  ) => Promise<ClientInvoice>;
  recordInvoicePayment: (
    invoiceId: number,
    payment: InvoicePaymentValues,
  ) => Promise<InvoicePayment>;

  createDocument: (values: {
    workerId: number;
    type: string;
    number: string;
    expiryDate: string;
    file: File;
  }) => Promise<DocumentRecord>;
};

  createClientInvoice: (values: ClientInvoiceValues) => Promise<ClientInvoice>;

  recordInvoicePayment: (
    invoiceId: number,
    payment: InvoicePaymentValues,
  ) => Promise<InvoicePayment>;

const WorkforceDataContext =
  createContext<WorkforceDataContextValue | null>(null);

export function WorkforceDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { currentUser, loading: authLoading } = useAuth();

  const [data, setData] = useState<WorkforceData>(
    getInitialWorkforceData,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load workforce data from Supabase
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser) {
        setData(getInitialWorkforceData());
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextData = await getWorkforceData(signal);

        if (!signal?.aborted) {
          setData(nextData);
        }
      } catch (cause) {
        if (!signal?.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load workforce data.',
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentUser],
  );

  const reload = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setData(getInitialWorkforceData());
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    void load(controller.signal);

    return () => controller.abort();
  }, [authLoading, currentUser, load]);

  // Create company
  const createCompany = useCallback(
    async (values: CompanyValues) => {
      const { data: row, error } = await supabase
        .from('companies')
        .insert({
          name: values.name,
          contact: values.contact,
          phone: values.phone,
          email: values.email,
          status: values.status,
          vat_withholding_enabled:
            values.vatWithholdingEnabled ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      const company: Company = {
        id: row.id,
        name: row.name,
        contact: row.contact,
        phone: row.phone,
        email: row.email,
        status: row.status,
        vatWithholdingEnabled: row.vat_withholding_enabled,
      };

      setData((current) => ({
        ...current,
        companies: [...current.companies, company],
      }));

      return company;
    },
    [],
  );

  // Update company
  const updateCompany = useCallback(
    async (id: number, values: CompanyValues) => {
      const { data: row, error } = await supabase
        .from('companies')
        .update({
          name: values.name,
          contact: values.contact,
          phone: values.phone,
          email: values.email,
          status: values.status,
          vat_withholding_enabled:
            values.vatWithholdingEnabled ?? false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const company: Company = {
        id: row.id,
        name: row.name,
        contact: row.contact,
        phone: row.phone,
        email: row.email,
        status: row.status,
        vatWithholdingEnabled: row.vat_withholding_enabled,
      };

      setData((current) => ({
        ...current,
        companies: current.companies.map((item) =>
          item.id === id ? company : item,
        ),
      }));

      return company;
    },
    [],
  );

  // Create worker
  const createWorker = useCallback(
    async (values: WorkerValues) => {
      const { data: row, error } = await supabase
        .from('workers')
        .insert({
          name: values.name,
          phone: values.phone,
          national_id: values.nationalId,
          role: values.role,
          company_id: values.companyId,
          pay_rate: values.payRate,
          pay_frequency: values.payFrequency,
          payment_method: values.paymentMethod,
          status: values.status,
          advance_balance: values.advanceBalance,
        })
        .select()
        .single();

      if (error) throw error;

      const worker: Worker = {
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
      };

      setData((current) => ({
        ...current,
        workers: [...current.workers, worker],
      }));

      return worker;
    },
    [],
  );

  // Update worker
  const updateWorker = useCallback(
    async (id: number, values: WorkerValues) => {
      const { data: row, error } = await supabase
        .from('workers')
        .update({
          name: values.name,
          phone: values.phone,
          national_id: values.nationalId,
          role: values.role,
          company_id: values.companyId,
          pay_rate: values.payRate,
          pay_frequency: values.payFrequency,
          payment_method: values.paymentMethod,
          status: values.status,
          advance_balance: values.advanceBalance,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const worker: Worker = {
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
      };

      setData((current) => ({
        ...current,
        workers: current.workers.map((item) =>
          item.id === id ? worker : item,
        ),
      }));

      return worker;
    },
    [],
  );

  // Create assignment
  const createAssignment = useCallback(
    async (values: AssignmentValues) => {
      const { data: row, error } = await supabase
        .from('assignments')
        .insert({
          worker_id: values.workerId,
          company_id: values.companyId,
          role: values.role,
          start_date: values.startDate,
          end_date: values.endDate || null,
          status: values.status,
        })
        .select()
        .single();

      if (error) throw error;

      const assignment: Assignment = {
        id: row.id,
        workerId: row.worker_id,
        companyId: row.company_id,
        role: row.role,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
      };

      setData((current) => ({
        ...current,
        assignments: [...current.assignments, assignment],
      }));

      return assignment;
    },
    [],
  );
    // Create attendance
  const createAttendance = useCallback(
    async (values: AttendanceValues) => {
      const { data: row, error } = await supabase
        .from('attendance')
        .insert({
          worker_id: values.workerId,
          date: values.date,
          hours_worked: values.hoursWorked,
          overtime_hours: values.overtimeHours,
          status: values.status,
        })
        .select()
        .single();

      if (error) throw error;

      const attendance: Attendance = {
        id: row.id,
        workerId: row.worker_id,
        date: row.date,
        hoursWorked: Number(row.hours_worked),
        overtimeHours: Number(row.overtime_hours),
        status: row.status,
      };

      setData((current) => ({
        ...current,
        attendance: [...current.attendance, attendance],
      }));

      return attendance;
    },
    [],
  );
    // Approve attendance
  const approveAttendance = useCallback(
    async (id: number) => {
      const { data: row, error } = await supabase
        .from('attendance')
        .update({ status: 'Approved' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const approvedAttendance: Attendance = {
        id: row.id,
        workerId: row.worker_id,
        date: row.date,
        hoursWorked: Number(row.hours_worked),
        overtimeHours: Number(row.overtime_hours),
        status: row.status,
      };

      setData((current) => ({
        ...current,
        attendance: current.attendance.map((item) =>
          item.id === id ? approvedAttendance : item,
        ),
      }));

      return approvedAttendance;
    },
    [],
  );
    const createAdvance = useCallback(
    async (values: Omit<Advance, 'id'>) => {
      const { data: row, error } = await supabase
        .from('advances')
        .insert({
          worker_id: values.workerId,
          amount: values.amount,
          date: values.date,
          reason: values.reason,
          approved_by: values.approvedBy,
          status: values.status,
        })
        .select()
        .single();

      if (error) throw error;

      const newAdvance: Advance = {
        id: row.id,
        workerId: row.worker_id,
        amount: Number(row.amount),
        date: row.date,
        reason: row.reason,
        approvedBy: row.approved_by,
        status: row.status,
      };

      setData((current) => ({
        ...current,
        advances: [...current.advances, newAdvance],
      }));

      return newAdvance;
    },
    [],
  );

  const updateAdvanceStatus = useCallback(
    async (
      id: number,
      status: Advance['status'],
      approvedBy?: string,
    ) => {
      const updates: {
        status: Advance['status'];
        approved_by?: string;
      } = { status };

      if (approvedBy) {
        updates.approved_by = approvedBy;
      }

      const { data: row, error } = await supabase
        .from('advances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedAdvance: Advance = {
        id: row.id,
        workerId: row.worker_id,
        amount: Number(row.amount),
        date: row.date,
        reason: row.reason,
        approvedBy: row.approved_by,
        status: row.status,
      };

      setData((current) => ({
        ...current,
        advances: current.advances.map((item) =>
          item.id === id ? updatedAdvance : item,
        ),
      }));

      return updatedAdvance;
    },
    [],
  );

  const createClientInvoice = useCallback(
    async (values: ClientInvoiceValues) => {
      const { data: row, error } = await supabase
        .from('client_invoices')
        .insert({
          company_id: values.companyId,
          invoice_number: values.invoiceNumber,
          issued_at: values.issuedAt,
          status: values.status,
          etims_control_number: values.etimsControlNumber ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      const { data: lineRows, error: lineError } = await supabase
        .from('invoice_lines')
        .insert(
          values.lines.map((line) => ({
            invoice_id: row.id,
            description: line.description,
            category: line.category,
            amount: line.amount,
            taxable: line.taxable,
            vat_rate_percent: line.vatRatePercent,
          })),
        )
        .select();

      if (lineError) throw lineError;

      const invoice: ClientInvoice = {
        id: row.id,
        companyId: row.company_id,
        invoiceNumber: row.invoice_number,
        issuedAt: row.issued_at,
        status: row.status,
        etimsControlNumber: row.etims_control_number ?? undefined,
        lines: (lineRows ?? []).map((line) => ({
          id: line.id,
          description: line.description,
          category: line.category,
          amount: Number(line.amount),
          taxable: line.taxable,
          vatRatePercent: Number(line.vat_rate_percent),
        })),
        payments: [],
      };

      setData((current) => ({
        ...current,
        invoices: [...current.invoices, invoice],
      }));

      return invoice;
    },
    [],
  );

  const updateClientInvoice = useCallback(
    async (
      invoiceId: number,
      values: Pick<ClientInvoice, 'companyId' | 'invoiceNumber' | 'issuedAt' | 'status'>,
    ) => {
      const existing = data.invoices.find((invoice) => invoice.id === invoiceId);
      if (!existing) throw new Error('Invoice not found.');
      if (existing.payments.length > 0 && values.status === 'Void') {
        throw new Error('A voided invoice cannot retain recorded payments. Reverse the payments first.');
      }

      const { data: row, error } = await supabase
        .from('client_invoices')
        .update({
          company_id: values.companyId,
          invoice_number: values.invoiceNumber,
          issued_at: values.issuedAt,
          status: values.status,
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      const updated: ClientInvoice = {
        ...existing,
        companyId: row.company_id,
        invoiceNumber: row.invoice_number,
        issuedAt: row.issued_at,
        status: row.status,
      };

      setData((current) => ({
        ...current,
        invoices: current.invoices.map((invoice) =>
          invoice.id === invoiceId ? updated : invoice,
        ),
      }));

      return updated;
    },
    [data.invoices],
  );

  const recordInvoicePayment = useCallback(
    async (invoiceId: number, payment: InvoicePaymentValues) => {
      const { data: row, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoiceId,
          date: payment.date,
          amount_received: payment.amountReceived,
          vat_withheld_amount: payment.vatWithheldAmount,
          withholding_certificate_reference:
            payment.withholdingCertificateReference ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      const newPayment: InvoicePayment = {
        id: row.id,
        date: row.date,
        amountReceived: Number(row.amount_received),
        vatWithheldAmount: Number(row.vat_withheld_amount),
        withholdingCertificateReference:
          row.withholding_certificate_reference ?? undefined,
      };

      setData((current) => ({
        ...current,
        invoices: current.invoices.map((invoice) =>
          invoice.id === invoiceId
            ? { ...invoice, payments: [...invoice.payments, newPayment] }
            : invoice,
        ),
      }));

      return newPayment;
    },
    [],
  );

  const createDocument = useCallback(
    async (values: {
      workerId: number;
      type: string;
      number: string;
      expiryDate: string;
      file: File;
    }) => {
      const safeName = values.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `workers/${values.workerId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, values.file, { upsert: false });

      if (uploadError) throw uploadError;

      const today = new Date().toISOString().slice(0, 10);
      let status: DocumentRecord['status'] = 'Valid';
      if (!values.expiryDate) status = 'Missing';
      else if (values.expiryDate < today) status = 'Expired';
      else {
        const expiry = new Date(`${values.expiryDate}T00:00:00`);
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 30);
        if (expiry <= warningDate) status = 'Expiring';
      }

      const { data: row, error } = await supabase
        .from('documents')
        .insert({
          worker_id: values.workerId,
          type: values.type,
          number: values.number,
          expiry_date: values.expiryDate || null,
          status,
          verification: 'Pending',
          file_path: filePath,
          file_name: values.file.name,
        })
        .select()
        .single();

      if (error) {
        await supabase.storage.from('employee-documents').remove([filePath]);
        throw error;
      }

      const document: DocumentRecord = {
        id: row.id,
        workerId: row.worker_id,
        type: row.type,
        number: row.number,
        expiryDate: row.expiry_date ?? '',
        status: row.status,
        verification: row.verification,
        filePath: row.file_path ?? undefined,
        fileName: row.file_name ?? undefined,
      };

      setData((current) => ({
        ...current,
        documents: [...current.documents, document],
      }));

      return document;
    },
    [],
  );


  // Generate payroll for a selected month
  const generatePayroll = useCallback(
    async (period: string): Promise<Payroll[]> => {
      if (!/^\d{4}-\d{2}$/.test(period)) {
        throw new Error('Enter the payroll period in YYYY-MM format.');
      }

      const [year, month] = period.split('-').map(Number);

      if (month < 1 || month > 12) {
        throw new Error('Invalid payroll month.');
      }

      const periodStart = `${period}-01`;
      const periodEnd = new Date(
        Date.UTC(year, month, 0),
      ).toISOString().slice(0, 10);

      const generated: Payroll[] = [];

      for (const worker of data.workers) {
        // Prevent generating payroll twice for the same worker and month
        const alreadyGenerated = data.payrollRows.some(
          (row) => row.workerId === worker.id && row.period === period,
        );

        if (alreadyGenerated) continue;

        // Only approved attendance is included
        const approvedAttendance = data.attendance.filter(
          (entry) =>
            entry.workerId === worker.id &&
            entry.status === 'Approved' &&
            entry.date >= periodStart &&
            entry.date <= periodEnd,
        );

        if (approvedAttendance.length === 0) continue;

        // Calculate hourly rate according to worker pay frequency
        let hoursPerPayPeriod = 8;

        if (worker.payFrequency === 'Weekly') {
          hoursPerPayPeriod = 40;
        } else if (worker.payFrequency === 'Monthly') {
          hoursPerPayPeriod = 208;
        }

        const hourlyRate = worker.payRate / hoursPerPayPeriod;

        // Calculate normal working hours
        const regularHours = approvedAttendance.reduce(
          (total, entry) =>
            total + Math.min(Number(entry.hoursWorked), 8),
          0,
        );

        // Calculate overtime hours
        const overtimeHours = approvedAttendance.reduce(
          (total, entry) => total + Number(entry.overtimeHours),
          0,
        );

        const grossPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;

        // Deduct approved advances within the selected month
        const advances = data.advances
          .filter(
            (advance) =>
              advance.workerId === worker.id &&
              advance.status === 'Approved' &&
              advance.date >= periodStart &&
              advance.date <= periodEnd,
          )
          .reduce(
            (total, advance) => total + Number(advance.amount),
            0,
          );

        const deductions = 0;
        const netPay = grossPay + overtimePay - advances - deductions;

        if (netPay < 0) {
          throw new Error(
            `Approved advances exceed this month's pay for ${worker.name}.`,
          );
        }

        // Save payroll record to Supabase
        const { data: row, error } = await supabase
          .from('payroll')
          .insert({
            worker_id: worker.id,
            period,
            gross_pay: grossPay,
            overtime_pay: overtimePay,
            advances,
            deductions,
            net_pay: netPay,
            status: 'Pending',
            currency: 'KES',
          })
          .select()
          .single();

        if (error) throw error;

      generated.push({
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
});
}

      // Update payroll records displayed in the application
      setData((current) => ({
        ...current,
        payrollRows: [...current.payrollRows, ...generated],
      }));

      return generated;
    },
    [data],
  );

const recordPayrollPayment = useCallback(
  async (
    id: number,
    payment: {
      paymentDate: string;
      paymentMethod: string;
      transactionReference?: string;
      paymentNotes?: string;
    },
  ) => {
    const existing = data.payrollRows.find((row) => row.id === id);

    if (!existing) {
      throw new Error('Payroll record not found.');
    }

    if (existing.status === 'Paid') {
      throw new Error('This payroll has already been paid.');
    }

    const { data: row, error } = await supabase
      .from('payroll')
      .update({
        status: 'Paid',
        payment_date: payment.paymentDate,
        payment_method: payment.paymentMethod,
        transaction_reference: payment.transactionReference?.trim() || null,
        payment_notes: payment.paymentNotes?.trim() || null,
      })
      .eq('id', id)
      .eq('status', 'Pending')
      .select()
      .single();

    if (error) throw error;

    const updatedPayroll: Payroll = {
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
    };

    setData((current) => ({
      ...current,
      payrollRows: current.payrollRows.map((item) =>
        item.id === id ? updatedPayroll : item,
      ),
    }));

    return updatedPayroll;
  },
  [data.payrollRows],
);

  return (
    <WorkforceDataContext.Provider
      value={{
        data,
        isLoading: authLoading || isLoading,
        error,
        reload,
        createCompany,
        updateCompany,
        createWorker,
        updateWorker,
        createAssignment,
        createAttendance,
        approveAttendance,
        generatePayroll,
        recordPayrollPayment,
        createAdvance,
        updateAdvanceStatus,
        createClientInvoice,
        updateClientInvoice,
        recordInvoicePayment,
        createDocument,

      }}
    >
      {children}
    </WorkforceDataContext.Provider>
  );
}

export function useWorkforceData() {
  const context = useContext(WorkforceDataContext);

  if (!context) {
    throw new Error(
      'useWorkforceData must be used within WorkforceDataProvider.',
    );
  }

  return context;
}
