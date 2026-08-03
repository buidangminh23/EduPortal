import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import RiasecSurvey from './counseling/RiasecSurvey';
import RiasecResult from './counseling/RiasecResult';
import CounselorChat from './counseling/CounselorChat';
import { computeRiasecProfile, profileFromStoredScores, toStorageScores } from '../../lib/counseling/riasec';

export default function CounselingTab({ student }) {
  const {
    careerTestScores,
    saveCareerTest,
    logWellnessMood,
    requestCounseling,
    setStudentSubTab
  } = useContext(AppContext);

  const [answers, setAnswers] = useState({});
  const [isRetaking, setIsRetaking] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const storedScores = useMemo(
    () => careerTestScores?.find(score => score.studentId === student?.id) || null,
    [careerTestScores, student?.id]
  );

  // A saved result is the source of truth; the live answers only take over
  // while the student is actually retaking the survey.
  const savedProfile = useMemo(() => profileFromStoredScores(storedScores), [storedScores]);
  const draftProfile = useMemo(() => computeRiasecProfile(answers), [answers]);
  const activeProfile = isRetaking || !savedProfile ? (draftProfile.isComplete ? draftProfile : null) : savedProfile;

  const showSurvey = !savedProfile || isRetaking;

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setJustSaved(false);
  };

  const handleSubmit = () => {
    const profile = computeRiasecProfile(answers);
    if (!profile.isComplete || !student?.id) return;

    saveCareerTest(student.id, toStorageScores(profile));
    setIsRetaking(false);
    setJustSaved(true);
  };

  const handleRetake = () => {
    setAnswers({});
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
            onSubmit={handleSubmit}
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

        {activeProfile && (
          <RiasecResult
            profile={activeProfile}
            onRetake={handleRetake}
            onOpenMatchmaker={setStudentSubTab ? () => setStudentSubTab('university_matchmaker') : null}
          />
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
