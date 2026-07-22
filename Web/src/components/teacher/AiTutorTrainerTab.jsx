import { useState, useEffect, useContext, useCallback } from 'react';
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
import { Compass, Book, HelpCircle, Loader2, Award, Users, Activity } from 'lucide-react';

export default function AiTutorTrainerTab() {
  const { profile } = useAuth();
  const { flashcards, assignments, reviewQueue, setReviewQueue, groupEntries, setGroupEntries } = useContext(AppContext);

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
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const teacherId = profile?.id || 'e1000000-0000-0000-0000-000000000001';
  const teacherSubject = profile?.subject || 'Toán học';
  const schoolId = profile?.school_id || 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const presetsData = await fetchPresets();
      setPresets(presetsData || []);

      const configData = await fetchTutorConfig(teacherId);
      setConfig(configData || { teacher_id: teacherId, preset_id: presetsData?.[0]?.id, tone: 'than_mat', status: 'draft', version: '1.0' });

      const entriesData = await fetchKnowledgeEntries(teacherId, schoolId, teacherSubject);
      setEntries(entriesData || []);
    } catch (err) {
      console.error('Error loading AiTutor data:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId, schoolId, teacherSubject]);

  useEffect(() => {
    let mounted = true;
    loadData();
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1000);
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [loadData]);

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
    try {
      const saved = await saveKnowledgeEntry(entryData, profile?.id, schoolId, teacherSubject);
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
    setIsGenerating(true);
    try {
      const drafts = generateDraftsFromExisting(flashcards, assignments, teacherSubject);
      for (const draft of drafts) {
        const saved = await saveKnowledgeEntry(draft, profile?.id, schoolId, teacherSubject);
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
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
