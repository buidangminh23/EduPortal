import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Calendar, Cpu, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import { isTeacher } from '../lib/roles';

export default function TimetableGenerator() {
  const { currentRole, timetableSlots, generateSmartTimetable, swapTimetableSlots } = useContext(AppContext);
  
  const isAdmin = currentRole === 'admin' || isTeacher(currentRole);

  const [selectedClass, setSelectedClass] = useState('12A1');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGenerate = () => {
    setAiGenerating(true);
    // Simulate AI scheduling solver lag (1.2s)
    setTimeout(() => {
      generateSmartTimetable();
      setAiGenerating(false);
      alert('AI đã giải xong xung đột lịch dạy và phân bổ thời khóa biểu tự động!');
    }, 1200);
  };

  const handleCellClick = (slot) => {
    if (!isAdmin) return; // Only admin can edit/swap

    if (!selectedSlotId) {
      // First click: select the slot
      setSelectedSlotId(slot.id);
    } else {
      // Second click: swap
      if (selectedSlotId !== slot.id) {
        swapTimetableSlots(selectedSlotId, slot.id);
        setSelectedSlotId(null);
      } else {
        setSelectedSlotId(null); // Cancel select
      }
    }
  };

  // Days and Periods
  const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  const PERIODS = [1, 2, 3, 4];
  const PERIOD_TIMES = {
    1: '07:30 - 08:15',
    2: '08:25 - 09:10',
    3: '09:30 - 10:15',
    4: '10:25 - 11:10'
  };

  // Filter slots for selected class
  const classSlots = timetableSlots?.filter(slot => slot.classTarget === selectedClass) || [];

  const getSlot = (day, period) => {
    return classSlots.find(s => s.dayOfWeek === day && s.period === period);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.4rem', color: '#1e293b' }}>
            📅 Lịch Xếp Thời Khóa Biểu Thông Minh AI
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Hệ thống phân bổ lịch giảng dạy, tránh trùng giờ giáo viên và tự động hóa sắp xếp tiết.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Class Filter selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Xem Lớp:</span>
            <select
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedSlotId(null); }}
              className="form-control"
              style={{ padding: '6px 12px', width: 'auto', fontSize: '0.85rem', background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
            >
              <option value="12A1">Lớp 12A1</option>
              <option value="12A2">Lớp 12A2</option>
              <option value="11A1">Lớp 11A1</option>
              <option value="10A1">Lớp 10A1</option>
            </select>
          </div>

          {/* AI Generator trigger button for BGH admin */}
          {isAdmin && (
            <button
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              className="btn btn-primary"
              style={{
                height: 38,
                fontSize: '0.82rem',
                gap: 6,
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                border: 'none',
                boxShadow: '0 4px 12px -3px rgba(79, 70, 229, 0.3)'
              }}
            >
              {aiGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Xếp lịch tự động...
                </>
              ) : (
                <>
                  <Cpu size={14} /> Chạy xếp lịch AI
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Grid instruction box */}
      {isAdmin && classSlots.length > 0 && (
        <div style={{ 
          background: 'rgba(79, 70, 229, 0.04)', 
          border: '1px solid rgba(79, 70, 229, 0.08)', 
          padding: '10px 14px', 
          borderRadius: 12, 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16
        }}>
          <ArrowLeftRight size={14} color="var(--accent-primary)" />
          <span>
            {selectedSlotId 
              ? 'Đang chọn 1 tiết học. Nhấp vào tiết thứ hai để tiến hành hoán đổi chỗ chéo.' 
              : 'Mẹo BGH: Bạn có thể click vào 2 tiết học bất kỳ trên lưới để hoán đổi lịch giảng dạy cho nhau.'
            }
          </span>
        </div>
      )}

      {/* Main Grid Calendar Layout */}
      {aiGenerating ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 20px',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.4)',
          gap: 16
        }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '4px solid rgba(79, 70, 229, 0.1)', 
            borderTopColor: 'var(--accent-primary)', 
            borderRadius: '50%',
            animation: 'spin 1s infinite linear' 
          }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Đang tối ưu hóa phân bổ thời khóa biểu...</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Kiểm tra xung đột phòng học và giờ giảng của giáo viên...</div>
          </div>
        </div>
      ) : classSlots.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 20px',
          border: '1px dashed rgba(0,0,0,0.08)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.4)',
          color: 'var(--text-muted)'
        }}>
          <Calendar size={48} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chưa có thời khóa biểu cho lớp này.</div>
          {isAdmin ? (
            <button 
              onClick={handleAiGenerate} 
              className="btn btn-secondary" 
              style={{ marginTop: 14, fontSize: '0.8rem', padding: '8px 20px' }}
            >
              Chạy thuật toán xếp lịch AI tự động
            </button>
          ) : (
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Vui lòng đợi BGH phê duyệt xếp lịch.</div>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 8, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ 
                  width: 120, 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(0,0,0,0.04)', 
                  borderRadius: 10,
                  padding: 12,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)'
                }}>
                  Tiết / Giờ
                </th>
                {DAYS.map(day => (
                  <th 
                    key={day} 
                    style={{ 
                      background: 'rgba(79, 70, 229, 0.05)', 
                      border: '1px solid rgba(79, 70, 229, 0.1)', 
                      borderRadius: 10,
                      padding: 12,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textAlign: 'center'
                    }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => (
                <tr key={period}>
                  {/* Time column */}
                  <td style={{ 
                    background: 'rgba(255,255,255,0.8)', 
                    border: '1px solid rgba(0,0,0,0.04)', 
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tiết {period}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{PERIOD_TIMES[period]}</div>
                  </td>
                  
                  {/* Slots column for each day */}
                  {DAYS.map(day => {
                    const slot = getSlot(day, period);
                    const isSelected = selectedSlotId === slot?.id;
                    
                    return (
                      <td 
                        key={day}
                        onClick={() => slot && handleCellClick(slot)}
                        style={{ 
                          background: isSelected 
                            ? 'rgba(99, 102, 241, 0.12)' 
                            : '#fff', 
                          border: isSelected 
                            ? '2px solid var(--accent-primary)' 
                            : '1px solid rgba(0,0,0,0.04)', 
                          borderRadius: 14,
                          padding: 12,
                          textAlign: 'center',
                          cursor: isAdmin ? 'pointer' : 'default',
                          transition: 'all 0.15s',
                          boxShadow: isSelected ? '0 0 10px rgba(99,102,241,0.15)' : 'none',
                          height: 80
                        }}
                        onMouseEnter={e => {
                          if (isAdmin && !isSelected) {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (isAdmin && !isSelected) {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                          }
                        }}
                      >
                        {slot ? (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <div style={{ 
                              fontSize: '0.82rem', 
                              fontWeight: 700, 
                              color: slot.subject === 'Toán học' ? '#4f46e5' : slot.subject === 'Ngữ văn' ? '#ec4899' : slot.subject === 'Vật lý' ? '#10b981' : '#0ea5e9' 
                            }}>
                              {slot.subject}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: 4 }}>
                              GV: {slot.teacherName}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              Phòng: {slot.room}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Trống</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
