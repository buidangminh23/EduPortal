import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { 
  fetchPresets, 
  fetchTutorConfig, 
  saveTutorConfig, 
  fetchKnowledgeEntries, 
  saveKnowledgeEntry, 
  deleteKnowledgeEntry 
} from '../../lib/tutor/api';
import { generateDraftsFromExisting } from '../../lib/tutor/generateFromExisting';
import PresetPicker from './tutor/PresetPicker';
import KnowledgeList from './tutor/KnowledgeList';
import KnowledgeEditor from './tutor/KnowledgeEditor';
import TestPanel from './tutor/TestPanel';
import ReviewQueue from './tutor/ReviewQueue';
import GoldenSet from './tutor/GoldenSet';
import CoverageBoard from './tutor/CoverageBoard';
import DepartmentHub from './tutor/DepartmentHub';
import { Compass, Book, HelpCircle, Loader2, Award, Users, Activity, AlertTriangle } from 'lucide-react';
import { resolveTeacherAuthor, canFileContent } from '../../lib/authorIdentity';


/**
 * Says that the tab cannot tell whose work this would be, and stops.
 *
 * Showing the editor anyway would invite a teacher to type a lesson that then
 * gets filed under a stranger, or rejected by the database after they have
 * written it.
 */
function UnknownAuthorNotice({ title, detail }) {
  return (
    <div style={{ padding: 24, display: 'grid', placeItems: 'center', minHeight: 360 }}>
      <div
        role="status"
        style={{
          maxWidth: 520, display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '16px 18px', borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.08)'
        }}
      >
        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2, color: '#b45309' }} />
        <div style={{ lineHeight: 1.6 }}>
          <strong>{title}</strong>
          <div style={{ marginTop: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{detail}</div>
        </div>
      </div>
    </div>
  );
}

