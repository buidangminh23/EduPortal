import { describe, it, expect } from 'vitest';
import {
  INVOICE_STATUS,
  daysUntilDue,
  declareTransfer,
  formatVnd,
  isPayable,
  markInvoicePaid,
  resolveInvoiceStatus,
  summariseInvoices,
  validateInvoice
} from './fees';

const TODAY = '2026-06-15';
const at = { today: TODAY };

const invoice = (overrides = {}) => ({
  id: 'F01',
  studentId: 'HS001',
  title: 'Học phí tháng 6/2026',
  amount: 2_500_000,
  dueDate: '2026-06-20',
  status: INVOICE_STATUS.UNPAID,
  ...overrides
});

describe('validateInvoice', () => {
  it('accepts a well-formed invoice', () => {
    expect(validateInvoice(invoice())).toEqual({ valid: true, errors: [] });
  });

  it('rejects a non-integer amount, which would not reconcile with a bank statement', () => {
    const result = validateInvoice(invoice({ amount: 2_500_000.5 }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/số nguyên đồng/);
  });

  it('rejects zero and negative amounts', () => {
    expect(validateInvoice(invoice({ amount: 0 })).valid).toBe(false);
    expect(validateInvoice(invoice({ amount: -1000 })).valid).toBe(false);
  });

  it('rejects an implausibly large amount', () => {
    expect(validateInvoice(invoice({ amount: 1_000_000_000 })).valid).toBe(false);
  });

  it('rejects a malformed due date', () => {
    expect(validateInvoice(invoice({ dueDate: '20/06/2026' })).valid).toBe(false);
    expect(validateInvoice(invoice({ dueDate: '2026-02-30' })).valid).toBe(false);
  });

  it('reports every problem at once', () => {
    const result = validateInvoice({ amount: -5, dueDate: 'x' });
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe('resolveInvoiceStatus', () => {
  it('keeps a paid invoice paid even after the due date', () => {
    const paid = invoice({ status: INVOICE_STATUS.PAID, dueDate: '2026-01-01' });
    expect(resolveInvoiceStatus(paid, at)).toBe(INVOICE_STATUS.PAID);
  });

  it('derives overdue from the calendar rather than storing it', () => {
    expect(resolveInvoiceStatus(invoice({ dueDate: '2026-06-14' }), at)).toBe(INVOICE_STATUS.OVERDUE);
  });

  it('treats the due date itself as still on time', () => {
    expect(resolveInvoiceStatus(invoice({ dueDate: TODAY }), at)).toBe(INVOICE_STATUS.UNPAID);
  });

  it('never marks a cancelled invoice overdue', () => {
    const cancelled = invoice({ status: INVOICE_STATUS.CANCELLED, dueDate: '2026-01-01' });
    expect(resolveInvoiceStatus(cancelled, at)).toBe(INVOICE_STATUS.CANCELLED);
  });
});

describe('daysUntilDue', () => {
  it('counts forward to a future due date', () => {
    expect(daysUntilDue(invoice({ dueDate: '2026-06-20' }), at)).toBe(5);
  });

  it('goes negative once the due date has passed', () => {
    expect(daysUntilDue(invoice({ dueDate: '2026-06-10' }), at)).toBe(-5);
  });

  it('is zero on the due date', () => {
    expect(daysUntilDue(invoice({ dueDate: TODAY }), at)).toBe(0);
  });

  it('spans a month boundary correctly', () => {
    expect(daysUntilDue(invoice({ dueDate: '2026-07-01' }), at)).toBe(16);
  });
});

describe('isPayable', () => {
  it('allows paying an unpaid or overdue invoice', () => {
    expect(isPayable(invoice(), at)).toBe(true);
    expect(isPayable(invoice({ dueDate: '2026-01-01' }), at)).toBe(true);
  });

  it('blocks paying an already-paid or cancelled invoice', () => {
    expect(isPayable(invoice({ status: INVOICE_STATUS.PAID }), at)).toBe(false);
    expect(isPayable(invoice({ status: INVOICE_STATUS.CANCELLED }), at)).toBe(false);
  });
});

describe('declareTransfer', () => {
  it('parks the invoice for reconciliation instead of claiming it is paid', () => {
    const declared = declareTransfer(invoice(), { declaredAt: '2026-06-15T09:00:00.000Z' });
    expect(declared.status).toBe(INVOICE_STATUS.PENDING);
    expect(declared.status).not.toBe(INVOICE_STATUS.PAID);
    expect(declared.declaredAt).toBe('2026-06-15T09:00:00.000Z');
  });

  it('stamps the reference the school will match against the statement', () => {
    expect(declareTransfer(invoice()).paymentReference).toBe('HS001 F01');
  });

  it('is idempotent, so a double tap cannot queue the transfer twice', () => {
    const declared = declareTransfer(invoice());
    expect(declareTransfer(declared)).toBe(declared);
  });

  it('does nothing to an invoice already confirmed paid', () => {
    const paid = invoice({ status: INVOICE_STATUS.PAID });
    expect(declareTransfer(paid)).toBe(paid);
  });

  it('refuses a cancelled invoice', () => {
    expect(() => declareTransfer(invoice({ status: INVOICE_STATUS.CANCELLED }))).toThrow(/đã huỷ/);
  });

  it('keeps a declared invoice out of the overdue bucket while it is being checked', () => {
    const declared = declareTransfer(invoice({ dueDate: '2026-06-01' }));
    expect(resolveInvoiceStatus(declared, at)).toBe(INVOICE_STATUS.PENDING);
  });

  it('stops the parent from being asked to pay again', () => {
    expect(isPayable(declareTransfer(invoice()), at)).toBe(false);
  });
});

describe('markInvoicePaid', () => {
  it('confirms a declared transfer and keeps its reference', () => {
    const declared = declareTransfer(invoice(), { reference: 'HS001 F01' });
    const confirmed = markInvoicePaid(declared, { confirmedBy: 'ketoan01' });
    expect(confirmed.status).toBe(INVOICE_STATUS.PAID);
    expect(confirmed.paymentReference).toBe('HS001 F01');
    expect(confirmed.confirmedBy).toBe('ketoan01');
  });

  it('records when and how the invoice was settled', () => {
    const paid = markInvoicePaid(invoice(), {
      paidAt: '2026-06-15T09:00:00.000Z',
      reference: 'HS001 F01'
    });
    expect(paid.status).toBe(INVOICE_STATUS.PAID);
    expect(paid.paidAt).toBe('2026-06-15T09:00:00.000Z');
    expect(paid.paidMethod).toBe('vietqr');
    expect(paid.paymentReference).toBe('HS001 F01');
  });

  it('derives the reconciliation reference when none is supplied', () => {
    expect(markInvoicePaid(invoice()).paymentReference).toBe('HS001 F01');
  });

  it('leaves the original invoice untouched', () => {
    const original = invoice();
    markInvoicePaid(original);
    expect(original.status).toBe(INVOICE_STATUS.UNPAID);
  });

  it('is idempotent, so a double tap cannot post a second payment', () => {
    const paid = markInvoicePaid(invoice(), { paidAt: '2026-06-15T09:00:00.000Z' });
    expect(markInvoicePaid(paid, { paidAt: '2026-06-15T09:05:00.000Z' })).toBe(paid);
  });

  it('refuses to settle a cancelled invoice', () => {
    expect(() => markInvoicePaid(invoice({ status: INVOICE_STATUS.CANCELLED }))).toThrow(/đã huỷ/);
  });
});

describe('summariseInvoices', () => {
  const invoices = [
    invoice({ id: 'F01', amount: 2_500_000, status: INVOICE_STATUS.PAID }),
    invoice({ id: 'F02', amount: 950_000, dueDate: '2026-06-20' }),
    invoice({ id: 'F03', amount: 300_000, dueDate: '2026-06-05' })
  ];

  it('splits billed into paid and outstanding', () => {
    const summary = summariseInvoices(invoices, at);
    expect(summary.billed).toBe(3_750_000);
    expect(summary.paid).toBe(2_500_000);
    expect(summary.outstanding).toBe(1_250_000);
  });

  it('counts only past-due unpaid invoices as overdue', () => {
    const summary = summariseInvoices(invoices, at);
    expect(summary.overdue).toBe(300_000);
    expect(summary.overdueCount).toBe(1);
  });

  it('reports the collection rate to one decimal', () => {
    expect(summariseInvoices(invoices, at).collectionRate).toBe(66.7);
  });

  it('excludes cancelled invoices from every figure', () => {
    const withCancelled = [...invoices, invoice({ id: 'F04', amount: 9_000_000, status: INVOICE_STATUS.CANCELLED })];
    expect(summariseInvoices(withCancelled, at).billed).toBe(3_750_000);
    expect(summariseInvoices(withCancelled, at).count).toBe(3);
  });

  it('returns a null collection rate rather than 0 when nothing was billed', () => {
    expect(summariseInvoices([], at).collectionRate).toBeNull();
    expect(summariseInvoices([], at).billed).toBe(0);
  });

  it('counts a declared transfer as outstanding until the school confirms it', () => {
    const declared = [invoices[0], declareTransfer(invoices[1]), invoices[2]];
    const summary = summariseInvoices(declared, at);
    expect(summary.paid).toBe(2_500_000);
    expect(summary.outstanding).toBe(1_250_000);
    expect(summary.awaitingReconciliation).toBe(950_000);
    expect(summary.awaitingCount).toBe(1);
  });

  it('keeps totals exact — integer đồng never drift', () => {
    const many = Array.from({ length: 100 }, (_, i) => invoice({ id: `F${i}`, amount: 333_333 }));
    expect(summariseInvoices(many, at).billed).toBe(33_333_300);
  });
});

describe('formatVnd', () => {
  it('renders whole đồng without decimals', () => {
    expect(formatVnd(2_500_000)).toMatch(/2\.500\.000/);
  });

  it('renders a dash for a missing amount instead of NaN', () => {
    expect(formatVnd(undefined)).toBe('—');
    expect(formatVnd(Number.NaN)).toBe('—');
  });
});
