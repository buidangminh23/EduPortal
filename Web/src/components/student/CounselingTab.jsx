import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import RiasecSurvey from './counseling/RiasecSurvey';
import RiasecResult from './counseling/RiasecResult';
import CareerPathways from './counseling/CareerPathways';
import CounselorChat from './counseling/CounselorChat';
import { computeRiasecProfile, profileFromStoredScores, toStorageScores } from '../../lib/counseling/riasec';

export default function CounselingTab({ student }) {
  const {
    careerTestScores,
    saveCareerTest,
    logWellnessMood,
    requestCounseling,
    setStudentSubTab,
    mockExamHistory
  } = useContext(AppContext);

  const [answers, setAnswers] = useState({});
  const [isRetaking, setIsRetaking] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // The answer sheet the student asked to have analysed. Held apart from
  // `answers` so finishing the survey produces an analysis to read first and a
  // decision to save second, rather than filing a result they have not seen.
  const [analysedAnswers, setAnalysedAnswers] = useState(null);

  const storedScores = useMemo(
    () => careerTestScores?.find(score => score.studentId === student?.id) || null,
    [careerTestScores, student?.id]
  );

  const savedProfile = useMemo(() => profileFromStoredScores(storedScores), [storedScores]);
  const analysedProfile = useMemo(
    () => (analysedAnswers ? computeRiasecProfile(analysedAnswers) : null),
    [analysedAnswers]
  );

  // An unsaved analysis is what the student is looking at, so it wins over the
  // stored one until they either save it or start over.
  const activeProfile = analysedProfile || (isRetaking ? null : savedProfile);
  const showSurvey = !analysedProfile && (!savedProfile || isRetaking);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setJustSaved(false);
  };

  const handleAnalyse = () => {
    if (!computeRiasecProfile(answers).isComplete) return;
    setAnalysedAnswers(answers);
    setJustSaved(false);
  };

  const handleSave = () => {
    if (!analysedProfile || !student?.id) return;

    saveCareerTest(student.id, toStorageScores(analysedProfile));
    // Clearing the draft hands the panel back to the stored profile, which now
    // holds the same numbers — the result on screen does not move.
    setAnalysedAnswers(null);
    setAnswers({});
    setIsRetaking(false);
    setJustSaved(true);
  };

  const handleRetake = () => {
    setAnswers({});
    setAnalysedAnswers(null);
    setIsRetaking(true);
    setJustSaved(false);
  };

  const handleLogMood = ({ mood, stressLevel, label }) => {
    if (!student?.id) return;
    logWellnessMood(student.id, stressLevel, mood, `Check-in từ AI Tư vấn tâm lý: ${label}`);
  };

  const handleRequestCounseling = ({ date, timeSlot, notes }) => {
    if (!student?.id) return;
    requestCounseling(student.id, date, timeSlot, notes);
  };

  return (
    <div
      className="glass-panel animate-fade"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}
    >
      <div>
        {showSurvey && (
          <RiasecSurvey
            answers={answers}
            onAnswer={handleAnswer}
            onAnalyse={handleAnalyse}
            hasPreviousResult={Boolean(savedProfile)}
          />
        )}

        {justSaved && (
          <p style={{
            margin: '14px 0 0 0', padding: '10px 12px', borderRadius: '10px',
            background: 'var(--lime-soft)', color: '#166534', fontSize: '0.82rem', fontWeight: 600
          }}>
            ✅ Đã lưu kết quả RIASEC. Thầy tư vấn bên cạnh đã đọc được kết quả này của em.
          </p>
        )}

        {analysedProfile && (
          <p style={{
            margin: '14px 0 0 0', padding: '10px 12px', borderRadius: '10px',
            background: 'var(--amber-soft)', color: '#92400e', fontSize: '0.82rem', fontWeight: 600
          }}>
            🔎 Đây là bản phân tích của lần làm vừa rồi, chưa lưu vào hồ sơ. Đọc xong phần định hướng bên dưới rồi bấm lưu nếu em thấy đúng.
          </p>
        )}

        {activeProfile && (
          <>
            <RiasecResult profile={activeProfile} onRetake={analysedProfile ? null : handleRetake} />
            <CareerPathways
              profile={activeProfile}
              student={student}
              mockExamHistory={mockExamHistory}
              onOpenMatchmaker={setStudentSubTab ? () => setStudentSubTab('university_matchmaker') : null}
            />
          </>
        )}

        {analysedProfile && (
          <div style={{
            marginTop: '14px', padding: '14px 16px', borderRadius: '14px',
            background: 'var(--surface-soft)', border: '1px solid var(--line)'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Lưu lại để thầy tư vấn, phần Đối chiếu điểm chuẩn ĐH và báo cáo của trường cùng đọc được mã{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{analysedProfile.hollandCode}</strong> này của em.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, minWidth: '200px' }}>
                {savedProfile ? 'Lưu kết quả mới vào hồ sơ' : 'Lưu kết quả vào hồ sơ'}
              </button>
              <button onClick={handleRetake} className="btn">
                Làm lại khảo sát
              </button>
            </div>
          </div>
        )}
      </div>

      <CounselorChat
        key={student?.id}
        student={student}
        profile={activeProfile}
        onLogMood={handleLogMood}
        onRequestCounseling={handleRequestCounseling}
      />
    </div>
  );
}
