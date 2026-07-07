import { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { BarChart2, ArrowUpRight, TrendingUp } from 'lucide-react';

const stableTrendOffset = (className) => {
  const seed = [...className].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed % 50) / 100;
};

export default function ClassComparison() {
  const { students } = useContext(AppContext);
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Subjects list
  const subjects = ['All', 'Toán học', 'Ngữ văn', 'Vật lý', 'Tiếng Anh'];

  // Class performance data calculation
  const comparisonData = useMemo(() => {
    if (!students) return [];

    // Group students by class
    const classGroups = {};
    students.forEach(s => {
      if (!classGroups[s.class]) {
        classGroups[s.class] = [];
      }
      classGroups[s.class].push(s);
    });

    const results = Object.entries(classGroups).map(([className, classStudents]) => {
      // Calculate overall average
      let overallSum = 0;
      let overallCount = 0;

      // Calculate subject-specific averages
      const subjectSum = {};
      const subjectCount = {};

      classStudents.forEach(s => {
        Object.entries(s.grades || {}).forEach(([sub, score]) => {
          overallSum += score;
          overallCount++;

          if (!subjectSum[sub]) {
            subjectSum[sub] = 0;
            subjectCount[sub] = 0;
          }
          subjectSum[sub] += score;
          subjectCount[sub]++;
        });
      });

      const overallAvg = overallCount ? (overallSum / overallCount) : 0;
      
      const subjectAverages = {};
      Object.keys(subjectSum).forEach(sub => {
        subjectAverages[sub] = subjectSum[sub] / subjectCount[sub];
      });

      return {
        className,
        studentCount: classStudents.length,
        overallAvg,
        subjectAverages,
        // Mock semester 1 vs semester 2 trend
        sem1: overallAvg - 0.3 + stableTrendOffset(className),
        sem2: overallAvg
      };
    });

    // Sort by selected subject or overall
    return results.sort((a, b) => {
      if (selectedSubject === 'All') {
        return b.overallAvg - a.overallAvg;
      }
      const valA = a.subjectAverages[selectedSubject] || 0;
      const valB = b.subjectAverages[selectedSubject] || 0;
      return valB - valA;
    });

  }, [students, selectedSubject]);

  return (
    <div className="glass-panel animate-fade" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-ink)' }}>
            <BarChart2 size={24} />
            <span>So Sánh Điểm Trung Bình Các Lớp</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Xem và đối chiếu hiệu quả học tập giữa các lớp theo từng môn học.
          </p>
        </div>
      </div>

      {/* Subject Filter Tabs */}
      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`tab-btn ${selectedSubject === sub ? 'active' : ''}`}
          >
            {sub === 'All' ? 'Tất cả môn' : sub}
          </button>
        ))}
      </div>

      {/* Custom CSS Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 600 }}>
          Biểu đồ điểm trung bình {selectedSubject === 'All' ? 'các môn' : `môn ${selectedSubject}`}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {comparisonData.map((d, index) => {
            const val = selectedSubject === 'All' ? d.overallAvg : (d.subjectAverages[selectedSubject] || 0);
            const percent = (val / 10) * 100;
            
            // Color scheme based on rank
            let barColor = 'linear-gradient(90deg, #818cf8 0%, #4f46e5 100%)'; // default indigo
            let rankBadge = null;

            if (index === 0) {
              barColor = 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)'; // Gold for rank 1
              rankBadge = <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>Hạng 1 🏆</span>;
            } else if (index === comparisonData.length - 1 && comparisonData.length > 1) {
              barColor = 'linear-gradient(90deg, #fca5a5 0%, #ef4444 100%)'; // Red for last rank
              rankBadge = <span className="badge badge-danger" style={{ background: '#fee2e2', color: '#b91c1c' }}>Hạng chót ⚠️</span>;
            }

            return (
              <div key={d.className} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '80px', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Lớp {d.className}
                </div>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ height: '32px', background: 'var(--bg-2)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: `${percent}%`, 
                        height: '100%', 
                        background: barColor, 
                        borderRadius: '8px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '12px'
                      }}
                    >
                      {percent > 20 && (
                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                          {val.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  {percent <= 20 && (
                    <span style={{ position: 'absolute', left: `${percent + 2}%`, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {val.toFixed(2)}
                    </span>
                  )}
                </div>

                <div style={{ width: '150px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                  {rankBadge}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({d.studentCount} HS)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table & Trend */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} />
          <span>Bảng so sánh chi tiết & Xu hướng học kỳ</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Tên lớp</th>
                <th>Sĩ số</th>
                <th>Điểm TB HK I</th>
                <th>Điểm TB HK II (Hiện tại)</th>
                <th>Biến động</th>
                <th>Trạng thái học lực</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((d, index) => {
                const diff = d.sem2 - d.sem1;
                const isUp = diff >= 0;

                return (
                  <tr key={d.className}>
                    <td style={{ fontWeight: 700 }}>#{index + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>Lớp {d.className}</td>
                    <td>{d.studentCount} học sinh</td>
                    <td>{d.sem1.toFixed(2)}</td>
                    <td>{d.sem2.toFixed(2)}</td>
                    <td>
                      <span style={{ 
                        color: isUp ? '#10b981' : '#ef4444', 
                        fontWeight: 600, 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {isUp ? '+' : ''}{diff.toFixed(2)}
                        <ArrowUpRight size={14} style={{ transform: isUp ? 'none' : 'rotate(90deg)' }} />
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${d.overallAvg >= 8.0 ? 'badge-success' : d.overallAvg >= 6.5 ? 'badge-info' : 'badge-warning'}`}>
                        {d.overallAvg >= 8.0 ? 'Xuất sắc' : d.overallAvg >= 6.5 ? 'Khá' : 'Trung bình'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
