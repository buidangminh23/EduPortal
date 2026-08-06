import { useContext, useMemo, useState } from 'react';
import { MessageSquare, BarChart3, BookOpen, ArrowUp, ArrowDown, CheckCircle, Check, Clock, Wallet, Bus, User, X } from 'lucide-react';
import { SectionCard, Pill, Bar, Avatar } from './DashUI';
import { AppContext } from '../../context/AppContext';
import { COMMENT_RESULT, LEARNING_BAND, summariseTranscript } from '../../lib/domain/grading';
import { readConductBand, readConductYearBand } from '../../lib/domain/conduct';
import {
  ATTENDANCE_LABEL,
  ATTENDANCE_STATUS,
  isValidIsoDate,
  resolveAttendanceStatus,
  summariseAttendance
} from '../../lib/domain/attendance';
import { formatVnd } from '../../lib/domain/fees';
import { COMMENT_SUBJECTS, subjectName } from '../../config/curriculum';

/**
 * Every figure on this page is labelled with the semester it belongs to.
 *
 * The store keeps semester I in `gradesSem1` and writes every new mark into
 * `grades`, so `grades` is semester II and there is no term selector to change
 * that. An unlabelled mark reads as "cả năm" to a parent, and the year is not
 * settled until semester II closes — see conductBandForYear, which returns null
 * for exactly that reason.
 */
const CURRENT_SEMESTER_LABEL = 'HK II';

/** Cycled over the subject cards so they can be told apart. Carries no meaning. */
const SUBJECT_COLORS = ['blue', 'pink', 'mint', 'violet', 'orange', 'lime', 'amber', 'sky'];

/** Recorded sessions shown in the chuyên cần strip — roughly a school week. */
const RECENT_SESSION_COUNT = 6;

/** Scans shown per child; the store keeps no date on them, so this is a sample. */
const RECENT_SCAN_COUNT = 3;

const ATTENDANCE_VIEW = {
  [ATTENDANCE_STATUS.PRESENT]: { color: 'mint', Icon: Check },
  [ATTENDANCE_STATUS.LATE]: { color: 'amber', Icon: Clock },
  [ATTENDANCE_STATUS.EXCUSED]: { color: 'blue', Icon: X },
  [ATTENDANCE_STATUS.UNEXCUSED]: { color: 'coral', Icon: X }
};

const SCAN_DIRECTION_LABEL = { boarding: 'Lên xe', deboarding: 'Xuống xe' };

const BAND_COLOR = {
  [LEARNING_BAND.GOOD]: '#10b981',
  [LEARNING_BAND.FAIR]: '#3b82f6',
  [LEARNING_BAND.PASS]: '#f59e0b',
  [LEARNING_BAND.FAIL]: '#ef4444'
};

const formatMark = (value) => (typeof value === 'string' ? value : Number.isFinite(value) ? value.toFixed(1) : '—');

const formatDayMonth = (iso) => (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');

const formatFullDate = (iso) => (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');

/** What a card says when the school has recorded nothing for this child yet. */
function EmptyNote({ children }) {
  return (
    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</p>
  );
}

/**
 * One classification line.
 *
 * When the gradebook does not hold enough subjects the row states that, rather
 * than printing a band. Thông tư 22 needs at least six subjects, so applying it
 * to a partial record would report Chưa đạt for a student with straight tens.
 */
function BandRow({ label, result, emptyLabel = 'Chưa xếp loại' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: 130 }}>{label}</span>
      {result.band ? (
        <strong style={{ color: BAND_COLOR[result.band], fontSize: '0.95rem' }}>{result.band}</strong>
      ) : (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {emptyLabel}{result.reason ? ` — ${result.reason}` : ''}
        </span>
      )}
    </div>
  );
}

/**
 * One headline figure about the child.
 *
 * A missing figure is printed as the sentence that says so, in the muted style
 * of an absent value, rather than as a number. The three tiles that used to sit
 * here — Hạng #3, Hạnh kiểm Tốt, Chuyên cần 98% — were literals, identical for
 * every child in the school.
 */
function HeadlineStat({ label, value, empty, color }) {
  return (
    <div className="center" style={{ padding: '4px 14px', maxWidth: 170 }}>
      {value ? (
        <div className={`display t-${color}`} style={{ fontSize: '1.7rem' }}>{value}</div>
      ) : (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>{empty}</div>
      )}
      <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>{label}</div>
    </div>
  );
}

