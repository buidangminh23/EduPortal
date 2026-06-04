import { useContext, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Signature, 
  Award, 
  FileSignature, 
  CheckCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export default function ClassJournal() {
  const { 
    journalEntries, 
    addJournalEntry, 
    signJournalEntry, 
    teachers,
    currentRole 
  } = useContext(AppContext);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showSignModal, setShowSignModal] = useState(null); // stores entry ID if active
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Grade & Class filters state (Default: Khối 12, Lớp 12A1)
  const [selectedGrade, setSelectedGrade] = useState('12');
  const [selectedClass, setSelectedClass] = useState('12A1');

  const [newEntry, setNewEntry] = useState({
    day: 'Thứ Hai',
    period: 1,
    subject: 'Toán học',
    teacher: 'Nguyễn Minh Triết',
    content: '',
    rating: 'A',
    comment: ''
  });

  // Handle grade change and auto-adjust class selection
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    if (grade === '12') setSelectedClass('12A1');
    else if (grade === '11') setSelectedClass('11A1');
    else if (grade === '10') setSelectedClass('10A1');
  };

  // Get classes list based on selected grade
  const getClassOptions = () => {
    if (selectedGrade === '12') return ['12A1', '12A2'];
    if (selectedGrade === '11') return ['11A1'];
    if (selectedGrade === '10') return ['10A1'];
    return [];
  };

  // Filter journal entries based on selected Class
  const classEntries = journalEntries ? journalEntries.filter(entry => entry.class === selectedClass) : [];
  const totalPeriods = classEntries.length;
  
  const getRatingValue = (r) => {
    if (r === 'A') return 10;
    if (r === 'B') return 8;
    if (r === 'C') return 6;
    return 4;
  };

  const totalPoints = classEntries.reduce((acc, curr) => acc + getRatingValue(curr.rating), 0);
  const averageRating = totalPeriods > 0 ? (totalPoints / totalPeriods).toFixed(1) : 0;

  const handleCreateEntry = (e) => {
    e.preventDefault();
    if (!newEntry.content.trim()) return;
    
    // Save new entry with active class association
    addJournalEntry({
      ...newEntry,
      class: selectedClass
    });

    setShowAddEntry(false);
    setNewEntry({
      day: 'Thứ Hai',
      period: 1,
      subject: 'Toán học',
      teacher: 'Nguyễn Minh Triết',
      content: '',
      rating: 'A',
      comment: ''
    });
    alert(`Đã thêm bài học vào sổ đầu bài lớp ${selectedClass} thành công!`);
  };

  // Canvas Drawing Methods for signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'var(--accent-primary)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL();
    
    signJournalEntry(showSignModal, signatureDataUrl);
    setShowSignModal(null);
    alert('Đã ký tên xác nhận tiết học thành công!');
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Sổ Đầu Bài Điện Tử</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tuần 35 • Lớp {selectedClass} • Điểm thi đua trung bình: {averageRating}/10</p>
        </div>
        
        {/* Only Admin/Principal and Teacher can add entries */}
        {(currentRole === 'admin' || currentRole === 'teacher') && (
          <button onClick={() => setShowAddEntry(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Ghi sổ đầu bài</span>
          </button>
        )}
      </div>

      {/* Grade and Class Selector bar */}
      <div style={{ 
        background: 'rgba(79, 70, 229, 0.03)', 
        border: '1px solid rgba(79, 70, 229, 0.08)',
        borderRadius: '14px', 
        padding: '16px', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Grade Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chọn Khối:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['12', '11', '10'].map(grade => (
              <button
                key={grade}
                onClick={() => handleGradeChange(grade)}
                className={`btn ${selectedGrade === grade ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                Khối {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Class Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chọn Sổ Lớp:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {getClassOptions().map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`btn ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                Sổ Lớp {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>SỐ TIẾT ĐÃ HỌC</span>
            <div style={{ fontSize: '2rem', marginTop: '6px', fontWeight: 'bold' }}>{totalPeriods} tiết</div>
          </div>
          <div className="stat-icon"><BookOpen size={24} /></div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ĐIỂM TRUNG BÌNH TUẦN</span>
            <div style={{ fontSize: '2rem', marginTop: '6px', fontWeight: 'bold' }}>{averageRating} / 10</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'var(--accent-secondary-glow)' }}><TrendingUp size={24} /></div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>TUYÊN DƯƠNG TRONG TUẦN</span>
            <div style={{ fontSize: '1.1rem', marginTop: '6px', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
              {selectedClass === '12A1' ? 'Nguyễn Hoàng Nam (Phát biểu)' : 'Lớp học chăm ngoan'}
            </div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}><Award size={24} /></div>
        </div>
      </div>

      {/* Journal Table grid */}
      <div className="glass-panel" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Tiết dạy trong tuần Lớp {selectedClass}</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '900px' }}>
            {/* Header */}
            <div className="journal-grid journal-header">
              <div>Thứ</div>
              <div>Tiết</div>
              <div>Môn học</div>
              <div>Nội dung bài học</div>
              <div>Xếp loại</div>
              <div>Nhận xét & Chữ ký</div>
            </div>

            {/* Rows */}
            {classEntries.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có tiết dạy nào được ghi nhận cho lớp {selectedClass} trong tuần này.
              </div>
            ) : (
              classEntries.map(entry => (
                <div key={entry.id} className="journal-grid journal-row">
                  <div style={{ fontWeight: 600 }}>{entry.day}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Tiết {entry.period}</div>
                  <div><span className="badge badge-info">{entry.subject}</span></div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{entry.content}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Giáo viên: {entry.teacher}</div>
                  </div>
                  <div>
                    <span className={`badge ${
                      entry.rating === 'A' ? 'badge-success' : 
                      entry.rating === 'B' ? 'badge-info' : 
                      entry.rating === 'C' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      Loại {entry.rating} ({getRatingValue(entry.rating)}đ)
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{entry.comment || 'Không có nhận xét'}</div>
                    
                    {entry.signed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={entry.signature} alt="Signature" style={{ height: '24px', maxWidth: '80px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle size={10} /> Đã ký
                        </span>
                      </div>
                    ) : (
                      // Only let Teacher or Admin sign
                      (currentRole === 'teacher' || currentRole === 'admin') ? (
                        <button 
                          onClick={() => setShowSignModal(entry.id)} 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                        >
                          <FileSignature size={12} />
                          <span>Ký sổ</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>Chưa ký nhận</span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Ghi Tiết Học Lớp {selectedClass}</h2>
            <form onSubmit={handleCreateEntry}>
              <div className="form-group">
                <label className="form-label">Thứ trong tuần</label>
                <select 
                  className="form-control"
                  value={newEntry.day}
                  onChange={e => setNewEntry({...newEntry, day: e.target.value})}
                >
                  <option value="Thứ Hai">Thứ Hai</option>
                  <option value="Thứ Ba">Thứ Ba</option>
                  <option value="Thứ Tư">Thứ Tư</option>
                  <option value="Thứ Năm">Thứ Năm</option>
                  <option value="Thứ Sáu">Thứ Sáu</option>
                  <option value="Thứ Bảy">Thứ Bảy</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tiết học</label>
                  <select 
                    className="form-control"
                    value={newEntry.period}
                    onChange={e => setNewEntry({...newEntry, period: parseInt(e.target.value)})}
                  >
                    {[1,2,3,4,5].map(p => <option key={p} value={p}>Tiết {p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Môn học</label>
                  <select 
                    className="form-control"
                    value={newEntry.subject}
                    onChange={e => setNewEntry({...newEntry, subject: e.target.value})}
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Giáo viên giảng dạy</label>
                <select 
                  className="form-control"
                  value={newEntry.teacher}
                  onChange={e => setNewEntry({...newEntry, teacher: e.target.value})}
                >
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung bài dạy</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newEntry.content}
                  onChange={e => setNewEntry({...newEntry, content: e.target.value})}
                  placeholder="Ví dụ: Ôn tập đại số bài số 3..." 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Xếp loại tiết học</label>
                  <select 
                    className="form-control"
                    value={newEntry.rating}
                    onChange={e => setNewEntry({...newEntry, rating: e.target.value})}
                  >
                    <option value="A">Loại A (10đ)</option>
                    <option value="B">Loại B (8đ)</option>
                    <option value="C">Loại C (6đ)</option>
                    <option value="D">Loại D (4đ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nhận xét chi tiết</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newEntry.comment}
                    onChange={e => setNewEntry({...newEntry, comment: e.target.value})}
                    placeholder="Lớp trật tự nghe giảng..." 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddEntry(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu bài dạy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature drawing Modal */}
      {showSignModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Signature size={18} color="var(--accent-primary)" />
              <span>Vẽ Chữ Ký Giáo Viên</span>
            </h2>
            
            <div className="signature-box" style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <canvas
                ref={canvasRef}
                width={440}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              * Dùng chuột hoặc ngón tay (trên màn hình cảm ứng) vẽ chữ ký của bạn vào khung bên trên.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={clearCanvas} 
                className="btn btn-secondary" 
                style={{ flex: 1, gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>Vẽ lại</span>
              </button>
              <button 
                type="button" 
                onClick={saveSignature} 
                className="btn btn-primary" 
                style={{ flex: 1, gap: '6px' }}
              >
                <CheckCircle size={14} />
                <span>Xác nhận ký</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowSignModal(null)} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '10px' }}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
