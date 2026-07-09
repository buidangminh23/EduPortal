import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Zap, Play, RotateCcw, History, Eye, ArrowDown
} from 'lucide-react';

export default function PhysicsLab() {
  const { selectedStudentId, students, labSimulations, addLabSimulation } = useContext(AppContext);
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];

  const [activeSubTab, setActiveSubTab] = useState('rlc'); // rlc, projectile, pendulum, lens, freefall
  
  // Animation frames/offsets
  const [waveOffset, setWaveOffset] = useState(0);

  // ==========================================
  // 1. STATE & HANDLERS: RLC CIRCUIT
  // ==========================================
  const [rlcR, setRlcR] = useState(100);
  const [rlcL, setRlcL] = useState(250); // mH
  const [rlcC, setRlcC] = useState(50);  // uF
  const [rlcF, setRlcF] = useState(150); // Hz

  // Real-time calculations
  const lHenry = rlcL * 0.001;
  const cFarad = rlcC * 0.000001;
  const rlcFRes = lHenry > 0 && cFarad > 0 ? (1 / (2 * Math.PI * Math.sqrt(lHenry * cFarad))) : 0;
  const omega = 2 * Math.PI * rlcF;
  const rlcXL = omega * lHenry;
  const rlcXC = cFarad > 0 ? (1 / (omega * cFarad)) : 0;
  const rlcZ = Math.sqrt(rlcR * rlcR + (rlcXL - rlcXC) * (rlcXL - rlcXC));
  const rlcPhi = rlcZ > 0 ? Math.atan((rlcXL - rlcXC) / rlcR) : 0;
  const rlcMaxI = rlcZ > 0 ? 220 / rlcZ : 0;

  useEffect(() => {
    let frameId;
    if (activeSubTab === 'rlc') {
      const animate = () => {
        // Speed of current flow depends on max current
        setWaveOffset(prev => (prev + 0.03 + (rlcMaxI * 0.02)) % (2 * Math.PI));
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frameId);
  }, [activeSubTab, rlcMaxI]);

  const handleSaveRlc = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'rlc',
      params: { R: rlcR, L: rlcL, C: rlcC, f: rlcF },
      result: {
        summary: `Mạch RLC: R=${rlcR}Ω, L=${rlcL}mH, C=${rlcC}µF, f=${rlcF}Hz.`,
        phenomenon: `f₀=${rlcFRes.toFixed(1)}Hz. Trạng thái: ${Math.abs(rlcF - rlcFRes) < 5 ? 'Cộng hưởng' : rlcF < rlcFRes ? 'Dung kháng' : 'Cảm kháng'}. Z=${rlcZ.toFixed(1)}Ω, Imax=${rlcMaxI.toFixed(2)}A.`
      }
    });
  };

  // ==========================================
  // 2. STATE & HANDLERS: PROJECTILE MOTION
  // ==========================================
  const [projV0, setProjV0] = useState(25); // m/s
  const [projAngle, setProjAngle] = useState(45); // degrees
  const [projG, setProjG] = useState(9.8); // m/s2
  const [projT, setProjT] = useState(0); // animation timer
  const [projIsFlying, setProjIsFlying] = useState(false);

  const radAngle = (projAngle * Math.PI) / 180;
  const projRange = (projV0 * projV0 * Math.sin(2 * radAngle)) / projG;
  const projMaxH = (projV0 * projV0 * Math.sin(radAngle) * Math.sin(radAngle)) / (2 * projG);
  const projFlightTime = (2 * projV0 * Math.sin(radAngle)) / projG;

  const projAnimRef = useRef(null);

  const handleLaunchProjectile = () => {
    setProjIsFlying(true);
    setProjT(0);
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = (time - startTime) / 1000; // in seconds
      if (elapsed < projFlightTime) {
        setProjT(elapsed);
        projAnimRef.current = requestAnimationFrame(animate);
      } else {
        setProjT(projFlightTime);
        setProjIsFlying(false);
        
        // Save simulation
        addLabSimulation({
          studentId: student?.id || 'HS001',
          type: 'physics',
          subType: 'projectile',
          params: { v0: projV0, angle: projAngle, g: projG },
          result: {
            summary: `Ném xiên: v₀=${projV0}m/s, α=${projAngle}°, g=${projG}m/s².`,
            phenomenon: `Tầm xa L=${projRange.toFixed(1)}m, Độ cao Hmax=${projMaxH.toFixed(1)}m, Thời gian T=${projFlightTime.toFixed(2)}s.`
          }
        });
      }
    };
    projAnimRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (projAnimRef.current) cancelAnimationFrame(projAnimRef.current);
    };
  }, []);

  // ==========================================
  // 3. STATE & HANDLERS: SINGLE PENDULUM
  // ==========================================
  const [pendL, setPendL] = useState(1.0); // meters
  const [pendAngle0, setPendAngle0] = useState(15); // degrees
  const [pendG, setPendG] = useState(9.8); // m/s2
  const [pendIsActive, setPendIsActive] = useState(true);
  const [pendTime, setPendTime] = useState(0);
  const pendTimeRef = useRef(0);

  const omegaPend = Math.sqrt(pendG / pendL);
  const pendPeriod = 2 * Math.PI * Math.sqrt(pendL / pendG);
  const pendFreq = 1 / pendPeriod;

  // Real-time swing angle
  const currentAngleRad = (pendAngle0 * Math.PI / 180) * Math.cos(omegaPend * pendTime);

  useEffect(() => {
    let frameId;
    if (pendIsActive && activeSubTab === 'pendulum') {
      const startTime = performance.now() - (pendTimeRef.current * 1000);
      const animate = (time) => {
        const nextTime = (time - startTime) / 1000;
        pendTimeRef.current = nextTime;
        setPendTime(nextTime);
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frameId);
  }, [pendIsActive, activeSubTab, pendL, pendG, pendAngle0]);

  const handleSavePendulum = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'pendulum',
      params: { L: pendL, angle0: pendAngle0, g: pendG },
      result: {
        summary: `Con lắc đơn: L=${pendL}m, θ₀=${pendAngle0}°, g=${pendG}m/s².`,
        phenomenon: `Chu kỳ T=${pendPeriod.toFixed(2)}s, Tần số f=${pendFreq.toFixed(2)}Hz.`
      }
    });
  };

  // ==========================================
  // 4. STATE & HANDLERS: CONVEX LENS
  // ==========================================
  const [lensF, setLensF] = useState(15); // focal length (cm)
  const [lensD, setLensD] = useState(25); // object distance (cm)

  const lensDp = lensD - lensF !== 0 ? (lensD * lensF) / (lensD - lensF) : 9999;
  const lensK = lensD > 0 ? -lensDp / lensD : 0;

  const isRealImage = lensDp > 0;
  const isUpright = lensK > 0;
  const isMagnified = Math.abs(lensK) > 1;

  const handleSaveLens = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'lens',
      params: { f: lensF, d: lensD },
      result: {
        summary: `Thấu kính hội tụ: f=${lensF}cm, d=${lensD}cm.`,
        phenomenon: `Khoảng cách ảnh d'=${lensDp === 9999 ? '∞' : lensDp.toFixed(1)}cm, độ phóng đại k=${lensK.toFixed(2)}. Ảnh ${isRealImage ? 'thật' : 'ảo'}, ${isUpright ? 'cùng chiều' : 'ngược chiều'}, ${isMagnified ? 'phóng to' : 'thu nhỏ'}.`
      }
    });
  };

  // ==========================================
  // 5. STATE & HANDLERS: FREE FALL
  // ==========================================
  const [fallH, setFallH] = useState(50); // height (m)
  const [fallG, setFallG] = useState(9.8); // g (m/s2)
  const [fallT, setFallT] = useState(0); // animation timer
  const [fallIsRunning, setFallIsRunning] = useState(false);

  const fallTotalTime = Math.sqrt((2 * fallH) / fallG);
  const fallFinalV = fallG * fallTotalTime;
  const fallKineticE = 0.5 * 1.0 * fallFinalV * fallFinalV; // m=1kg

  const fallAnimRef = useRef(null);

  const handleRunFreeFall = () => {
    setFallIsRunning(true);
    setFallT(0);
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = (time - startTime) / 1000;
      if (elapsed < fallTotalTime) {
        setFallT(elapsed);
        fallAnimRef.current = requestAnimationFrame(animate);
      } else {
        setFallT(fallTotalTime);
        setFallIsRunning(false);

        addLabSimulation({
          studentId: student?.id || 'HS001',
          type: 'physics',
          subType: 'freefall',
          params: { h: fallH, g: fallG },
          result: {
            summary: `Rơi tự do: h=${fallH}m, g=${fallG}m/s².`,
            phenomenon: `Thời gian rơi t=${fallTotalTime.toFixed(2)}s, Vận tốc chạm đất v=${fallFinalV.toFixed(1)}m/s, Động năng E_k=${fallKineticE.toFixed(0)}J (vật 1kg).`
          }
        });
      }
    };
    fallAnimRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (fallAnimRef.current) cancelAnimationFrame(fallAnimRef.current);
    };
  }, []);

  // ==========================================
  // 6. STATE & HANDLERS: OHM LAW CIRCUIT
  // ==========================================
  const [ohmMode, setOhmMode] = useState('series');
  const [ohmV, setOhmV] = useState(12);
  const [ohmR1, setOhmR1] = useState(40);
  const [ohmR2, setOhmR2] = useState(80);

  const ohmReq = ohmMode === 'series'
    ? ohmR1 + ohmR2
    : 1 / ((1 / ohmR1) + (1 / ohmR2));
  const ohmCurrent = ohmReq > 0 ? ohmV / ohmReq : 0;
  const ohmPower = ohmV * ohmCurrent;
  const ohmR1Current = ohmMode === 'series' ? ohmCurrent : ohmV / ohmR1;
  const ohmR2Current = ohmMode === 'series' ? ohmCurrent : ohmV / ohmR2;

  const handleSaveOhm = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'ohm',
      params: { mode: ohmMode, U: ohmV, R1: ohmR1, R2: ohmR2 },
      result: {
        summary: `Định luật Ôm: U=${ohmV}V, R₁=${ohmR1}Ω, R₂=${ohmR2}Ω, mắc ${ohmMode === 'series' ? 'nối tiếp' : 'song song'}.`,
        phenomenon: `Rtd=${ohmReq.toFixed(1)}Ω, I=${ohmCurrent.toFixed(3)}A, P=${ohmPower.toFixed(2)}W. Dòng qua R₁=${ohmR1Current.toFixed(3)}A, R₂=${ohmR2Current.toFixed(3)}A.`
      }
    });
  };

  // ==========================================
  // 7. STATE & HANDLERS: WAVE INTERFERENCE
  // ==========================================
  const [waveLambda, setWaveLambda] = useState(2.4); // cm
  const [waveSourceGap, setWaveSourceGap] = useState(8); // cm
  const [waveScreenDistance, setWaveScreenDistance] = useState(120); // cm
  const [wavePhase, setWavePhase] = useState(0); // degrees

  const fringeSpacing = waveSourceGap > 0 ? (waveLambda * waveScreenDistance) / waveSourceGap : 0;
  const centralShift = (wavePhase / 360) * fringeSpacing;
  const maxOrder = Math.max(1, Math.floor(35 / Math.max(fringeSpacing, 0.1)));

  const handleSaveWave = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'waves',
      params: { lambda: waveLambda, d: waveSourceGap, D: waveScreenDistance, phase: wavePhase },
      result: {
        summary: `Giao thoa sóng: λ=${waveLambda.toFixed(1)}cm, d=${waveSourceGap}cm, D=${waveScreenDistance}cm, Δφ=${wavePhase}°.`,
        phenomenon: `Khoảng vân i=${fringeSpacing.toFixed(1)}cm. Vân trung tâm lệch ${centralShift.toFixed(1)}cm khi hai nguồn lệch pha. Quan sát được khoảng ${maxOrder * 2 + 1} vân sáng chính.`
      }
    });
  };

  // ==========================================
  // 8. STATE & HANDLERS: ELECTROMAGNETIC INDUCTION
  // ==========================================
  const [indTurns, setIndTurns] = useState(120);
  const [indArea, setIndArea] = useState(25); // cm2
  const [indDeltaB, setIndDeltaB] = useState(0.45); // Tesla
  const [indDeltaT, setIndDeltaT] = useState(0.18); // seconds
  const [indAngle, setIndAngle] = useState(0);

  const indAreaM2 = indArea / 10000;
  const indCos = Math.cos((indAngle * Math.PI) / 180);
  const inducedEmf = indDeltaT > 0 ? indTurns * indAreaM2 * (indDeltaB / indDeltaT) * Math.abs(indCos) : 0;
  const inductionLevel = inducedEmf > 0.7 ? 'mạnh' : inducedEmf > 0.25 ? 'vừa' : 'yếu';

  const handleSaveInduction = () => {
    addLabSimulation({
      studentId: student?.id || 'HS001',
      type: 'physics',
      subType: 'induction',
      params: { N: indTurns, S: indArea, deltaB: indDeltaB, deltaT: indDeltaT, angle: indAngle },
      result: {
        summary: `Cảm ứng điện từ: N=${indTurns} vòng, S=${indArea}cm², ΔB=${indDeltaB}T, Δt=${indDeltaT}s, góc=${indAngle}°.`,
        phenomenon: `Suất điện động cảm ứng |e|=${inducedEmf.toFixed(2)}V, mức cảm ứng ${inductionLevel}. Đổi chiều chuyển động nam châm sẽ đảo chiều dòng cảm ứng.`
      }
    });
  };

  const mySimulations = labSimulations?.filter(sim => sim.studentId === student?.id && sim.type === 'physics') || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
      <div>
        {/* Navigation bar for sub-experiments */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'rlc', label: 'Mạch RLC', icon: <Zap size={15} /> },
            { id: 'projectile', label: 'Ném xiên', icon: <Play size={15} /> },
            { id: 'pendulum', label: 'Con lắc đơn', icon: <RotateCcw size={15} /> },
            { id: 'lens', label: 'Thấu kính hội tụ', icon: <Eye size={15} /> },
            { id: 'freefall', label: 'Rơi tự do', icon: <ArrowDown size={15} /> },
            { id: 'ohm', label: 'Định luật Ôm', icon: <Zap size={15} /> },
            { id: 'waves', label: 'Giao thoa sóng', icon: <RotateCcw size={15} /> },
            { id: 'induction', label: 'Cảm ứng điện từ', icon: <Zap size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`btn ${activeSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '8px 16px' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. RLC CIRCUIT EXPERIMENT */}
        {activeSubTab === 'rlc' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} /> Khảo sát Mạch điện xoay chiều RLC & Hiện tượng Cộng hưởng
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Sliders and data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Điện trở R (Ω)</span>
                    <strong>{rlcR} Ω</strong>
                  </label>
                  <input type="range" min="10" max="500" value={rlcR} onChange={e => setRlcR(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Độ tự cảm L (mH)</span>
                    <strong>{rlcL} mH</strong>
                  </label>
                  <input type="range" min="50" max="500" value={rlcL} onChange={e => setRlcL(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Điện dung C (µF)</span>
                    <strong>{rlcC} µF</strong>
                  </label>
                  <input type="range" min="10" max="200" value={rlcC} onChange={e => setRlcC(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tần số dòng điện f (Hz)</span>
                    <strong>{rlcF} Hz</strong>
                  </label>
                  <input type="range" min="10" max="500" value={rlcF} onChange={e => setRlcF(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center', background: 'rgba(99,102,241,0.04)', padding: 10, borderRadius: 10, border: '1px solid rgba(99,102,241,0.08)' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cộng hưởng f₀</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{rlcFRes.toFixed(1)} Hz</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tổng trở Z</span>
                    <div style={{ fontWeight: 700 }}>{rlcZ.toFixed(1)} Ω</div>
                  </div>
                </div>

                <button onClick={handleSaveRlc} className="btn btn-primary" style={{ width: '100%', height: 38 }}>Ghi nhận kết quả RLC</button>
              </div>

              {/* Real-time Oscilloscope Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 700 }}>Đồ thị dao động u(t) & i(t):</span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12, background: Math.abs(rlcF - rlcFRes) < 5 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.04)', color: Math.abs(rlcF - rlcFRes) < 5 ? '#10b981' : '#64748b', fontWeight: 700 }}>
                    {Math.abs(rlcF - rlcFRes) < 5 ? '🎯 CỘNG HƯỞNG' : rlcF < rlcFRes ? '⚡ TÍNH DUNG KHÁNG' : '⚡ TÍNH CẢM KHÁNG'}
                  </span>
                </div>

                <div style={{ background: '#0f172a', padding: 12, borderRadius: 12, border: '1px solid #1e293b' }}>
                  <svg width="100%" height="100" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="4" />
                    
                    {/* Voltage wave (Red) */}
                    <path d={
                      Array.from({ length: 100 }, (_, i) => {
                        const x = (i / 100) * 400;
                        const y = 50 + 35 * Math.sin((i * (rlcF / 150) / 8) + waveOffset);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')
                    } fill="none" stroke="#ef4444" strokeWidth="2" />

                    {/* Current wave (Blue - dynamic phase & amp) */}
                    <path d={
                      Array.from({ length: 100 }, (_, i) => {
                        const x = (i / 100) * 400;
                        const y = 50 + Math.min(42, rlcMaxI * 20) * Math.sin((i * (rlcF / 150) / 8) + waveOffset - rlcPhi);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')
                    } fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                  </svg>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 6, fontSize: '0.68rem' }}>
                    <span style={{ color: '#ef4444' }}>● u(t) Điện áp</span>
                    <span style={{ color: '#0ea5e9' }}>● i(t) Dòng điện (Độ lệch pha: {((rlcPhi * 180) / Math.PI).toFixed(0)}°)</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: '#fff', padding: 8, borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)', lineHeight: 1.4 }}>
                  {Math.abs(rlcF - rlcFRes) < 5 
                    ? 'Mạch ở trạng thái Cộng Hưởng: Cảm kháng bằng dung kháng, dòng điện cùng pha với điện áp và đạt giá trị cực đại.' 
                    : rlcF < rlcFRes 
                      ? 'Dòng điện i(t) nhanh pha hơn điện áp u(t) do dung kháng lớn hơn cảm kháng (mạch có tính dung kháng).'
                      : 'Điện áp u(t) nhanh pha hơn dòng điện i(t) do cảm kháng lớn hơn dung kháng (mạch có tính cảm kháng).'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROJECTILE MOTION EXPERIMENT */}
        {activeSubTab === 'projectile' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play size={18} /> Khảo sát Chuyển động ném xiên trong Trọng trường
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Sliders and actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vận tốc ban đầu v₀ (m/s)</span>
                    <strong>{projV0} m/s</strong>
                  </label>
                  <input type="range" min="5" max="50" value={projV0} onChange={e => setProjV0(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Góc ném α (độ)</span>
                    <strong>{projAngle}°</strong>
                  </label>
                  <input type="range" min="10" max="80" value={projAngle} onChange={e => setProjAngle(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gia tốc g (m/s²)</span>
                    <strong>{projG} m/s²</strong>
                  </label>
                  <input type="range" min="1" max="15" step="0.1" value={projG} onChange={e => setProjG(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center', background: 'rgba(251,191,36,0.05)', padding: 10, borderRadius: 10, fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Tầm xa L</span>
                    <div style={{ fontWeight: 700 }}>{projRange.toFixed(1)} m</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Độ cao Hmax</span>
                    <div style={{ fontWeight: 700 }}>{projMaxH.toFixed(1)} m</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thời gian bay</span>
                    <div style={{ fontWeight: 700 }}>{projFlightTime.toFixed(2)} s</div>
                  </div>
                </div>

                <button onClick={handleLaunchProjectile} disabled={projIsFlying} className="btn btn-primary" style={{ width: '100%', height: 38, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}>
                  {projIsFlying ? 'Đang bay...' : 'Phóng Vật Thể'}
                </button>
              </div>

              {/* SVG Trajectory plot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Quỹ đạo chuyển động:</span>
                <div style={{ background: '#0f172a', padding: 10, borderRadius: 12, border: '1px solid #1e293b' }}>
                  <svg width="100%" height="150" viewBox="0 0 250 100" preserveAspectRatio="none">
                    {/* Ground line */}
                    <line x1="0" y1="90" x2="250" y2="90" stroke="#475569" strokeWidth="2" />
                    
                    {/* Expected trajectory (dashed line) */}
                    <path d={
                      Array.from({ length: 40 }, (_, i) => {
                        const tPoint = (i / 40) * projFlightTime;
                        const x = (projV0 * Math.cos(radAngle) * tPoint) * (200 / projRange); // scale to 200px
                        const y = 90 - (projV0 * Math.sin(radAngle) * tPoint - 0.5 * projG * tPoint * tPoint) * (80 / projMaxH);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')
                    } fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3" />

                    {/* Flying ball */}
                    {projT > 0 && (
                      <circle
                        cx={(projV0 * Math.cos(radAngle) * projT) * (200 / projRange)}
                        cy={90 - (projV0 * Math.sin(radAngle) * projT - 0.5 * projG * projT * projT) * (80 / projMaxH)}
                        r="4.5"
                        fill="#fbbf24"
                        style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PENDULUM EXPERIMENT */}
        {activeSubTab === 'pendulum' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={18} /> Khảo sát Dao động điều hòa của Con lắc đơn
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Chiều dài dây l (m)</span>
                    <strong>{pendL.toFixed(2)} m</strong>
                  </label>
                  <input type="range" min="0.2" max="2.0" step="0.05" value={pendL} onChange={e => setPendL(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Biên độ góc θ₀ (độ)</span>
                    <strong>{pendAngle0}°</strong>
                  </label>
                  <input type="range" min="5" max="30" value={pendAngle0} onChange={e => setPendAngle0(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gia tốc trọng trường g (m/s²)</span>
                    <strong>{pendG} m/s²</strong>
                  </label>
                  <input type="range" min="1" max="15" step="0.1" value={pendG} onChange={e => setPendG(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center', background: 'rgba(16,185,129,0.05)', padding: 10, borderRadius: 10, fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Chu kỳ T</span>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{pendPeriod.toFixed(2)} s</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Tần số f</span>
                    <div style={{ fontWeight: 700 }}>{pendFreq.toFixed(2)} Hz</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPendIsActive(!pendIsActive)} className="btn btn-primary" style={{ flex: 1, height: 38 }}>
                    {pendIsActive ? 'Tạm Dừng' : 'Tiếp Tục'}
                  </button>
                  <button onClick={handleSavePendulum} className="btn btn-secondary" style={{ flex: 1, height: 38 }}>Ghi nhật ký</button>
                </div>
              </div>

              {/* Graphic Pendulum */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 16, padding: 20 }}>
                <div style={{ position: 'relative', width: 150, height: 160 }}>
                  <svg width="100%" height="100%">
                    {/* Pivot point */}
                    <circle cx="75" cy="15" r="4" fill="#94a3b8" />
                    <line x1="50" y1="15" x2="100" y2="15" stroke="#475569" strokeWidth="2" />
                    
                    {/* Pendulum string & bob */}
                    {(() => {
                      const lScale = 20 + pendL * 50; // Scale height dynamically
                      const bobX = 75 + lScale * Math.sin(currentAngleRad);
                      const bobY = 15 + lScale * Math.cos(currentAngleRad);
                      return (
                        <>
                          <line x1="75" y1="15" x2={bobX} y2={bobY} stroke="#cbd5e1" strokeWidth="1.5" />
                          <circle cx={bobX} cy={bobY} r="8" fill="#10b981" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CONVEX LENS EXPERIMENT */}
        {activeSubTab === 'lens' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={18} /> Quang hình học: Tạo ảnh qua Thấu kính hội tụ
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tiêu cự f (cm)</span>
                    <strong>{lensF} cm</strong>
                  </label>
                  <input type="range" min="5" max="30" value={lensF} onChange={e => setLensF(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Khoảng cách vật d (cm)</span>
                    <strong>{lensD} cm</strong>
                  </label>
                  <input type="range" min="5" max="60" value={lensD} onChange={e => setLensD(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ background: 'rgba(99,102,241,0.05)', padding: 12, borderRadius: 12, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>• Vị trí ảnh d': <strong style={{ color: 'var(--accent-primary)' }}>{lensDp === 9999 ? 'Vô hạn (∞)' : `${lensDp.toFixed(1)} cm`}</strong></div>
                  <div>• Độ phóng đại k: <strong>{lensK.toFixed(2)}</strong></div>
                  <div>• Đặc điểm: <strong>Ảnh {isRealImage ? 'Thật' : 'Ảo'}, {isUpright ? 'Cùng chiều' : 'Ngược chiều'}, {isMagnified ? 'Phóng to' : 'Thu nhỏ'}</strong></div>
                </div>

                <button onClick={handleSaveLens} className="btn btn-primary" style={{ width: '100%', height: 38 }}>Ghi nhận thấu kính</button>
              </div>

              {/* SVG Lens ray representation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Đường đi tia sáng qua thấu kính:</span>
                <div style={{ background: '#0f172a', padding: 8, borderRadius: 12, border: '1px solid #1e293b' }}>
                  <svg width="100%" height="160" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
                    {/* Axis line */}
                    <line x1="0" y1="60" x2="200" y2="60" stroke="#475569" strokeWidth="1" strokeDasharray="3" />
                    
                    {/* Vertical lens */}
                    <line x1="100" y1="10" x2="100" y2="110" stroke="#38bdf8" strokeWidth="2.5" />
                    <polygon points="100,5 97,12 103,12" fill="#38bdf8" />
                    <polygon points="100,115 97,108 103,108" fill="#38bdf8" />

                    {/* Focal points */}
                    <circle cx={100 - lensF * 1.5} cy="60" r="2.5" fill="#f43f5e" />
                    <text x={95 - lensF * 1.5} y="72" fill="#f43f5e" fontSize="7">F</text>

                    <circle cx={100 + lensF * 1.5} cy="60" r="2.5" fill="#f43f5e" />
                    <text x={97 + lensF * 1.5} y="72" fill="#f43f5e" fontSize="7">F'</text>

                    {/* Object (Arrow on left) */}
                    {(() => {
                      const objX = 100 - lensD * 1.5;
                      const objH = 20;
                      return (
                        <>
                          <line x1={objX} y1="60" x2={objX} y2={60 - objH} stroke="#ef4444" strokeWidth="2" />
                          <polygon points={`${objX},${60 - objH} ${objX - 3},${60 - objH + 5} ${objX + 3},${60 - objH + 5}`} fill="#ef4444" />
                          <text x={objX - 4} y="55" fill="#ef4444" fontSize="7">A</text>
                        </>
                      );
                    })()}

                    {/* Rays of Light */}
                    {(() => {
                      const objX = 100 - lensD * 1.5;
                      const objH = 20;
                      const imgX = 100 + lensDp * 1.5;
                      const imgH = objH * lensK;
                      
                      return (
                        <>
                          {/* Ray 1: Parallel to Axis -> through F' */}
                          <line x1={objX} y1={60 - objH} x2="100" y2={60 - objH} stroke="#22c55e" strokeWidth="1" />
                          {lensDp !== 9999 && (
                            <line x1="100" y1={60 - objH} x2={imgX} y2={60 + imgH} stroke="#22c55e" strokeWidth="1" />
                          )}

                          {/* Ray 2: Optical center straight */}
                          {lensDp !== 9999 && (
                            <line x1={objX} y1={60 - objH} x2={imgX} y2={60 + imgH} stroke="#eab308" strokeWidth="1" />
                          )}
                        </>
                      );
                    })()}

                    {/* Image (Arrow on right/left) */}
                    {(() => {
                      if (lensDp === 9999) return null;
                      const imgX = 100 + lensDp * 1.5;
                      const imgH = 20 * lensK; // scales height
                      
                      // Filter drawing limits
                      if (imgX < 0 || imgX > 200) return null;

                      return (
                        <>
                          <line x1={imgX} y1="60" x2={imgX} y2={60 + imgH} stroke="#0ea5e9" strokeWidth="2" strokeDasharray={isRealImage ? '0' : '3'} />
                          {isUpright ? (
                            <polygon points={`${imgX},${60 + imgH} ${imgX - 3},${60 + imgH - 5} ${imgX + 3},${60 + imgH - 5}`} fill="#0ea5e9" />
                          ) : (
                            <polygon points={`${imgX},${60 + imgH} ${imgX - 3},${60 + imgH + 5} ${imgX + 3},${60 + imgH + 5}`} fill="#0ea5e9" />
                          )}
                          <text x={imgX - 4} y={60 + imgH + (isUpright ? -5 : 10)} fill="#0ea5e9" fontSize="7">A'</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. FREE FALL EXPERIMENT */}
        {activeSubTab === 'freefall' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowDown size={18} /> Mô phỏng Rơi tự do & Xác định Động năng va chạm
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Độ cao h (m)</span>
                    <strong>{fallH} m</strong>
                  </label>
                  <input type="range" min="10" max="100" value={fallH} onChange={e => setFallH(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gia tốc rơi g (m/s²)</span>
                    <strong>{fallG} m/s²</strong>
                  </label>
                  <input type="range" min="5" max="15" step="0.1" value={fallG} onChange={e => setFallG(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: 10, borderRadius: 10, fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thời gian rơi t</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{fallTotalTime.toFixed(2)} s</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vận tốc chạm đất</span>
                    <div style={{ fontWeight: 700 }}>{fallFinalV.toFixed(1)} m/s</div>
                  </div>
                </div>

                <button onClick={handleRunFreeFall} disabled={fallIsRunning} className="btn btn-primary" style={{ width: '100%', height: 38, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none' }}>
                  {fallIsRunning ? 'Đang rơi...' : 'Thả Rơi Vật'}
                </button>
              </div>

              {/* Graphic container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 16, padding: 20 }}>
                <div style={{ position: 'relative', width: 100, height: 160 }}>
                  <svg width="100%" height="100%">
                    {/* Scale axis */}
                    <line x1="30" y1="10" x2="30" y2="140" stroke="#475569" strokeWidth="2" />
                    <line x1="25" y1="10" x2="35" y2="10" stroke="#475569" strokeWidth="2" />
                    <text x="10" y="14" fill="#64748b" fontSize="7">{fallH}m</text>
                    <line x1="25" y1="140" x2="35" y2="140" stroke="#475569" strokeWidth="2" />
                    <text x="12" y="142" fill="#64748b" fontSize="7">0m</text>

                    {/* Falling ball */}
                    {(() => {
                      // y_current = h - 0.5 * g * t^2
                      const currentY = fallH - 0.5 * fallG * fallT * fallT;
                      const py = 10 + (130 * (fallH - currentY)) / fallH;
                      return (
                        <circle cx="55" cy={py} r="6.5" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. OHM LAW EXPERIMENT */}
        {activeSubTab === 'ohm' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} /> Mạch điện một chiều: Định luật Ôm, công suất và cách mắc điện trở
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    ['series', 'Nối tiếp'],
                    ['parallel', 'Song song']
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setOhmMode(id)}
                      className={`btn ${ohmMode === id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, height: 36 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Hiệu điện thế U</span>
                    <strong>{ohmV} V</strong>
                  </label>
                  <input type="range" min="1" max="24" value={ohmV} onChange={e => setOhmV(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Điện trở R₁</span>
                    <strong>{ohmR1} Ω</strong>
                  </label>
                  <input type="range" min="5" max="200" value={ohmR1} onChange={e => setOhmR1(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Điện trở R₂</span>
                    <strong>{ohmR2} Ω</strong>
                  </label>
                  <input type="range" min="5" max="200" value={ohmR2} onChange={e => setOhmR2(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', background: 'rgba(99,102,241,0.05)', padding: 10, borderRadius: 10, fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>R tương đương</span>
                    <div style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{ohmReq.toFixed(1)} Ω</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Dòng mạch chính</span>
                    <div style={{ fontWeight: 800 }}>{ohmCurrent.toFixed(3)} A</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Công suất</span>
                    <div style={{ fontWeight: 800 }}>{ohmPower.toFixed(2)} W</div>
                  </div>
                </div>

                <button onClick={handleSaveOhm} className="btn btn-primary" style={{ width: '100%', height: 38 }}>Ghi nhận mạch điện</button>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 16, padding: 16, color: '#e2e8f0' }}>
                <svg width="100%" height="170" viewBox="0 0 260 160">
                  <rect x="16" y="40" width="32" height="80" rx="5" fill="#334155" stroke="#94a3b8" />
                  <line x1="32" y1="52" x2="32" y2="72" stroke="#f8fafc" strokeWidth="3" />
                  <line x1="24" y1="62" x2="40" y2="62" stroke="#f8fafc" strokeWidth="3" />
                  <line x1="32" y1="90" x2="32" y2="110" stroke="#f8fafc" strokeWidth="3" />
                  <text x="18" y="136" fill="#94a3b8" fontSize="9">{ohmV}V</text>

                  {ohmMode === 'series' ? (
                    <>
                      <path d="M 48 60 H 112 M 148 60 H 210 V 120 H 32 V 120" fill="none" stroke="#64748b" strokeWidth="3" />
                      <rect x="112" y="49" width="36" height="22" rx="5" fill="#f59e0b" />
                      <text x="118" y="64" fill="#111827" fontSize="10" fontWeight="700">R₁</text>
                      <rect x="160" y="109" width="36" height="22" rx="5" fill="#38bdf8" />
                      <text x="166" y="124" fill="#082f49" fontSize="10" fontWeight="700">R₂</text>
                    </>
                  ) : (
                    <>
                      <path d="M 48 60 H 85 V 32 H 162 V 60 H 210 V 120 H 32 V 120" fill="none" stroke="#64748b" strokeWidth="3" />
                      <path d="M 85 60 V 88 H 162 V 60" fill="none" stroke="#64748b" strokeWidth="3" />
                      <rect x="104" y="21" width="38" height="22" rx="5" fill="#f59e0b" />
                      <text x="110" y="36" fill="#111827" fontSize="10" fontWeight="700">R₁</text>
                      <rect x="104" y="77" width="38" height="22" rx="5" fill="#38bdf8" />
                      <text x="110" y="92" fill="#082f49" fontSize="10" fontWeight="700">R₂</text>
                    </>
                  )}

                  <circle cx="220" cy="90" r={Math.min(22, 8 + ohmPower / 5)} fill="rgba(250,204,21,0.22)" />
                  <circle cx="220" cy="90" r="11" fill="#facc15" opacity={Math.min(1, 0.25 + ohmPower / 20)} />
                  <text x="204" y="128" fill="#facc15" fontSize="9">Bóng đèn</text>
                </svg>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  <strong>Dòng qua R₁:</strong> {ohmR1Current.toFixed(3)}A · <strong>Dòng qua R₂:</strong> {ohmR2Current.toFixed(3)}A.
                  {ohmMode === 'series'
                    ? ' Nối tiếp có cùng dòng điện qua mọi phần tử, điện trở tương đương tăng.'
                    : ' Song song có cùng hiệu điện thế trên mỗi nhánh, điện trở tương đương giảm.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. WAVE INTERFERENCE EXPERIMENT */}
        {activeSubTab === 'waves' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={18} /> Giao thoa hai nguồn kết hợp và khoảng vân
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bước sóng λ</span>
                    <strong>{waveLambda.toFixed(1)} cm</strong>
                  </label>
                  <input type="range" min="0.8" max="6" step="0.1" value={waveLambda} onChange={e => setWaveLambda(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Khoảng cách hai nguồn d</span>
                    <strong>{waveSourceGap} cm</strong>
                  </label>
                  <input type="range" min="3" max="18" value={waveSourceGap} onChange={e => setWaveSourceGap(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Khoảng cách màn D</span>
                    <strong>{waveScreenDistance} cm</strong>
                  </label>
                  <input type="range" min="60" max="220" value={waveScreenDistance} onChange={e => setWaveScreenDistance(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Độ lệch pha Δφ</span>
                    <strong>{wavePhase}°</strong>
                  </label>
                  <input type="range" min="-180" max="180" value={wavePhase} onChange={e => setWavePhase(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ background: 'rgba(14,165,233,0.05)', padding: 12, borderRadius: 12, fontSize: '0.8rem', display: 'grid', gap: 5 }}>
                  <div>• Khoảng vân: <strong style={{ color: 'var(--accent-primary)' }}>i = {fringeSpacing.toFixed(1)} cm</strong></div>
                  <div>• Vân trung tâm lệch: <strong>{centralShift.toFixed(1)} cm</strong></div>
                  <div>• Điều kiện cực đại: <strong>Δd = kλ</strong>; cực tiểu: <strong>Δd = (k + 1/2)λ</strong></div>
                </div>

                <button onClick={handleSaveWave} className="btn btn-primary" style={{ width: '100%', height: 38 }}>Ghi nhận giao thoa</button>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, color: '#e2e8f0' }}>
                <svg width="100%" height="190" viewBox="0 0 260 180">
                  <rect x="210" y="16" width="16" height="146" rx="4" fill="#1e293b" stroke="#475569" />
                  {Array.from({ length: maxOrder * 2 + 1 }, (_, i) => i - maxOrder).map(order => {
                    const y = 89 + order * Math.min(22, Math.max(5, fringeSpacing * 1.2)) + centralShift * 0.6;
                    const bright = Math.abs(order) === 0 ? 1 : Math.max(0.35, 1 - Math.abs(order) * 0.13);
                    if (y < 22 || y > 156) return null;
                    return <rect key={order} x="211" y={y - 2} width="14" height="4" rx="2" fill="#38bdf8" opacity={bright} />;
                  })}
                  <circle cx="48" cy={90 - waveSourceGap * 2} r="5" fill="#f59e0b" />
                  <circle cx="48" cy={90 + waveSourceGap * 2} r="5" fill="#f59e0b" />
                  <text x="30" y={84 - waveSourceGap * 2} fill="#f59e0b" fontSize="9">S₁</text>
                  <text x="30" y={104 + waveSourceGap * 2} fill="#f59e0b" fontSize="9">S₂</text>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(r => (
                    <g key={r}>
                      <circle cx="48" cy={90 - waveSourceGap * 2} r={r * waveLambda * 3.1} fill="none" stroke="#38bdf8" strokeWidth="0.7" opacity={0.18} />
                      <circle cx="48" cy={90 + waveSourceGap * 2} r={r * waveLambda * 3.1} fill="none" stroke="#22c55e" strokeWidth="0.7" opacity={0.18} />
                    </g>
                  ))}
                  <path d="M 55 90 C 100 62, 150 50, 210 88" fill="none" stroke="#38bdf8" strokeDasharray="4" strokeWidth="1" opacity="0.7" />
                  <path d="M 55 90 C 100 118, 150 128, 210 92" fill="none" stroke="#22c55e" strokeDasharray="4" strokeWidth="1" opacity="0.7" />
                  <text x="190" y="174" fill="#94a3b8" fontSize="9">Màn quan sát</text>
                </svg>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Khi tăng λ hoặc D, khoảng vân rộng ra. Khi tăng d, các vân sít lại. Lệch pha làm toàn bộ hệ vân dịch chuyển.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. ELECTROMAGNETIC INDUCTION EXPERIMENT */}
        {activeSubTab === 'induction' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} /> Cảm ứng điện từ: Faraday - Lenz
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Số vòng dây N</span>
                    <strong>{indTurns} vòng</strong>
                  </label>
                  <input type="range" min="20" max="500" value={indTurns} onChange={e => setIndTurns(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Diện tích cuộn dây S</span>
                    <strong>{indArea} cm²</strong>
                  </label>
                  <input type="range" min="5" max="100" value={indArea} onChange={e => setIndArea(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Độ biến thiên từ trường ΔB</span>
                    <strong>{indDeltaB.toFixed(2)} T</strong>
                  </label>
                  <input type="range" min="0.05" max="1.5" step="0.05" value={indDeltaB} onChange={e => setIndDeltaB(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thời gian biến thiên Δt</span>
                    <strong>{indDeltaT.toFixed(2)} s</strong>
                  </label>
                  <input type="range" min="0.05" max="1.2" step="0.01" value={indDeltaT} onChange={e => setIndDeltaT(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Góc giữa pháp tuyến và B</span>
                    <strong>{indAngle}°</strong>
                  </label>
                  <input type="range" min="0" max="90" value={indAngle} onChange={e => setIndAngle(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ background: 'rgba(16,185,129,0.06)', padding: 12, borderRadius: 12, fontSize: '0.8rem' }}>
                  <div>• Công thức: <strong>|e| = N · S · |ΔB/Δt| · |cos α|</strong></div>
                  <div>• Suất điện động cảm ứng: <strong style={{ color: '#059669' }}>{inducedEmf.toFixed(2)} V</strong></div>
                  <div>• Nhận xét: cảm ứng <strong>{inductionLevel}</strong>, tăng khi đưa nam châm nhanh hơn hoặc tăng số vòng dây.</div>
                </div>

                <button onClick={handleSaveInduction} className="btn btn-primary" style={{ width: '100%', height: 38 }}>Ghi nhận cảm ứng điện từ</button>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 16, padding: 16, color: '#e2e8f0' }}>
                <svg width="100%" height="185" viewBox="0 0 260 180">
                  <defs>
                    <linearGradient id="magnetGradient" x1="0" x2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <rect x={32 + Math.min(60, inducedEmf * 24)} y="70" width="70" height="28" rx="6" fill="url(#magnetGradient)" stroke="#f8fafc" />
                  <text x={46 + Math.min(60, inducedEmf * 24)} y="88" fill="#fff" fontSize="10" fontWeight="800">N</text>
                  <text x={86 + Math.min(60, inducedEmf * 24)} y="88" fill="#082f49" fontSize="10" fontWeight="800">S</text>

                  <ellipse cx="165" cy="84" rx="36" ry="58" fill="none" stroke="#f59e0b" strokeWidth="3" />
                  <ellipse cx="165" cy="84" rx="28" ry="50" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
                  <ellipse cx="165" cy="84" rx="20" ry="42" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" />
                  <text x="145" y="156" fill="#f59e0b" fontSize="9">Cuộn {indTurns} vòng</text>

                  {Array.from({ length: 7 }, (_, i) => (
                    <line key={i} x1={88 + i * 12} y1="56" x2={125 + i * 9} y2="56" stroke="#38bdf8" strokeWidth="1.5" opacity={Math.min(1, 0.22 + inducedEmf / 2)} />
                  ))}
                  <path d="M 128 32 H 220 V 136 H 128" fill="none" stroke="#64748b" strokeWidth="2" />
                  <circle cx="220" cy="84" r="18" fill="#111827" stroke="#94a3b8" />
                  <path d={`M 220 84 L ${220 + Math.min(14, inducedEmf * 8)} ${84 - Math.min(10, inducedEmf * 5)}`} stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                  <text x="204" y="112" fill="#94a3b8" fontSize="8">Galvanometer</text>
                </svg>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Theo định luật Lenz, dòng cảm ứng sinh ra từ trường chống lại sự biến thiên từ thông ban đầu. Đưa nam châm ra xa sẽ làm kim lệch chiều ngược lại.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL HISTORY SIMULATIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(255,255,255,0.6)', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} /> Nhật ký thí nghiệm Lý
          </h4>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420 }}>
            {mySimulations.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px 10px' }}>
                Chưa thực hiện thí nghiệm vật lý nào.
              </div>
            ) : (
              mySimulations.map(sim => (
                <div 
                  key={sim.id} 
                  style={{ 
                    padding: 10, 
                    borderRadius: 12, 
                    background: '#fff', 
                    border: '1px solid rgba(0,0,0,0.04)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 700 }}>
                    <span style={{ color: 'var(--accent-primary)' }}>
                      {sim.subType === 'rlc' ? 'Mạch RLC' :
                       sim.subType === 'projectile' ? 'Ném xiên' :
                       sim.subType === 'pendulum' ? 'Con lắc đơn' :
                       sim.subType === 'lens' ? 'Thấu kính' :
                       sim.subType === 'freefall' ? 'Rơi tự do' :
                       sim.subType === 'ohm' ? 'Định luật Ôm' :
                       sim.subType === 'waves' ? 'Giao thoa sóng' :
                       sim.subType === 'induction' ? 'Cảm ứng điện từ' : 'Thí nghiệm vật lý'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{sim.date}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sim.result.summary}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: 2 }}>
                      {sim.result.phenomenon}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
