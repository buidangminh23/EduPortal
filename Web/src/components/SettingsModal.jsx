import { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Languages, User, Database, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { SCHOOL } from '../config/school';
import { describeMode, isRealMode } from '../lib/appMode';

/**
 * Settings holds what this app can actually change, and nothing else.
 *
 * Language is the only real preference in the codebase. Theme is not offered:
 * `theme` is a useState('light') with no setter and there is no
 * `[data-theme="dark"]` anywhere in the stylesheets, so a dark-mode switch
 * would be a control that moves and changes nothing. Notifications are not
 * offered either — no preference is stored for them.
 *
 * The rest of the panel is read-only, and deliberately so. Where the school's
 * records are kept is the one fact a teacher entering marks most needs and is
 * least likely to be told: on a demo build the marks are in that browser and
 * nowhere else. describeMode() already says it in plain language on the login
 * screen; a signed-in user should be able to find it again.
 */

const ROLE_LABEL = {
  admin: ['Ban Giám hiệu', 'Head teacher'],
  teacher: ['Giáo viên', 'Teacher'],
  teacher_subject: ['Giáo viên bộ môn', 'Subject teacher'],
  teacher_homeroom: ['Giáo viên chủ nhiệm', 'Homeroom teacher'],
  student: ['Học sinh', 'Student'],
  parent: ['Phụ huynh', 'Parent']
};

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section style={{ marginTop: 20 }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>
        <Icon size={15} /> {title}
      </h4>
      {children}
    </section>
  );
}

export default function SettingsModal({ open, onClose }) {
  const { currentRole, userSession, students, selectedStudentId, language, setLanguage, t } = useContext(AppContext) || {};

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeStudent = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const role = ROLE_LABEL[currentRole] ?? ['—', '—'];
  const mode = describeMode();

  const LANGUAGES = [
    { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { id: 'en', label: 'English', flag: '🇬🇧' }
  ];

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('Cài đặt', 'Settings')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>{t('Cài đặt', 'Settings')}</h3>
          <button onClick={onClose} className="icon-btn" aria-label={t('Đóng', 'Close')}><X size={18} /></button>
        </div>

        <Section icon={Languages} title={t('Ngôn ngữ', 'Language')}>
          <div style={{ display: 'flex', gap: 8 }}>
            {LANGUAGES.map(item => {
              const active = language === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id)}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: 44,
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'inherit',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: active ? 'var(--accent-ink)' : 'var(--ink)',
                    background: active ? 'var(--accent-soft)' : 'var(--surface)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--line)'}`
                  }}
                >
                  <span aria-hidden="true">{item.flag}</span>
                  {item.label}
                  {active && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={User} title={t('Tài khoản', 'Account')}>
          <Row label={t('Tên', 'Name')} value={userSession?.displayName || activeStudent?.name || '—'} />
          <Row label={t('Vai trò', 'Role')} value={t(role[0], role[1])} />
          {activeStudent?.class && <Row label={t('Lớp', 'Class')} value={activeStudent.class} />}
        </Section>

        <Section icon={Database} title={t('Hệ thống', 'System')}>
          <Row label={t('Trường', 'School')} value={SCHOOL.name} />
          {SCHOOL.domain && <Row label={t('Tên miền', 'Domain')} value={SCHOOL.domain} />}
          <Row
            label={t('Dữ liệu', 'Data')}
            value={isRealMode ? t('Lưu tại máy chủ nhà trường', 'On the school server') : t('Chỉ nằm trong trình duyệt này', 'This browser only')}
          />
          {/* Said in full, not as a badge. A pupil's marks living in one browser
              is not a detail to compress into one word. */}
          <p style={{ margin: '10px 0 0', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            <strong style={{ color: isRealMode ? 'var(--text-primary)' : '#b45309' }}>{mode.title}.</strong>{' '}
            {mode.detail}
          </p>
        </Section>
      </div>
    </div>,
    document.body
  );
}
