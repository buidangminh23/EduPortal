import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Utensils, Wallet, Plus, CheckCircle, X, Smartphone, 
  Calendar, MessageSquare
} from 'lucide-react';

const BANKS = [
  { name: 'Vietcombank', code: '970436', color: '#007C3E', logo: '🏦' },
  { name: 'VietinBank', code: '970415', color: '#C8102E', logo: '🏧' },
  { name: 'MB Bank', code: '970422', color: '#00417E', logo: '🔵' }
];

export default function CanteenManager() {
  const { 
    currentRole, 
    selectedStudentId, 
    students,
    cafeteriaMenu,
    cafeteriaRegistrations,
    cafeteriaFeedback,
    studentWallets,
    registerCafeteriaMeal,
    submitMealFeedback,
    topUpStudentWallet,
    updateStudentWalletLimit
  } = useContext(AppContext);

  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('100000');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [confirming, setConfirming] = useState(false);

  const [activeDate, setActiveDate] = useState('2026-06-03');
  const [mealType, setMealType] = useState('Standard');
  const [payViaWallet, setPayViaWallet] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedDish, setSelectedDish] = useState('Cơm sườn nướng mật ong');

  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const wallet = studentWallets[student?.id] || { balance: 0, dailyLimit: 100000, transactions: [] };
  const registrations = (cafeteriaRegistrations || []).filter(r => r.studentId === student?.id);

  const handleTopup = (e) => {
    e.preventDefault();
    setConfirming(true);
    setTimeout(() => {
      topUpStudentWallet(student?.id, topupAmount);
      setConfirming(false);
      setTopupModal(false);
      alert('Nạp tiền vào ví căng tin học sinh thành công!');
    }, 1500);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const success = registerCafeteriaMeal(student?.id, activeDate, mealType, payViaWallet);
    if (success) {
      alert('Đăng ký suất ăn căng tin thành công!');
    }
  };

  const handleFeedback = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    submitMealFeedback(selectedDish, rating, comment);
    setComment('');
    alert('Cảm ơn bạn đã gửi đánh giá bữa ăn căng tin!');
  };

  const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.3rem' }}>
            <Utensils size={22} color="#6366f1" /> Căng tin & Suất ăn Học đường
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Xem thực đơn, đăng ký cơm bán trú, quản lý ví thanh toán và nhận xét món ăn
          </p>
        </div>
        
        {/* Cashless Wallet Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(99,102,241,0.06)', padding: '10px 18px', borderRadius: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Wallet size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>VÍ ĐIỆN TỬ HỌC SINH</div>
            <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.05rem' }}>{formatVND(wallet.balance)}</div>
          </div>
          {(currentRole === 'parent' || currentRole === 'admin') && (
            <button className="btn btn-primary" onClick={() => setTopupModal(true)} style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 4 }}>
              <Plus size={12} /> Nạp tiền
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        
        {/* Left Side: Menu and Booking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Weekly Menu Section */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', fontWeight: 700 }}>
              <Calendar size={16} color="#6366f1" /> Thực đơn trong tuần
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {cafeteriaMenu && cafeteriaMenu.map(menu => (
                <div key={menu.id} style={{ 
                  background: activeDate === menu.date ? 'rgba(99,102,241,0.05)' : 'white', 
                  border: activeDate === menu.date ? '1.5px solid #6366f1' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 16, padding: 16, cursor: 'pointer', transition: 'all 0.2s'
                }} onClick={() => setActiveDate(menu.date)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.85rem', color: activeDate === menu.date ? '#6366f1' : 'var(--text-primary)' }}>{menu.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{menu.date.split('-').reverse().slice(0, 2).join('/')}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {menu.items.map((dish, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        🍲 {dish.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({dish.cal} cal)</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 8px', borderRadius: 8, display: 'inline-block', fontWeight: 600 }}>
                    🔥 Tổng calo: {menu.totalCal} kcal
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal Booking Form */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', fontWeight: 700 }}>
              <CheckCircle size={16} color="#10b981" /> Đăng ký cơm bán trú
            </h3>

            <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ngày dùng *</label>
                <select className="form-control" value={activeDate} onChange={e => setActiveDate(e.target.value)} style={{ fontSize: '0.85rem' }}>
                  {cafeteriaMenu && cafeteriaMenu.map(menu => (
                    <option key={menu.id} value={menu.date}>{menu.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Chế độ ăn *</label>
                <select className="form-control" value={mealType} onChange={e => setMealType(e.target.value)} style={{ fontSize: '0.85rem' }}>
                  <option value="Standard">Suất thường (35k)</option>
                  <option value="Vegetarian">Suất chay (30k)</option>
                  <option value="Allergy">Suất ăn kiêng dị ứng (40k)</option>
                </select>
              </div>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="payWallet" checked={payViaWallet} onChange={e => setPayViaWallet(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <label htmlFor="payWallet" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Tự động thanh toán qua ví điện tử học sinh
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 20px' }}>
                  Đăng ký suất ăn
                </button>
              </div>
            </form>
          </div>

          {/* Registrations List */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Danh sách suất ăn đã đăng ký</h3>
            {registrations.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa đăng ký suất ăn nào trong tuần.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {registrations.map(reg => (
                  <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>🍱</span>
                      <div>
                        <strong>Cơm trưa ngày {reg.date.split('-').reverse().join('/')}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chế độ: {reg.mealType} • {formatVND(reg.price)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                        {reg.paid ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Feedback & Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Feedbacks & Reviews */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', fontWeight: 700 }}>
              <MessageSquare size={16} color="#e5c158" /> Đánh giá món ăn căng tin
            </h3>

            {/* Submission form */}
            <form onSubmit={handleFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Chọn món ăn</label>
                  <select className="form-control" value={selectedDish} onChange={e => setSelectedDish(e.target.value)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="Cơm sườn nướng mật ong">Cơm sườn nướng</option>
                    <option value="Phở bò chín Hà Nội">Phở bò chín</option>
                    <option value="Cá hồi sốt Teriyaki">Cá hồi Teriyaki</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Số sao đánh giá</label>
                  <select className="form-control" value={rating} onChange={e => setRating(parseInt(e.target.value))} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Sao</option>
                    <option value="4">⭐⭐⭐⭐ 4 Sao</option>
                    <option value="3">⭐⭐⭐ 3 Sao</option>
                    <option value="2">⭐⭐ 2 Sao</option>
                    <option value="1">⭐ 1 Sao</option>
                  </select>
                </div>
              </div>
              <div>
                <textarea className="form-control" rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Hãy chia sẻ nhận xét của bạn về đồ ăn..." required style={{ fontSize: '0.8rem', resize: 'none' }} />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.78rem', width: '100%', padding: '6px 12px' }}>Gửi nhận xét</button>
            </form>

            {/* List feedbacks */}
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cafeteriaFeedback && cafeteriaFeedback.map(fb => (
                <div key={fb.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', padding: 10, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong>{fb.studentName}</strong>
                    <span style={{ color: '#b45309' }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5-fb.rating)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{fb.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet Limit configuration */}
          {(currentRole === 'parent' || currentRole === 'admin') && (
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem', fontWeight: 700 }}>Hạn mức tiêu dùng trong ngày</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="form-control" value={wallet.dailyLimit} onChange={e => updateStudentWalletLimit(student?.id, parseInt(e.target.value))} style={{ fontSize: '0.82rem', padding: '6px' }}>
                  <option value="50000">50,000đ / ngày</option>
                  <option value="100000">100,000đ / ngày</option>
                  <option value="150000">150,000đ / ngày</option>
                  <option value="200000">200,000đ / ngày</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mã HS: {student?.id}</span>
              </div>
            </div>
          )}

          {/* Wallet Transactions list */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Lịch sử giao dịch ví</h3>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wallet.transactions && wallet.transactions.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có giao dịch nào.</p>
              ) : (
                wallet.transactions && wallet.transactions.map((tx, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'white', borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>{tx.description}</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{tx.date.split('-').reverse().join('/')}</div>
                    </div>
                    <strong style={{ color: tx.type === 'topup' ? 'var(--accent-secondary)' : '#b91c1c' }}>
                      {tx.type === 'topup' ? '+' : '-'}{formatVND(tx.amount)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top-up VietQR Modal */}
      {topupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Nạp tiền ví căng tin qua VietQR</h3>
              <button onClick={() => setTopupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleTopup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Số tiền nạp (VND) *</label>
                <select className="form-control" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}>
                  <option value="50000">50,000 đ</option>
                  <option value="100000">100,000 đ</option>
                  <option value="200000">200,000 đ</option>
                  <option value="500000">500,000 đ</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Ngân hàng chuyển khoản</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {BANKS.map(b => (
                    <button key={b.code} type="button" onClick={() => setSelectedBank(b)} style={{
                      flex: 1, padding: '6px', borderRadius: 8, fontSize: '0.72rem', cursor: 'pointer',
                      border: `1.5px solid ${selectedBank.code === b.code ? b.color : 'rgba(0,0,0,0.08)'}`,
                      background: selectedBank.code === b.code ? `${b.color}10` : 'transparent',
                      color: selectedBank.code === b.code ? b.color : 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      {b.logo} {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code and details */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                <div style={{ width: 100, height: 100, background: '#fff', padding: 6, borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <rect x="0" y="0" width="25" height="25" fill="#1e293b" />
                    <rect x="5" y="5" width="15" height="15" fill="#fff" />
                    <rect x="75" y="0" width="25" height="25" fill="#1e293b" />
                    <rect x="80" y="5" width="15" height="15" fill="#fff" />
                    <rect x="0" y="75" width="25" height="25" fill="#1e293b" />
                    <rect x="5" y="80" width="15" height="15" fill="#fff" />
                    <rect x="35" y="10" width="12" height="20" fill="#1e293b" />
                    <rect x="50" y="40" width="20" height="20" fill="#1e293b" />
                    <rect x="25" y="60" width="30" height="10" fill="#1e293b" />
                  </svg>
                </div>
                <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Số TK: <strong style={{ fontFamily: 'monospace' }}>{selectedBank.code}{student?.id.replace('HS', '8888')}</strong></div>
                  <div>Học sinh: <strong>{student?.name}</strong></div>
                  <div>Nội dung CK: <strong style={{ fontFamily: 'monospace', color: '#6366f1' }}>{student?.id} NAPTIENCANTEEN</strong></div>
                  <div>Số tiền: <strong style={{ color: 'var(--accent-secondary)' }}>{formatVND(parseInt(topupAmount))}</strong></div>
                </div>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 10, fontSize: '0.72rem', color: '#92400e', display: 'flex', gap: 6 }}>
                <Smartphone size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Mở App ngân hàng, quét QR code và chuyển khoản. Sau đó nhấn nút xác nhận bên dưới.</span>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTopupModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={confirming} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {confirming ? 'Đang nạp...' : 'Xác nhận đã chuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
