import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Users } from 'lucide-react';

export default function ClubsTab({ student }) {
  const { clubs, clubApplications, submitClubApplication } = useContext(AppContext);
  const [selectedClubId, setSelectedClubId] = useState(clubs && clubs.length > 0 ? clubs[0].id : '');
  const [clubAppIntro, setClubAppIntro] = useState('');

  const myClubsApps = clubApplications ? clubApplications.filter(a => a.studentId === student.id) : [];

  const handleClubApply = (e) => {
    e.preventDefault();
    if (!clubAppIntro.trim()) return;
    submitClubApplication(student.id, selectedClubId, clubAppIntro);
    setClubAppIntro('');
    alert('Đã nộp đơn ứng tuyển CLB thành công! Ban giám hiệu sẽ rà soát đơn duyệt sớm nhất.');
  };

  return (
    <div className="glass-panel animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Users size={20} color="var(--accent-primary)" />
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Câu Lạc Bộ Học Sinh</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* List of Clubs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {clubs && clubs.map((club) => (
            <div key={club.id} style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{club.name}</h4>
                <span className={`badge ${club.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {club.status === 'active' ? 'Đang hoạt động' : 'Đang chờ duyệt'}
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {club.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Thành viên: <strong>{club.membersCount} học sinh</strong></span>
                <span>Ngân sách năm học: <strong>{club.budgetApproved > 0 ? `${club.budgetApproved.toLocaleString()} VNĐ` : 'Chờ duyệt'}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '18px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem' }}>Đăng ký tham gia Câu Lạc Bộ</h4>

            <form onSubmit={handleClubApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Chọn CLB muốn ứng tuyển</label>
                <select
                  className="form-control"
                  value={selectedClubId}
                  onChange={e => setSelectedClubId(e.target.value)}
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  {clubs && clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Giới thiệu bản thân & Lý do ứng tuyển</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={clubAppIntro}
                  onChange={e => setClubAppIntro(e.target.value)}
                  placeholder="Hãy giới thiệu ngắn về sở thích và nguyện vọng đóng góp CLB của em..."
                  required
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Nộp đơn đăng ký CLB
              </button>
            </form>
          </div>

          {/* History of applications */}
          <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Lịch sử đăng ký CLB</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myClubsApps.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Chưa nộp đơn CLB nào.</p>
              ) : (
                myClubsApps.map(app => (
                  <div key={app.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{app.clubName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lý do: {app.introduction.slice(0, 20)}...</span>
                    </div>
                    <span className={`badge ${app.status === 'approved' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>
                      {app.status === 'approved' ? 'Đã nhận' : app.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
