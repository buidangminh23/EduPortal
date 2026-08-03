import { GraduationCap, RotateCcw, Info } from 'lucide-react';
import { getCareerGuidance, MAX_TRAIT_SCORE, TRAIT_ORDER } from '../../../lib/counseling/riasec';

const RADAR_CENTER = 150;
const RADAR_RADIUS = 105;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];

/** Angle of each trait around the hexagon, R at the top going clockwise. */
const AXES = TRAIT_ORDER.map((trait, idx) => ({ trait, angle: (idx * Math.PI) / 3 }));

function pointAt(angle, radiusRatio) {
  const length = RADAR_RADIUS * radiusRatio;
  return {
    x: RADAR_CENTER + length * Math.sin(angle),
    y: RADAR_CENTER - length * Math.cos(angle)
  };
}

const polygonFor = (ratioOf) =>
  AXES.map(axis => {
    const { x, y } = pointAt(axis.angle, ratioOf(axis.trait));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

function ConfidenceBadge({ profile }) {
  const tone = profile.confidence >= 80
    ? { bg: 'var(--lime-soft)', fg: '#166534' }
    : profile.confidence >= 55
      ? { bg: 'var(--amber-soft)', fg: '#92400e' }
      : { bg: 'var(--coral-soft)', fg: '#991b1b' };

  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
      background: tone.bg, color: tone.fg, whiteSpace: 'nowrap'
    }}>
      Độ tin cậy {profile.confidence}%
    </span>
  );
}

export default function RiasecResult({ profile, onRetake }) {
  if (!profile) return null;

  const guidance = getCareerGuidance(profile);
  const [top1, top2] = profile.ranked;

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Holland code headline */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        padding: '14px 16px', borderRadius: '14px',
        background: 'var(--accent-soft)', border: '1px solid var(--accent-primary)'
      }}>
        <div style={{
          fontSize: '1.7rem', fontWeight: 800, letterSpacing: '2px',
          color: 'var(--accent-ink, var(--accent-primary))', lineHeight: 1
        }}>
          {profile.hollandCode}
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {top1.emoji} {top1.name} · {top2.emoji} {top2.name}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Mã Holland — ba nhóm tính cách nghề nghiệp nổi bật nhất của em
          </div>
        </div>
        <ConfidenceBadge profile={profile} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '18px', alignItems: 'center' }}>

        {/* Radar */}
        <svg width="100%" viewBox="0 0 300 300" style={{ overflow: 'visible' }} role="img" aria-label={`Biểu đồ RIASEC, mã ${profile.hollandCode}`}>
          {GRID_RINGS.map(ratio => (
            <polygon
              key={ratio}
              points={polygonFor(() => ratio)}
              fill="none"
              stroke="var(--line)"
              strokeWidth={ratio === 1 ? 2 : 1}
            />
          ))}

          {AXES.map(axis => {
            const outer = pointAt(axis.angle, 1);
            return (
              <line
                key={axis.trait}
                x1={RADAR_CENTER} y1={RADAR_CENTER}
                x2={outer.x} y2={outer.y}
                stroke="var(--line-strong)"
              />
            );
          })}

          <polygon
            points={polygonFor(trait => profile.scores[trait] / MAX_TRAIT_SCORE)}
            fill="var(--accent-primary)"
            fillOpacity="0.28"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {AXES.map(axis => {
            const dot = pointAt(axis.angle, profile.scores[axis.trait] / MAX_TRAIT_SCORE);
            const label = pointAt(axis.angle, 1.22);
            return (
              <g key={`label-${axis.trait}`}>
                <circle cx={dot.x} cy={dot.y} r="4" fill="var(--accent-primary)" />
                <text
                  x={label.x} y={label.y + 5}
                  fontSize="18" fontWeight="800" textAnchor="middle"
                  fill={profile.topTraits.includes(axis.trait) ? 'var(--accent-primary)' : 'var(--text-muted)'}
                >
                  {axis.trait}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Per-trait bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {profile.ranked.map(item => (
            <div key={item.trait} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', width: '104px', flexShrink: 0, fontWeight: profile.topTraits.includes(item.trait) ? 700 : 500 }}>
                {item.emoji} {item.trait} · {item.name}
              </span>
              <div style={{ flex: 1, height: '9px', background: 'var(--line)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${item.percent}%`, height: '100%', borderRadius: '99px',
                  background: item.color, transition: 'width 0.4s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', width: '34px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How to read this result */}
      <div style={{
        display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px',
        background: 'var(--surface-soft)', border: '1px solid var(--line)',
        fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5
      }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>{profile.consistency.label}</strong> · độ phân hoá {profile.differentiation}%. {profile.consistency.note}
        </span>
      </div>

      {/* Guidance */}
      <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--surface-soft)', border: '1px solid var(--line)' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GraduationCap size={16} color="var(--accent-primary)" />
          Gợi ý hướng nghiệp · {guidance.label}
        </h4>

        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: 1.5 }}>
          <div>
            <dt style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>🎓 Nhóm ngành: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--text-secondary)' }}>{guidance.majors.join(' · ')}</dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>💼 Nghề nghiệp: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--text-secondary)' }}>{guidance.jobs.join(' · ')}</dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>📚 Khối thi: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--text-secondary)' }}>{guidance.blocks.join(' · ')}</dd>
          </div>
          {guidance.unis?.length > 0 && (
            <div>
              <dt style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>🏫 Trường tham khảo: </dt>
              <dd style={{ display: 'inline', margin: 0, color: 'var(--text-secondary)' }}>{guidance.unis.join(' · ')}</dd>
            </div>
          )}
          {guidance.alsoConsider?.length > 0 && (
            <div>
              <dt style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>➕ Cân nhắc thêm: </dt>
              <dd style={{ display: 'inline', margin: 0, color: 'var(--text-secondary)' }}>{guidance.alsoConsider.join(' · ')}</dd>
            </div>
          )}
        </dl>

        {guidance.caveat && (
          <p style={{ margin: '10px 0 0 0', fontSize: '0.78rem', color: '#92400e', background: 'var(--amber-soft)', padding: '8px 10px', borderRadius: '8px', lineHeight: 1.5 }}>
            ⚠️ {guidance.caveat}
          </p>
        )}
      </div>

      {/* While an unsaved analysis is on screen the retake button lives beside
          the save button instead, so the two decisions sit together. */}
      {onRetake && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onRetake} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={15} /> Làm lại khảo sát
          </button>
        </div>
      )}
    </div>
  );
}
