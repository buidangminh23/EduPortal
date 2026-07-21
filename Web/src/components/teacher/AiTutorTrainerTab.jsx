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
import { Compass, Book, HelpCircle, Loader2 } from 'lucide-react';

export default function AiTutorTrainerTab() {
  const { profile } = useAuth();
  const { flashcards, assignments } = useContext(AppContext);

  const [presets, setPresets] = useState([]);
  const [config, setConfig] = useState(null);
  const [entries, setEntries] = useState([]);
  
  const [activeSubTab, setActiveSubTab] = useState('method');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Subject is derived from teacher's profile/subject assignment
  // e.g. profile.subject, fallback to 'Toán học'
  const teacherSubject = profile?.subject || 'Toán học';
  const schoolId = profile?.school_id || 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const presetsData = await fetchPresets();
      setPresets(presetsData);

      const configData = await fetchTutorConfig(profile.id);
      setConfig(configData);

      const entriesData = await fetchKnowledgeEntries(profile.id, schoolId, teacherSubject);
      setEntries(entriesData);
    } catch (err) {
      console.error('Error loading AiTutor data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile.id, schoolId, teacherSubject]);

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [profile, loadData]);

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
    const updated = { 
      ...config, 
      status: 'published', 
      version: (config.version || 1) + 1,
      published_at: new Date().toISOString()
    };
    setConfig(updated);
    try {
      await saveTutorConfig(updated);
      alert(`Xuất bản thành công gia sư phiên bản v${updated.version}!`);
    } catch (err) {
      console.error('Error publishing config:', err);
    }
  };

  const handleSaveEntry = async (entry, solutions) => {
    try {
      await saveKnowledgeEntry({
        ...entry,
        school_id: schoolId,
        owner_id: profile.id
      }, solutions);
      
      setEditingEntry(null);
      setIsAddingNew(false);
      // Reload entries
      const entriesData = await fetchKnowledgeEntries(profile.id, schoolId, teacherSubject);
      setEntries(entriesData);
    } catch (err) {
      console.error('Error saving knowledge entry:', err);
      alert('Không thể lưu kiến thức, vui lòng thử lại!');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục kiến thức này không?')) return;
    try {
      await deleteKnowledgeEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Pass existing flashcards and homework assignments to scan
      const drafts = await generateDraftsFromExisting({
        teacherProfile: profile,
        schoolId,
        subject: teacherSubject,
        flashcards: flashcards || [],
        assignments: assignments || []
      });
      
      if (drafts.length > 0) {
        alert(`Đã trích xuất thành công ${drafts.length} mục kiến thức nháp từ học liệu của bạn!`);
        const entriesData = await fetchKnowledgeEntries(profile.id, schoolId, teacherSubject);
        setEntries(entriesData);
      } else {
        alert('Không tìm thấy học liệu phù hợp để trích xuất hoặc dữ liệu đã tồn tại.');
      }
    } catch (err) {
      console.error('Error generating drafts:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Đang tải dữ liệu gia sư...</span>
        </div>
      </div>
    );
  }

  // Render Editor view if creating or editing
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
            Môn học: <strong style={{ color: 'var(--accent)' }}>{teacherSubject}</strong> · Thiết lập phương pháp và nạp kiến thức để cá nhân hóa gia sư cho lớp học.
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(148,163,184,0.15)', gap: 24 }}>
        {[
          { id: 'method', label: 'Phương Pháp & Giọng Điệu', icon: Compass },
          { id: 'knowledge', label: 'Kho Tri Thức & Bài Giải', icon: Book },
          { id: 'review', label: 'Hàng Đợi Duyệt', icon: HelpCircle }
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
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent, #3b82f6)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                outline: 'none',
                marginBottom: -1
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
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <HelpCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h4 style={{ margin: '0 0 8px 0', fontWeight: 700, color: 'var(--text-primary)' }}>Màn Hình Hàng Đợi Duyệt (Giai đoạn 4)</h4>
              <p style={{ margin: 0, fontSize: 13.5, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                Ở giai đoạn sau, khi học sinh đặt câu hỏi ngoài phạm vi, câu hỏi và gợi ý trả lời sẽ tự động rơi vào đây để thầy/cô "Dạy lại" gia sư chỉ với 1 click.
              </p>
            </div>
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