export default function ParentOverview({ childName, childClass, student, onSubTabChange, onMainTabChange }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const { attendanceLogs, leaveRequests, busRoutes, busScanLogs, parentQAs } = useContext(AppContext) || {};

  // Report every subject the student actually holds a result for, not a fixed
  // four. The bands in Thông tư 22 count across the whole timetable, so
  // classifying over a hardcoded subset would understate a full record the
  // moment the school adds a subject.
  //
  // Every nhận xét subject is listed even before it is assessed, so a parent
  // can see what is still outstanding rather than wondering why Giáo dục thể
  // chất is missing from the học bạ.
  const commentResults = Object.fromEntries(
    COMMENT_SUBJECTS.map(subject => [subject.key, student?.commentResults?.[subject.key] || {}])
  );
  const transcript = summariseTranscript({
    semester1: student?.gradesSem1,
    semester2: student?.grades,
    comments: commentResults
  });

  const name = student?.name || childName || '';
  const classroom = student?.class || childClass || '';
  const firstName = name.trim().split(' ').pop();

  /**
   * Chuyên cần, read off the register.
   *
   * `rate` is null while nothing has been recorded, and the tile prints "Chưa
   * điểm danh" for it. Neither 0% nor the old literal 98% is true of a child
   * the register has not opened on yet, and both would be a claim to a parent.
   */
  const attendance = useMemo(() => {
    const records = (attendanceLogs || []).filter(log => log.studentId === student?.id);
    const leaves = (leaveRequests || []).filter(request => request.studentId === student?.id);
    const recent = records
      .filter(record => isValidIsoDate(record.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-RECENT_SESSION_COUNT)
      .map(record => ({ ...record, status: resolveAttendanceStatus(record, leaves) }));

    return { summary: summariseAttendance(records, leaves), recent };
  }, [attendanceLogs, leaveRequests, student?.id]);

  /**
   * Subject cards, built from the same transcript the học bạ modal prints.
   *
   * Both now come from one source, so a parent cannot read 8.0 for Hoá học on
   * the card and a dash for it in the học bạ. A trend arrow is drawn only where
   * both semesters carry a mark, because the trend *is* their difference —
   * nothing else in the app computes one.
   */
  const subjectCards = transcript.subjects.map((row, index) => ({
    key: row.key,
    kind: row.kind,
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    mark: row.kind === 'score' ? row.semester2 : null,
    result: row.kind === 'comment' ? row.semester2 : null,
    trend: row.kind === 'score' && Number.isFinite(row.semester1) && Number.isFinite(row.semester2)
      ? Number((row.semester2 - row.semester1).toFixed(1))
      : null
  }));

  const fees = student?.feeStatus || [];
  const unpaidCount = fees.filter(fee => !fee.paid).length;

  const busRoute = (busRoutes || []).find(route => (route.studentsRegistered || []).includes(student?.id));
  const busScans = (busScanLogs || []).filter(log => log.studentId === student?.id).slice(0, RECENT_SCAN_COUNT);

  // Questions are appended, so the last match is the newest. Only an answered
  // one is shown as a message from a teacher; a question still in the queue is
  // reported as waiting, never dressed up as a reply.
  const childQAs = (parentQAs || []).filter(qa => qa.studentName === name);
  const answeredQA = [...childQAs].reverse().find(qa => qa.reply);
  const pendingQA = [...childQAs].reverse().find(qa => !qa.reply);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">{firstName ? `Theo dõi bé ${firstName} 🧡` : 'Theo dõi con'}</h2>
          <p className="page-sub">Tổng quan tình hình học tập của con tại trường.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onSubTabChange && onSubTabChange('qa')}><MessageSquare size={17} /> Nhắn giáo viên chủ nhiệm</button>
      </div>

      <div className="card animate d1" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', background: 'linear-gradient(120deg, var(--accent-soft), var(--surface))' }}>
        <Avatar src={student?.avatarUrl} name={name} size={66} />
        <div>
          <div className="display" style={{ fontSize: '1.5rem' }}>{name || 'Chưa có thông tin học sinh'}</div>
          <div className="soft" style={{ fontWeight: 600 }}>
            {[classroom && `Lớp ${classroom}`, student?.id && `Mã HS ${student.id}`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="flex gap-16 wrap">
          <HeadlineStat
            label={`Kết quả học tập ${CURRENT_SEMESTER_LABEL}`}
            value={transcript.bands.semester2.band}
            empty="Chưa xếp loại"
            color="orange"
          />
          <HeadlineStat
            label={`Kết quả rèn luyện ${CURRENT_SEMESTER_LABEL}`}
            value={readConductBand(student, 'semester2')}
            empty="Chưa đánh giá"
            color="mint"
          />
          <HeadlineStat
            label="Chuyên cần"
            value={attendance.summary.rate === null ? null : `${attendance.summary.rate}%`}
            empty="Chưa điểm danh"
            color="blue"
          />
        </div>
      </div>

      <div className="ds-grid ds-split">
        <div className="col" style={{ gap: 20 }}>
          <SectionCard title={`Điểm các môn của con (${CURRENT_SEMESTER_LABEL})`} icon={BarChart3} delay="d2" action={<button className="btn btn-soft btn-sm" onClick={() => setShowTranscript(true)}>Xem học bạ</button>}>
            {subjectCards.length === 0 ? (
              <EmptyNote>Chưa có môn học nào được nhập kết quả.</EmptyNote>
            ) : (
              <div className="ds-grid cols-2" style={{ gap: 14 }}>
                {subjectCards.map(card => (
                  <div key={card.key} className="flex items-center gap-12">
                    <div className={`chip-ico bg-${card.color} t-${card.color}`} style={{ width: 38, height: 38 }}><BookOpen size={17} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="flex between" style={{ marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{subjectName(card.key)}</span>
                        {card.kind === 'score' ? (
                          Number.isFinite(card.mark) ? (
                            <span className="flex items-center gap-6">
                              <span className={`t-${card.color}`} style={{ fontWeight: 800, fontSize: '0.86rem' }}>{formatMark(card.mark)}</span>
                              {card.trend !== null && card.trend !== 0 && (card.trend > 0
                                ? <ArrowUp size={13} style={{ color: 'var(--mint)' }} aria-label={`Tăng ${card.trend} so với HK I`} />
                                : <ArrowDown size={13} style={{ color: 'var(--coral)' }} aria-label={`Giảm ${Math.abs(card.trend)} so với HK I`} />)}
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Chưa có điểm</span>
                          )
                        ) : (
                          card.result
                            ? <Pill color={card.result === COMMENT_RESULT.PASS ? 'mint' : 'coral'}>{card.result}</Pill>
                            : <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Chưa đánh giá</span>
                        )}
                      </div>
                      {card.kind === 'score' && Number.isFinite(card.mark) && <Bar value={card.mark} color={card.color} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Chuyên cần gần đây" icon={CheckCircle} delay="d3">
            {attendance.recent.length === 0 ? (
              <EmptyNote>Chưa có buổi điểm danh nào được ghi nhận cho con.</EmptyNote>
            ) : (
              <>
                <div className="flex gap-8 wrap">
                  {attendance.recent.map(session => {
                    const view = ATTENDANCE_VIEW[session.status] || ATTENDANCE_VIEW[ATTENDANCE_STATUS.UNEXCUSED];
                    return (
                      <div key={session.id || session.date} className={`center bg-${view.color}`} style={{ flex: 1, minWidth: 88, padding: '14px 8px', borderRadius: 'var(--r-md)', gap: 6 }}>
                        <span className="muted" style={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatDayMonth(session.date)}</span>
                        <div className={`t-${view.color}`}><view.Icon size={22} /></div>
                        <span className={`t-${view.color}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>{ATTENDANCE_LABEL[session.status]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="muted" style={{ fontSize: '0.78rem', marginTop: 10, marginBottom: 0 }}>
                  Đã ghi nhận {attendance.summary.total} buổi · có mặt {attendance.summary.present + attendance.summary.late} buổi
                  {attendance.summary.unexcused > 0 && ` · vắng không phép ${attendance.summary.unexcused} buổi`}
                </p>
              </>
            )}
          </SectionCard>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Học phí & khoản thu" icon={Wallet} delay="d2">
            {fees.length === 0 ? (
              <EmptyNote>Nhà trường chưa phát hành khoản thu nào cho con.</EmptyNote>
            ) : (
              <>
                <div className="col" style={{ gap: 10 }}>
                  {fees.map(fee => (
                    <div key={fee.id} className="flex between items-center" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{fee.name}</div>
                        <div className="muted" style={{ fontSize: '0.76rem' }}>Hạn {formatFullDate(fee.deadline)}</div>
                      </div>
                      <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formatVnd(fee.amount)}</span>
                        <Pill color={fee.paid ? 'mint' : 'coral'}>{fee.paid ? 'Đã đóng' : 'Chưa đóng'}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onSubTabChange && onSubTabChange(unpaidCount > 0 ? 'fees' : 'wallet')} style={{ width: '100%', marginTop: 12 }}>
                  {unpaidCount > 0 ? `Thanh toán ${unpaidCount} khoản còn lại` : 'Xem ví điện tử'}
                </button>
              </>
            )}
          </SectionCard>

          <SectionCard title="Xe đưa đón" icon={Bus} delay="d3">
            {!busRoute ? (
              <>
                <EmptyNote>Con chưa đăng ký tuyến xe đưa đón nào.</EmptyNote>
                <button className="btn btn-soft btn-sm" onClick={() => onMainTabChange && onMainTabChange('bus_tracker')} style={{ width: '100%', marginTop: 12 }}>
                  Đăng ký tuyến xe
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-12" style={{ padding: 12, borderRadius: 'var(--r-md)', background: 'var(--mint-soft)' }}>
                  <div className="chip-ico bg-mint t-mint" style={{ width: 46, height: 46 }}><Bus size={22} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{busRoute.name}</div>
                    <div className="t-mint" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {busRoute.status === 'driving' ? 'Xe đang chạy' : 'Xe đang dừng'}
                    </div>
                  </div>
                </div>
                <div className="row mt-8">
                  <div className="chip-ico bg-blue t-blue" style={{ width: 38, height: 38 }}><User size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Tài xế: {busRoute.driverName}</div>
                    <div className="muted" style={{ fontSize: '0.76rem' }}>Biển số {busRoute.plateNumber}</div>
                  </div>
                </div>
                {/* Scans carry a time but no date, so the card lists them without
                    claiming which is the most recent or that they are today's. */}
                {busScans.length > 0 && (
                  <div className="col mt-8" style={{ gap: 6 }}>
                    <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Lượt quẹt thẻ đã ghi nhận</span>
                    {busScans.map(scan => (
                      <div key={scan.id} className="flex between" style={{ fontSize: '0.78rem' }}>
                        <span>{SCAN_DIRECTION_LABEL[scan.direction] || scan.direction} · {scan.stopName}</span>
                        <span className="muted">{scan.time}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-soft btn-sm" onClick={() => onMainTabChange && onMainTabChange('bus_tracker')} style={{ width: '100%', marginTop: 12 }}>
                  Xem vị trí xe
                </button>
              </>
            )}
          </SectionCard>

          <SectionCard title="Trao đổi với giáo viên" icon={MessageSquare} delay="d4">
            {answeredQA ? (
              <div className="col" style={{ gap: 6 }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>Câu hỏi ngày {formatFullDate(answeredQA.date)}: {answeredQA.question}</span>
                <div style={{ background: 'var(--bg)', padding: '10px 13px', borderRadius: '4px 16px 16px 16px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {answeredQA.reply}
                </div>
              </div>
            ) : pendingQA ? (
              <EmptyNote>Câu hỏi gửi ngày {formatFullDate(pendingQA.date)} đang chờ giáo viên trả lời.</EmptyNote>
            ) : (
              <EmptyNote>Chưa có trao đổi nào giữa gia đình và giáo viên.</EmptyNote>
            )}
            <button className="btn btn-soft btn-sm" onClick={() => onSubTabChange && onSubTabChange('qa')} style={{ width: '100%', marginTop: 12 }}>
              Mở hộp thư hỏi đáp
            </button>
          </SectionCard>
        </div>
      </div>
      {showTranscript && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Học bạ nhanh của {name}</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {[classroom && `Lớp ${classroom}`, student?.id && `Mã học sinh ${student.id}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button onClick={() => setShowTranscript(false)} className="icon-btn" aria-label="Đóng học bạ"><X size={18} /></button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th scope="col">Môn học</th>
                    <th scope="col">HK I</th>
                    <th scope="col">HK II</th>
                    <th scope="col">Cả năm</th>
                  </tr>
                </thead>
                <tbody>
                  {transcript.subjects.map(row => (
                    <tr key={row.key}>
                      <td style={{ fontWeight: 700 }}>{subjectName(row.key)}</td>
                      <td>{formatMark(row.semester1)}</td>
                      <td>{formatMark(row.semester2)}</td>
                      <td style={{ fontWeight: 700 }}>{formatMark(row.year)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <BandRow label="Xếp loại HK I" result={transcript.bands.semester1} />
              <BandRow label="Xếp loại HK II" result={transcript.bands.semester2} />
              <BandRow label="Xếp loại cả năm" result={transcript.bands.year} />
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Xếp loại theo Thông tư 22/2021/TT-BGDĐT, Điều 9 khoản 2.
              </p>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <BandRow label="Rèn luyện HK I" result={{ band: readConductBand(student, 'semester1') }} emptyLabel="Chưa đánh giá" />
              <BandRow label="Rèn luyện HK II" result={{ band: readConductBand(student, 'semester2') }} emptyLabel="Chưa đánh giá" />
              <BandRow label="Rèn luyện cả năm" result={{ band: readConductYearBand(student) }} emptyLabel="Chưa đánh giá" />
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Kết quả rèn luyện do giáo viên chủ nhiệm đánh giá theo Thông tư 22/2021/TT-BGDĐT, Điều 8.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowTranscript(false)} style={{ width: '100%', marginTop: 16 }}>Đã xem</button>
          </div>
        </div>
      )}
    </div>
  );
}
