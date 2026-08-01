/**
 * Tuition invoices and payment state.
 *
 * Amounts are integer đồng throughout. Vietnam has no sub-unit in practice and
 * float arithmetic on money produces totals that do not reconcile against a
 * bank statement, so a non-integer amount is rejected at the door.
 */

import { buildTuitionPurpose } from './vietqr';
import { daysBetween, isValidIsoDate, todayIso } from './dates';

export const INVOICE_STATUS = {
  UNPAID: 'unpaid',
  /** Parent says they transferred; the school has not matched it to a statement yet. */
  PENDING: 'pending_reconciliation',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const INVOICE_LABEL = {
  [INVOICE_STATUS.UNPAID]: 'Chưa thanh toán',
  [INVOICE_STATUS.PENDING]: 'Chờ nhà trường đối soát',
  [INVOICE_STATUS.PAID]: 'Đã thanh toán',
  [INVOICE_STATUS.OVERDUE]: 'Quá hạn',
  [INVOICE_STATUS.CANCELLED]: 'Đã huỷ'
};

/** Largest amount a single school invoice may carry, as a sanity bound. */
const MAX_INVOICE_AMOUNT = 999_999_999;

export function formatVnd(amount) {
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Validates an invoice before it is issued.
 *
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateInvoice({ id, studentId, title, amount, dueDate }) {
  const errors = [];

  if (!id) errors.push('Thiếu mã khoản thu.');
  if (!studentId) errors.push('Thiếu mã học sinh.');
  if (!title || String(title).trim().length === 0) errors.push('Thiếu tên khoản thu.');

  if (!Number.isInteger(amount)) {
    errors.push('Số tiền phải là số nguyên đồng (không có phần lẻ).');
  } else if (amount <= 0) {
    errors.push('Số tiền phải lớn hơn 0.');
  } else if (amount > MAX_INVOICE_AMOUNT) {
    errors.push('Số tiền vượt mức cho phép của một khoản thu.');
  }

  if (!isValidIsoDate(dueDate)) {
    errors.push('Hạn nộp không hợp lệ (định dạng YYYY-MM-DD).');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Derives the status shown to a parent.
 *
 * Overdue is computed, never stored: an invoice becomes overdue by the passage
 * of time, and storing it would leave the record stale the next morning.
 */
export function resolveInvoiceStatus(invoice, { today = todayIso() } = {}) {
  if (invoice.status === INVOICE_STATUS.PAID) return INVOICE_STATUS.PAID;
  if (invoice.status === INVOICE_STATUS.CANCELLED) return INVOICE_STATUS.CANCELLED;
  // A declared transfer is not overdue while the school is still checking it.
  if (invoice.status === INVOICE_STATUS.PENDING) return INVOICE_STATUS.PENDING;
  return invoice.dueDate && invoice.dueDate < today ? INVOICE_STATUS.OVERDUE : INVOICE_STATUS.UNPAID;
}

/** Days until the due date; negative once it has passed. */
export function daysUntilDue(invoice, { today = todayIso() } = {}) {
  return daysBetween(today, invoice.dueDate);
}

export function isPayable(invoice, options) {
  const status = resolveInvoiceStatus(invoice, options);
  return status === INVOICE_STATUS.UNPAID || status === INVOICE_STATUS.OVERDUE;
}

/**
 * Records that the payer says they transferred the money.
 *
 * Without a payment gateway the app cannot see the bank account, so this is a
 * claim, not a receipt. It parks the invoice in "chờ đối soát" until someone
 * at the school matches it against a statement — which is exactly how a school
 * running on plain bank transfers already works.
 *
 * Re-declaring is a no-op so a double tap cannot queue the same transfer twice.
 *
 * @throws {Error} when the invoice was cancelled or is already settled.
 */
export function declareTransfer(invoice, { declaredAt, reference } = {}) {
  if (invoice.status === INVOICE_STATUS.PENDING) return invoice;
  if (invoice.status === INVOICE_STATUS.PAID) return invoice;
  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    throw new Error('Không thể thanh toán một khoản thu đã huỷ.');
  }

  return {
    ...invoice,
    status: INVOICE_STATUS.PENDING,
    declaredAt: declaredAt || new Date().toISOString(),
    paymentReference: reference || buildTuitionPurpose(invoice.studentId, invoice.id)
  };
}

/**
 * Confirms the money actually arrived — the school's reconciliation step.
 *
 * Confirming an already-paid invoice returns it unchanged so a double click
 * cannot post a second payment.
 *
 * @throws {Error} when the invoice was cancelled.
 */
export function markInvoicePaid(invoice, { paidAt, method = 'vietqr', reference, confirmedBy } = {}) {
  if (invoice.status === INVOICE_STATUS.PAID) return invoice;
  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    throw new Error('Không thể thanh toán một khoản thu đã huỷ.');
  }

  return {
    ...invoice,
    status: INVOICE_STATUS.PAID,
    paidAt: paidAt || new Date().toISOString(),
    paidMethod: method,
    confirmedBy: confirmedBy || null,
    paymentReference: reference || invoice.paymentReference || buildTuitionPurpose(invoice.studentId, invoice.id)
  };
}

/**
 * Totals a student's invoices.
 *
 * Cancelled invoices are excluded from every figure — they are a record that
 * nothing is owed, so counting them would overstate both billed and outstanding.
 */
export function summariseInvoices(invoices, options) {
  const live = (invoices || []).filter(
    (invoice) => resolveInvoiceStatus(invoice, options) !== INVOICE_STATUS.CANCELLED
  );

  const totals = live.reduce(
    (acc, invoice) => {
      const status = resolveInvoiceStatus(invoice, options);
      acc.billed += invoice.amount;
      if (status === INVOICE_STATUS.PAID) {
        acc.paid += invoice.amount;
        return acc;
      }

      // Money the school has not banked yet, whatever the payer has declared.
      acc.outstanding += invoice.amount;
      if (status === INVOICE_STATUS.PENDING) {
        acc.awaitingReconciliation += invoice.amount;
        acc.awaitingCount += 1;
      }
      if (status === INVOICE_STATUS.OVERDUE) {
        acc.overdue += invoice.amount;
        acc.overdueCount += 1;
      }
      return acc;
    },
    {
      billed: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      awaitingReconciliation: 0,
      awaitingCount: 0
    }
  );

  const paidCount = live.filter(
    (i) => resolveInvoiceStatus(i, options) === INVOICE_STATUS.PAID
  ).length;

  return {
    ...totals,
    count: live.length,
    unpaidCount: live.length - paidCount,
    collectionRate: totals.billed === 0 ? null : Math.round((totals.paid / totals.billed) * 1000) / 10
  };
}
