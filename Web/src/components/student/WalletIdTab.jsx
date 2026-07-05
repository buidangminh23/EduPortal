import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Wallet, Sparkles, RefreshCw } from 'lucide-react';

export default function WalletIdTab({ student }) {
  const { studentWallets, spendStudentWallet, topUpStudentWallet } = useContext(AppContext);
  const [idCardFlipped, setIdCardFlipped] = useState(false);
  const [canteenItem, setCanteenItem] = useState('Nước ngọt');
  const [canteenPrice, setCanteenPrice] = useState(15000);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50000);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const handleCanteenPurchase = (e) => {
    e.preventDefault();
    spendStudentWallet(student.id, canteenPrice, `Mua ${canteenItem} tại Canteen`);
  };

  const handleTopUpConfirm = () => {
    setIsProcessingTopUp(true);
    setTimeout(() => {
      topUpStudentWallet(student.id, topUpAmount);
      setIsProcessingTopUp(false);
      setShowTopUpModal(false);
      alert(`Đã nạp thành công ${topUpAmount.toLocaleString()}đ vào ví của ${student.name}!`);
    }, 1500);
  };

  const wallet = studentWallets[student.id] || { balance: 0, dailyLimit: 100000, transactions: [] };
  const todaySpend = wallet.transactions ? wallet.transactions.filter(t => t.date === new Date().toISOString().split('T')[0] && t.type === 'spend').reduce((sum, t) => sum + t.amount, 0) : 0;
  const remainLimit = Math.max(0, wallet.dailyLimit - todaySpend);

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
      {/* 3D Student ID Card Mockup */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Thẻ Học Sinh Số (3D Virtual ID)</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Bấm trực tiếp vào thẻ hoặc nút bên dưới để lật mặt thẻ</p>
        </div>

        {/* 3D Perspective Card Container */}
        <div
          className="student-card-3d-wrap"
          onClick={() => setIdCardFlipped(!idCardFlipped)}
          style={{
            width: '320px',
            height: '200px',
            perspective: '1000px',
            cursor: 'pointer',
            margin: '10px 0'
          }}
        >
          <div
            className={`student-card-3d-inner ${idCardFlipped ? 'flipped' : ''}`}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              textAlign: 'center',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: idCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* FRONT SIDE OF ID CARD */}
            <div
              className="card-front"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.85), rgba(139, 92, 246, 0.85))',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                padding: '16px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>EduPortal School</span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '99px' }}>THPT Quốc Gia</span>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', margin: '14px 0' }}>
                <img
                  src={student.avatarUrl}
                  alt="Avatar"
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid white' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '1.05rem', lineHeight: '1.2' }}>{student.name}</strong>
                  <span style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>Mã HS: {student.id}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>Lớp học: {student.class}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>NIÊN KHÓA</div>
                  <strong style={{ fontSize: '0.75rem' }}>2023 - 2026</strong>
                </div>
                <span style={{ fontSize: '0.65rem', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>THẺ HOẠT ĐỘNG</span>
              </div>
            </div>

            {/* BACK SIDE OF ID CARD */}
            <div
              className="card-back"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.95))',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                padding: '16px',
                color: 'white',
                transform: 'rotateY(180deg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', flex: 1, paddingRight: '12px' }}>
                <strong style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ví điện tử tích hợp</strong>
                <p style={{ fontSize: '0.6rem', opacity: 0.7, margin: '6px 0', lineHeight: '1.3' }}>
                  Dùng quét mã QR tại căng tin, thư viện, hoặc cổng soát vé bán trú của trường học.
                </p>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>Hiệu lực đến</div>
                  <strong style={{ fontSize: '0.7rem' }}>30/06/2026</strong>
                </div>
              </div>

              <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="85" height="85" viewBox="0 0 29 29" style={{ display: 'block' }}>
                  <path d="M0 0h9v9H0zm1 1v7h7V1zm8 8h1v1h-1zm1 1v1h1v1h-1v-2zm-1 2H7v1H6v-1H5v2H4v-1H3v1H1v-1H0v2h2v1h1v-1h2v1h1v-1h1v1h1v-2H8v-1zm1-9h9v9H9zm1 1v7h7V1zm-1 8H0v9h9zm1 1v7h7V10zm8 0h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2zm2 1h1v1h-1zm-2 2h1v1h-1zm1 1v1H9v-1h1v-1h7v1zm1 1h1v1h-1zM20 0h9v9h-9zm1 1v7h7V1zm-1 8h1v1h-1zm2 1h2v1h-2zm-2 2h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2z" fill="#000" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            setIdCardFlipped(!idCardFlipped);
          }}
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
        >
          Lật mặt thẻ
        </button>
      </div>

      {/* Wallet Panel & Canteen Simulation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Wallet Info Card */}
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))',
            border: '1px solid var(--border-card)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ví điện tử cá nhân</span>
            </div>
            <span className="badge badge-info" style={{ fontWeight: 700 }}>Học sinh</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>SỐ DƯ HIỆN TẠI</div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
                {wallet.balance.toLocaleString()}đ
              </strong>
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="btn btn-secondary btn-sm animate-pulse"
                style={{
                  marginTop: '8px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)',
                  cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                📥 Nạp Tiền VietQR
              </button>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>HẠN MỨC NGÀY CÒN LẠI</div>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {remainLimit.toLocaleString()}đ
              </strong>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Giới hạn ngày: {wallet.dailyLimit.toLocaleString()}đ</div>
            </div>
          </div>

          {/* Progress bar of limit */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              <span>Tiêu dùng hôm nay: {todaySpend.toLocaleString()}đ</span>
              <span>Hạn mức: {wallet.dailyLimit.toLocaleString()}đ</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (todaySpend / wallet.dailyLimit) * 100)}%`,
                  height: '100%',
                  background: (todaySpend / wallet.dailyLimit) >= 0.85 ? 'var(--accent-danger)' : 'var(--accent-primary)',
                  borderRadius: '99px'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Simulation buy canteen */}
        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-secondary)" />
            <span>Giả lập mua hàng Canteen trường</span>
          </h3>

          <form onSubmit={handleCanteenPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Chọn mặt hàng thanh toán</label>
              <select
                className="form-control"
                onChange={e => {
                  const val = e.target.value;
                  setCanteenItem(val);
                  if (val === 'Snack & Nước ngọt') setCanteenPrice(15000);
                  if (val === 'Bánh mì sườn') setCanteenPrice(25000);
                  if (val === 'Hộp bút màu & Thước kẻ') setCanteenPrice(40000);
                  if (val === 'Sữa tươi Milo') setCanteenPrice(10000);
                }}
                style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
              >
                <option value="Snack & Nước ngọt">Snack & Nước ngọt - 15.000đ</option>
                <option value="Bánh mì sườn">Bánh mì sườn - 25.000đ</option>
                <option value="Hộp bút màu & Thước kẻ">Hộp bút màu & Thước kẻ - 40.000đ</option>
                <option value="Sữa tươi Milo">Sữa tươi Milo - 10.000đ</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(to right, var(--accent-secondary), #10b981)' }}>
              Quét QR ví chi trả {canteenPrice.toLocaleString()}đ
            </button>
          </form>
        </div>

        {/* Transaction Logs */}
        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Lịch sử chi tiêu ví học sinh</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
            {wallet.transactions && wallet.transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Chưa có giao dịch ví nào được thực hiện.</p>
            ) : (
              wallet.transactions && wallet.transactions.map((tx, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{tx.description}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.date.split('-').reverse().join('/')}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: tx.type === 'spend' ? 'var(--accent-danger)' : '#10b981' }}>
                    {tx.type === 'spend' ? '-' : '+'}{tx.amount.toLocaleString()}đ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* VietQR Top Up Modal */}
      {showTopUpModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} className="animate-fade">
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>📥 Nạp tiền qua VietQR</h3>
              <button onClick={() => setShowTopUpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Chọn số tiền cần nạp:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[50000, 100000, 200000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      style={{
                        padding: '10px 4px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '10px',
                        border: `2.5px solid ${topUpAmount === amt ? '#10b981' : '#e2e8f0'}`,
                        background: topUpAmount === amt ? 'rgba(16, 185, 129, 0.05)' : 'white',
                        color: topUpAmount === amt ? '#10b981' : '#475569', cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      {amt.toLocaleString()}đ
                    </button>
                  ))}
                </div>
              </div>

              {/* VietQR Box */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0052cc', letterSpacing: '0.5px' }}>VIET<span style={{ color: '#ea1b25' }}>QR</span> • CHUYỂN KHOẢN NHANH 247</span>
                
                {/* Simulated QR Code SVG */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <svg width="130" height="130" viewBox="0 0 29 29">
                    <path d="M0 0h9v9H0zm1 1v7h7V1zm8 8h1v1h-1zm1 1v1h1v1h-1v-2zm-1 2H7v1H6v-1H5v2H4v-1H3v1H1v-1H0v2h2v1h1v-1h2v1h1v-1h1v1h1v-2H8v-1zm1-9h9v9H9zm1 1v7h7V1zm-1 8H0v9h9zm1 1v7h7V10zm8 0h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2zm2 1h1v1h-1zm-2 2h1v1h-1zm1 1v1H9v-1h1v-1h7v1zm1 1h1v1h-1zM20 0h9v9h-9zm1 1v7h7V1zm-1 8h1v1h-1zm2 1h2v1h-2zm-2 2h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2z" fill="#000" />
                    {/* Tiny VietQR Logo overlay in center */}
                    <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#0052cc" />
                    <rect x="12" y="12" width="5" height="5" rx="1" fill="white" />
                    <circle cx="14.5" cy="14.5" r="1.5" fill="#ea1b25" />
                  </svg>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#475569', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Ngân hàng:</span> <strong>MB Bank (Quân Đội)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Số TK:</span> <strong>190356789012</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Tên TK:</span> <strong>EDUPORTAL SCHOOL</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                    <span>Nội dung:</span> <strong style={{ color: '#ef4444' }}>NAP VIS {student.id} {topUpAmount}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTopUpConfirm}
                disabled={isProcessingTopUp}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 0', fontSize: '0.85rem', fontWeight: 700, background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isProcessingTopUp ? '⏳ Đang kiểm tra giao dịch...' : '✓ Xác nhận đã chuyển khoản (Giả lập)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
