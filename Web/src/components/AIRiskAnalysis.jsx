import { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { AlertTriangle, CheckCircle, ChevronRight, Filter, Sparkles } from 'lucide-react';

export default function AIRiskAnalysis() {
  const { students, attendanceLogs } = useContext(AppContext);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Group classes
  const classesList = useMemo(() => {
    const list = new Set(students?.map(s => s.class) || []);
    return ['All', ...Array.from(list)];
  }, [students]);

  // Risk calculation logic
  const calculateStudentRisk = useCallback((student) => {
    // Average grades
    const grades = Object.values(student.grades || {});
    const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    
    // Absence count from attendanceLogs
    const absences = attendanceLogs 
      ? attendanceLogs.filter(a => a.studentId === student.id && a.status !== 'present' && a.status !== 'late').length 
      : 0;
      
    // Unpaid fee status
    const unpaid = student.feeStatus 
      ? student.feeStatus.filter(f => !f.paid).length 
      : 0;
    
    let score = 0;
    if (avg < 6.5) score += 40;
    else if (avg < 7.5) score += 15;
    
    if (absences >= 3) score += 30;
    else if (absences >= 1) score += 10;
    
    if (unpaid >= 2) score += 20;
    else if (unpaid >= 1) score += 5;
    
    score = Math.min(score, 100);
    
    let level = 'Low'; // Low | Medium | High
    let color = '#10b981'; // green
    let label = 'Ổn định';
    let recommendations = 'Học sinh đang tiến triển tốt. Tiếp tục duy trì.';
    
    if (score >= 60) {
      level = 'High';
      color = '#ef4444'; // red
      label = 'Nguy cơ Cao';
      recommendations = 'Học sinh cần được gặp gỡ tư vấn tâm lý ngay. Thông báo phụ huynh về tình trạng học tập. Xem xét hỗ trợ học phí.';
    } else if (score >= 25) {
      level = 'Medium';
      color = '#f59e0b'; // yellow
      label = 'Trung bình';
      recommendations = 'Tăng cường theo dõi tiến độ học tập. Khuyến khích tham gia nhóm học tập.';
    }
    
    return {
      score,
      level,
      color,
      label,
      avg: avg.toFixed(1),
      absences,
      unpaid,
      recommendations
    };
  }, [attendanceLogs]);

  const analyzedStudents = useMemo(() => {
    if (!students) return [];
    return students.map(s => {
      const risk = calculateStudentRisk(s);
      return {
        ...s,
        risk
      };
    });
  }, [students, calculateStudentRisk]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return analyzedStudents.filter(s => {
      const classMatch = selectedClass === 'All' || s.class === selectedClass;
      const riskMatch = selectedRisk === 'All' || s.risk.level === selectedRisk;
      return classMatch && riskMatch;
    });
  }, [analyzedStudents, selectedClass, selectedRisk]);

  // Stats
  const stats = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    analyzedStudents.forEach(s => {
      if (s.risk.level === 'High') high++;
      else if (s.risk.level === 'Medium') medium++;
      else low++;
    });
    return { high, medium, low, total: analyzedStudents.length };
  }, [analyzedStudents]);

  return (
    <div className="glass-panel animate-fade" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-ink)' }}>
            <AlertTriangle size={24} />
            <span>Phân Tích Nguy Cơ Học Lực AI</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hệ thống tự động chấm điểm nguy cơ học tập dựa trên điểm số, chuyên cần và học phí.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 500 }}>Nguy cơ Cao</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#b91c1c' }}>{stats.high}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#f59e0b', color: '#fff', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 500 }}>Nguy cơ Trung bình</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#b45309' }}>{stats.medium}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#10b981', color: '#fff', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 500 }}>Học tập Ổn định</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#047857' }}>{stats.low}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <Filter size={16} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bộ lọc:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>Lớp:</label>
          <select 
            className="form-control" 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '6px 12px', minWidth: '120px' }}
          >
            {classesList.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'Tất cả lớp' : `Lớp ${c}`}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>Mức nguy cơ:</label>
          <select 
            className="form-control" 
            value={selectedRisk} 
            onChange={(e) => setSelectedRisk(e.target.value)}
            style={{ padding: '6px 12px', minWidth: '150px' }}
          >
            <option value="All">Tất cả</option>
            <option value="High">Nguy cơ Cao</option>
            <option value="Medium">Trung bình</option>
            <option value="Low">Ổn định</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '3fr 2fr' : '1fr', gap: '20px', transition: 'all 0.3s ease' }}>
        {/* Table list */}
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '16px' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ và tên</th>
                <th>Lớp</th>
                <th>Điểm TB</th>
                <th>Vắng học</th>
                <th>Chưa đóng phí</th>
                <th>Chỉ số Nguy cơ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr 
                    key={s.id} 
                    style={{ cursor: 'pointer', background: selectedStudent?.id === s.id ? 'var(--accent-soft)' : 'transparent' }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td style={{ fontWeight: 600 }}>{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.class}</td>
                    <td><span className="badge badge-info">{s.risk.avg}</span></td>
                    <td>
                      <span className={`badge ${s.risk.absences >= 3 ? 'badge-danger' : s.risk.absences > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {s.risk.absences} buổi
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.risk.unpaid >= 2 ? 'badge-danger' : s.risk.unpaid > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {s.risk.unpaid} khoản
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-2)', borderRadius: '99px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${s.risk.score}%`, height: '100%', background: s.risk.color, borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.risk.score}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        background: s.risk.level === 'High' ? 'rgba(239, 68, 68, 0.12)' : s.risk.level === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: s.risk.color,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {s.risk.label}
                      </span>
                    </td>
                    <td>
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedStudent && (
          <div className="glass-panel animate-fade" style={{ padding: '20px', borderLeft: `4px solid ${selectedStudent.risk.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--accent-ink)' }}>{selectedStudent.name}</h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mã HS: {selectedStudent.id} | Lớp {selectedStudent.class}</span>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                Đóng
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Điểm Trung Bình</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', color: parseFloat(selectedStudent.risk.avg) < 6.5 ? '#ef4444' : 'var(--text-primary)' }}>
                  {selectedStudent.risk.avg}
                </div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Điểm chuyên cần</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', color: selectedStudent.risk.absences >= 3 ? '#ef4444' : 'var(--text-primary)' }}>
                  Vắng {selectedStudent.risk.absences} buổi
                </div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Học phí chưa nộp</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', color: selectedStudent.risk.unpaid >= 1 ? '#f59e0b' : 'var(--text-primary)' }}>
                  {selectedStudent.risk.unpaid} khoản
                </div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Độ nguy cơ học tập</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', color: selectedStudent.risk.color }}>
                  {selectedStudent.risk.score}%
                </div>
              </div>
            </div>

            {/* AI Advisor Card */}
            <div style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, rgba(255,255,255,0.4) 100%)', border: '1px solid rgba(79, 70, 229, 0.15)', borderRadius: '16px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-ink)' }}>
                <Sparkles size={16} />
                <span>Khuyến nghị từ AI Advisor</span>
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                &ldquo;{selectedStudent.risk.recommendations}&rdquo;
              </p>
            </div>
            
            {/* Subject grades breakdown if available */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Chi tiết điểm số</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(selectedStudent.grades || {}).map(([subject, grade]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--bg-app)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{subject}</span>
                    <span className={`badge ${grade < 6.5 ? 'badge-danger' : grade >= 8.0 ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 600 }}>
                      {grade.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
