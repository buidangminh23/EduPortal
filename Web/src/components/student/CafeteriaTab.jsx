import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Utensils, Star } from 'lucide-react';

export default function CafeteriaTab({ student }) {
  const { cafeteriaMenu, cafeteriaRegistrations, cafeteriaFeedback, submitMealFeedback } = useContext(AppContext);
  const [mealRateInput, setMealRateInput] = useState(5);
  const [mealCommentInput, setMealCommentInput] = useState('');

  const handleMealFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!mealCommentInput.trim()) {
      alert('Vui lòng nhập nhận xét về bữa ăn!');
      return;
    }
    submitMealFeedback(student.id, mealRateInput, mealCommentInput);
    setMealCommentInput('');
    alert('Cảm ơn bạn đã gửi phản hồi bữa ăn bán trú ngày hôm nay!');
  };

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      <div>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
          <Utensils size={18} color="var(--accent-primary)" />
          <span>Thực đơn Bán Trú & Dinh Dưỡng</span>
        </h2>

        {cafeteriaMenu && cafeteriaMenu.find(m => m.date === '2026-06-03') ? (() => {
          const todayMenu = cafeteriaMenu.find(m => m.date === '2026-06-03');
          const todayReg = cafeteriaRegistrations && cafeteriaRegistrations.find(r => r.studentId === student.id && r.date === '2026-06-03');
          const isRegistered = todayReg && todayReg.status === 'registered';

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: isRegistered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: isRegistered ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trạng thái đăng ký ăn hôm nay:</div>
                  <strong style={{ fontSize: '1rem', color: isRegistered ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                    {isRegistered ? `Đã đăng ký (${todayReg.mealType === 'Standard' ? 'Suất Thường' : 'Suất Chay'})` : 'Chưa đăng ký suất ăn bán trú'}
                  </strong>
                </div>
                {isRegistered && <span className="badge badge-success">Đã thanh toán qua ví</span>}
              </div>

              <div style={{ padding: '18px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--accent-primary)' }}>{todayMenu.name}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {todayMenu.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed rgba(0,0,0,0.05)', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.cal} kcal (Đạm: {item.p} • Xơ: {item.c} • Béo: {item.f})</span>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', fontWeight: 700 }}>Tổng quan năng lượng & Dinh dưỡng bữa trưa</h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="100" height="100" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeDasharray="38 100" strokeLinecap="round" />
                      <text x="18" y="17.5" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="var(--text-primary)">{todayMenu.totalCal}</text>
                      <text x="18" y="22.5" fontSize="3" textAnchor="middle" fill="var(--text-muted)">kcal</text>
                    </svg>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                        <span>Chất đạm (Protein)</span>
                        <strong>{todayMenu.protein}</strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: '70%', height: '100%', background: '#3b82f6' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                        <span>Tinh bột (Carbohydrates)</span>
                        <strong>{todayMenu.carbs}</strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: '60%', height: '100%', background: '#f59e0b' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                        <span>Chất béo (Lipid)</span>
                        <strong>{todayMenu.fat}</strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: '40%', height: '100%', background: '#ec4899' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : (
          <p style={{ color: 'var(--text-muted)' }}>Không có thông tin thực đơn bán trú hôm nay.</p>
        )}
      </div>

      {/* Feedback Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'white' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', fontWeight: 700 }}>Đánh giá bữa ăn bán trú hôm nay</h3>
          <form onSubmit={handleMealFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Chọn mức độ hài lòng (1 - 5 sao)</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setMealRateInput(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Star size={24} fill={mealRateInput >= star ? '#eab308' : 'none'} color={mealRateInput >= star ? '#eab308' : '#cbd5e1'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ý kiến đóng góp / phản hồi</label>
              <textarea className="form-control" rows="3" placeholder="Đồ ăn hôm nay thế nào? Em có thích món này không? Hãy gửi phản hồi cho nhà bếp nhé..." value={mealCommentInput} onChange={e => setMealCommentInput(e.target.value)} style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Gửi phản hồi bữa ăn</button>
          </form>
        </div>

        {/* Past Meal Feedbacks */}
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'white' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', fontWeight: 700 }}>Nhận xét bữa ăn gần đây</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
            {cafeteriaFeedback && cafeteriaFeedback.filter(f => f.studentId === student.id).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Chưa có đánh giá bữa ăn nào.</p>
            ) : (
              cafeteriaFeedback && cafeteriaFeedback.filter(f => f.studentId === student.id).map(item => (
                <div key={item.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ngày {item.date.split('-').reverse().join('/')}</span>
                    <div style={{ display: 'flex', gap: '1px' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} fill={item.rating >= s ? '#eab308' : 'none'} color={item.rating >= s ? '#eab308' : '#cbd5e1'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{item.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
