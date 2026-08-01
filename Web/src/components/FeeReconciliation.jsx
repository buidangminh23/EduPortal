import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Landmark, Check, Clock } from 'lucide-react';
import { INVOICE_STATUS, formatVnd } from '../lib/domain/fees';

/**
 * The school's side of a bank transfer.
 *
 * Parents can only declare that they sent money; nothing in a static frontend
 * can see the school's account. This queue is where a bursar matches each
 * declaration against the bank statement and turns it into a real payment.
 */
export default function FeeReconciliation() {
  const { students, confirmFeePayment, userSession } = useContext(AppContext);

  const pending = useMemo(() => {
    return (students || []).flatMap((student) =>
      (student.feeStatus || [])
        .filter((fee) => !fee.paid && fee.status === INVOICE_STATUS.PENDING)
        .map((fee) => ({ student, fee }))
    );
  }, [students]);

  const total = pending.reduce((sum, { fee }) => sum + fee.amount, 0);

  return (
    <div className="glass-panel" style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16
        }}
      >
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
            <Landmark size={20} color="var(--accent-primary)" />
            Đối soát chuyển khoản
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Phụ huynh đã báo chuyển khoản. Đối chiếu với sao kê ngân hàng theo nội dung chuyển khoản
            rồi xác nhận.
          </p>
        </div>
        {pending.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Chờ đối soát</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#b45309' }}>
              {formatVnd(total)}
            </div>
          </div>
        )}
      </div>

      {pending.length === 0 ? (
        <p
          style={{
            margin: 0,
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem'
          }}
        >
          Không có khoản nào chờ đối soát.
        </p>
      ) : (
        <table className="premium-table">
          <thead>
            <tr>
              <th scope="col">Học sinh</th>
              <th scope="col">Khoản thu</th>
              <th scope="col">Số tiền</th>
              <th scope="col">Nội dung chuyển khoản</th>
              <th scope="col">Phụ huynh báo lúc</th>
              <th scope="col">Xác nhận</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(({ student, fee }) => (
              <tr key={`${student.id}-${fee.id}`}>
                <td>
                  <strong>{student.name}</strong>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {student.id} • {student.class}
                  </div>
                </td>
                <td>{fee.name}</td>
                <td style={{ fontWeight: 700 }}>{formatVnd(fee.amount)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  {fee.paymentReference || '—'}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Clock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {fee.declaredAt ? new Date(fee.declaredAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', gap: 6, fontSize: '0.82rem' }}
                    onClick={() =>
                      confirmFeePayment(student.id, fee.id, userSession?.username || 'admin')
                    }
                  >
                    <Check size={14} />
                    Đã nhận tiền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