export default function AiTutorTrainerTab() {
  const { profile, loading: authLoading } = useAuth();
  const { userSession, flashcards, assignments, reviewQueue, setReviewQueue, groupEntries, setGroupEntries } = useContext(AppContext);

  const [presets, setPresets] = useState([]);
  const [config, setConfig] = useState(null);
  const [entries, setEntries] = useState([]);
  const [goldenTests, setGoldenTests] = useState([
    { id: 'GT1', question: 'Tính tích phân nguyên hàm', expected_behavior: 'Phải trả về công thức int u dv = uv - v du' },
    { id: 'GT2', question: 'Mạch xoay chiều RLC cộng hưởng', expected_behavior: 'Phải trả về Z_min = R' }
  ]);
  
  const [activeSubTab, setActiveSubTab] = useState('method');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Giáo viên mà dữ liệu đang giữ thuộc về. Suy ra trạng thái tải từ đây thay
  // vì một cờ boolean bật/tắt: đổi giáo viên là spinner quay lại, và phản hồi
  // của lần tải cũ về muộn không còn tắt spinner của lần tải mới.
  const [loadedFor, setLoadedFor] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Who this tab reads and writes as. Resolved rather than assumed: the three
  // values here used to fall back to one seeded teacher, one seeded school and
  // the subject Toán học, so an absent profile quietly filed a teacher's work
  // under somebody else.
  const author = useMemo(
    () => resolveTeacherAuthor({ profile, session: userSession }),
    [profile, userSession]
  );
  const teacherId = author?.teacherId ?? null;
  const schoolId = author?.schoolId ?? null;
  const teacherSubject = author?.subject ?? null;
  const canWrite = canFileContent(author);

  // Chỉ lấy dữ liệu, không đụng state. Việc ghi state nằm ở effect bên dưới,
  // nơi biết component còn sống hay không.
  const loadData = useCallback(async () => {
    const presetsData = await fetchPresets();
    const configData = await fetchTutorConfig(teacherId);
    const entriesData = await fetchKnowledgeEntries(teacherId, schoolId, teacherSubject);
    return {
      presets: presetsData || [],
      config: configData || { teacher_id: teacherId, preset_id: presetsData?.[0]?.id, tone: 'than_mat', status: 'draft', version: '1.0' },
      entries: entriesData || []
    };
  }, [teacherId, schoolId, teacherSubject]);

  useEffect(() => {
    // With no author there is nothing to fetch and nothing to show — the
    // render gates below have already taken over — so the request is not made
    // rather than sent with a null teacher id.
    if (!teacherId) return undefined;

    let mounted = true;
    loadData()
      .then((data) => {
        if (!mounted) return;
        setPresets(data.presets);
        setConfig(data.config);
        setEntries(data.entries);
      })
      .catch((err) => {
        console.error('Error loading AiTutor data:', err);
      })
      .finally(() => {
        if (mounted) setLoadedFor(teacherId);
      });
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoadedFor(teacherId);
    }, 1000);
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [loadData, teacherId]);

  const loading = Boolean(teacherId) && loadedFor !== teacherId;

  const handleSelectPreset = async (presetId) => {
    const updated = { ...config, preset_id: presetId, status: 'draft' };
    setConfig(updated);
    try {
      await saveTutorConfig(updated);
    } catch (err) {
      console.error('Error saving preset:', err);
    }
  };

  const handleChangeTone = async (tone) => {
    const updated = { ...config, tone, status: 'draft' };
    setConfig(updated);
    try {
      await saveTutorConfig(updated);
    } catch (err) {
      console.error('Error saving tone:', err);
    }
  };

  const handlePublish = async () => {
    const nextVer = (parseFloat(config?.version || '1.0') + 0.1).toFixed(1);
    const updated = { ...config, status: 'published', version: nextVer };
    setConfig(updated);
    try {
      await saveTutorConfig(updated);
      alert(`Đã xuất bản cấu hình Gia sư AI phiên bản ${nextVer} thành công!`);
    } catch (err) {
      console.error('Error publishing config:', err);
    }
  };

  const handleSaveEntry = async (entryData) => {
    if (!canWrite) {
      alert('Chưa xác định được giáo viên hoặc môn phụ trách, nên chưa lưu được. Xem thông báo ở đầu trang.');
      return;
    }
    try {
      const saved = await saveKnowledgeEntry(entryData, teacherId, schoolId, teacherSubject);
      setEntries(prev => {
        const exists = prev.some(e => e.id === saved.id);
        if (exists) return prev.map(e => e.id === saved.id ? saved : e);
        return [saved, ...prev];
      });
      setEditingEntry(null);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Không thể lưu tri thức. Vui lòng thử lại.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục tri thức này?')) return;
    try {
      await deleteKnowledgeEntry(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleGenerate = async () => {
    if (!canWrite) {
      alert('Chưa xác định được giáo viên hoặc môn phụ trách, nên chưa tạo nháp được.');
      return;
    }
    setIsGenerating(true);
    try {
      const drafts = generateDraftsFromExisting(flashcards, assignments, teacherSubject);
      for (const draft of drafts) {
        const saved = await saveKnowledgeEntry(draft, teacherId, schoolId, teacherSubject);
        setEntries(prev => [saved, ...prev]);
      }
      alert(`Đã tự động tạo nháp ${drafts.length} mục tri thức từ flashcard & bài tập!`);
    } catch (err) {
      console.error('Error generating drafts:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReTeach = (queueId, newEntry) => {
    handleSaveEntry({
      ...newEntry,
      status: 'published'
    });
    setReviewQueue(prev => prev.filter(q => q.id !== queueId));
    alert('Đã dạy lại gia sư và xuất bản tri thức mới thành công!');
  };

  const handleAddGoldenTest = (testCase) => {
    setGoldenTests(prev => [...prev, testCase]);
  };

  const handleApproveGroupEntry = (entry) => {
    setGroupEntries(prev => [entry, ...prev]);
    alert('Đã duyệt và lưu tri thức dùng chung cho Tổ bộ môn!');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
        <span>Đang xác định tài khoản...</span>
      </div>
    );
  }

  // Nothing below this point is safe to show as somebody's own work if we
  // cannot say whose it is.
  if (!author) {
    return (
      <UnknownAuthorNotice
        title="Chưa xác định được tài khoản giáo viên"
        detail="Phần huấn luyện gia sư ghi nội dung đứng tên một giáo viên cụ thể. Hãy đăng nhập lại; nếu vẫn không được, báo quản trị viên kiểm tra hồ sơ tài khoản."
      />
    );
  }

  if (!canWrite) {
    return (
      <UnknownAuthorNotice
        title="Chưa xác định được môn phụ trách"
        detail={`Tài khoản này chưa gắn ${!schoolId ? 'trường' : 'môn'} phụ trách, nên nội dung tri thức chưa biết xếp vào đâu. Trước đây phần này mặc định là "Toán học" cho mọi giáo viên — nay không đoán nữa. Nhờ quản trị viên gán phân công giảng dạy cho tài khoản.`}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
        <span>Đang tải dữ liệu huấn luyện gia sư...</span>
      </div>
    );
  }

  if (editingEntry || isAddingNew) {
    return (
      <div style={{ padding: 20 }}>
        <KnowledgeEditor
          key={editingEntry?.id || 'new'}
          entry={editingEntry}
          teacherSubject={teacherSubject}
          onSave={handleSaveEntry}
          onCancel={() => {
            setEditingEntry(null);
            setIsAddingNew(false);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Header Banner */}
      <div className="flex between items-center flex-wrap gap-12" style={{ borderBottom: '1px solid rgba(148,163,184,0.12)', paddingBottom: 14 }}>
        <div>
          <h2 className="display" style={{ fontSize: '1.6rem', margin: 0 }}>Huấn Luyện Gia Sư AI</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Môn học: <strong style={{ color: 'var(--accent)' }}>{teacherSubject}</strong> · Đào tạo gia sư sư phạm đa tầng (Giáo viên, Tổ bộ môn, Tầng nền GDPT 2018).
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(148,163,184,0.15)', gap: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'method', label: 'Phương Pháp & Giọng Điệu', icon: Compass },
          { id: 'knowledge', label: 'Kho Tri Thức & Bài Giải', icon: Book },
          { id: 'review', label: `Cần Duyệt (${reviewQueue.length})`, icon: HelpCircle },
          { id: 'golden', label: 'Bộ Đề Vàng', icon: Award },
          { id: 'department', label: 'Tổ Bộ Môn', icon: Users },
          { id: 'coverage', label: 'Độ Phủ Tri Thức', icon: Activity }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 4px',
                fontSize: 13.5,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent, #3b82f6)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Layout: Content + Test Sandbox */}
      <div className="ds-rail" style={{ '--rail': '340px', gap: 24, alignItems: 'start' }}>
        {/* Left column: Sub-tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeSubTab === 'method' && (
            <PresetPicker
              presets={presets}
              selectedPresetId={config?.preset_id}
              onSelectPreset={handleSelectPreset}
              tone={config?.tone}
              onChangeTone={handleChangeTone}
              status={config?.status}
              version={config?.version}
              onPublish={handlePublish}
            />
          )}

          {activeSubTab === 'knowledge' && (
            <KnowledgeList
              entries={entries}
              onEdit={(entry) => setEditingEntry(entry)}
              onDelete={handleDeleteEntry}
              onAdd={() => setIsAddingNew(true)}
              onGenerateFromExisting={handleGenerate}
              isGenerating={isGenerating}
            />
          )}

          {activeSubTab === 'review' && (
            <ReviewQueue
              queue={reviewQueue}
              onReTeach={handleReTeach}
            />
          )}

          {activeSubTab === 'golden' && (
            <GoldenSet
              tests={goldenTests}
              entries={entries}
              onAddTest={handleAddGoldenTest}
            />
          )}

          {activeSubTab === 'department' && (
            <DepartmentHub
              groupEntries={groupEntries}
              onApproveGroupEntry={handleApproveGroupEntry}
            />
          )}

          {activeSubTab === 'coverage' && (
            <CoverageBoard
              entries={entries}
              queue={reviewQueue}
            />
          )}
        </div>

        {/* Right column: Sandbox Test Panel */}
        <div>
          <TestPanel
            entries={entries}
            presets={presets}
            selectedPresetId={config?.preset_id}
            tone={config?.tone}
          />
        </div>
      </div>
    </div>
  );
}
