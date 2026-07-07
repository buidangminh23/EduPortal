import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Beaker, Flame, Zap, Droplets, History
} from 'lucide-react';

const BUBBLES_DATA = [
  { left: '20%', size: 6, delay: '0.2s', duration: '1.8s' },
  { left: '45%', size: 4, delay: '0.5s', duration: '2.2s' },
  { left: '70%', size: 8, delay: '0s', duration: '1.5s' },
  { left: '30%', size: 5, delay: '0.8s', duration: '2.0s' },
  { left: '60%', size: 7, delay: '0.3s', duration: '1.7s' },
  { left: '15%', size: 4, delay: '1.2s', duration: '2.5s' },
  { left: '80%', size: 5, delay: '0.6s', duration: '1.9s' },
  { left: '50%', size: 9, delay: '1.0s', duration: '2.1s' }
];

export default function ChemistryLab() {
  const { selectedStudentId, students, labSimulations, addLabSimulation } = useContext(AppContext);
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];

  const [activeSubTab, setActiveSubTab] = useState('ion_exchange'); // ion_exchange, activity_series, ph_indicator, combustion, electrolysis
  const [reactionActive, setReactionActive] = useState(false);

  // --- Audio Synthesis Helper ---
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'pour') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'fizz' || type === 'sizzle') {
        const bufferSize = ctx.sampleRate * (type === 'fizz' ? 1.5 : 1.0);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'fizz' ? 900 : 2000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(type === 'fizz' ? 0.04 : 0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'fizz' ? 1.5 : 1.0));
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + (type === 'fizz' ? 1.5 : 1.0));
      }
    } catch (e) {
      console.warn("Web Audio API is blocked or unsupported:", e);
    }
  };

  // ==========================================
  // 1. STATE & HANDLERS: ION EXCHANGE
  // ==========================================
  const [selectedTube1, setSelectedTube1] = useState(null);
  const [selectedTube2, setSelectedTube2] = useState(null);
  const [pouringState, setPouringState] = useState('idle'); // idle, pouring1, pouring2, completed
  const [ionResult, setIonResult] = useState(null);
  const [liquidColor, setLiquidColor] = useState('rgba(255,255,255,0.7)');
  const [showBubbles, setShowBubbles] = useState(false);
  const [showPrecipitate, setShowPrecipitate] = useState(false);
  const [precipitateColor, setPrecipitateColor] = useState('');

  const ionTubes = [
    { name: 'HCl', desc: 'Axit Clohydric', color: 'rgba(226,232,240,0.3)', text: 'HCl' },
    { name: 'NaOH', desc: 'Natri Hiđrôxit', color: 'rgba(226,232,240,0.3)', text: 'NaOH' },
    { name: 'CuSO4', desc: 'Đồng(II) sunfat', color: 'rgba(14, 165, 233, 0.7)', text: 'CuSO₄' },
    { name: 'FeCl3', desc: 'Sắt(III) clorua', color: 'rgba(245, 158, 11, 0.7)', text: 'FeCl₃' },
    { name: 'KSCN', desc: 'Kali thiosianat', color: 'rgba(226,232,240,0.3)', text: 'KSCN' },
    { name: 'Na2CO3', desc: 'Natri cacbonat', color: 'rgba(226,232,240,0.3)', text: 'Na₂CO₃' },
    { name: 'AgNO3', desc: 'Bạc nitrat', color: 'rgba(226,232,240,0.3)', text: 'AgNO₃' },
    { name: 'BaCl2', desc: 'Bari clorua', color: 'rgba(226,232,240,0.3)', text: 'BaCl₂' }
  ];

  const handleSelectIonTube = (name) => {
    if (selectedTube1 === name || selectedTube2 === name) return;
    if (!selectedTube1) setSelectedTube1(name);
    else if (!selectedTube2) setSelectedTube2(name);
  };

  const handleRunIonExchange = () => {
    if (!selectedTube1 || !selectedTube2) return;
    setReactionActive(true);
    setPouringState('pouring1');
    playSound('pour');
    setLiquidColor('rgba(226, 232, 240, 0.5)');
    setShowBubbles(false);
    setShowPrecipitate(false);

    setTimeout(() => {
      setPouringState('pouring2');
      playSound('pour');
      setLiquidColor('rgba(203, 213, 225, 0.6)');

      setTimeout(() => {
        setPouringState('completed');
        setReactionActive(false);

        // Chemically accurate reactions resolver
        const mix = `${selectedTube1}+${selectedTube2}`;
        const reverseMix = `${selectedTube2}+${selectedTube1}`;
        let eqn = `${selectedTube1} + ${selectedTube2} → ?`;
        let color = 'rgba(255,255,255,0.7)';
        let ppt = false;
        let pptCol = '';
        let gas = false;
        let phenomenon = 'Không xảy ra hiện tượng phản ứng hóa học rõ rệt.';

        if (mix === 'HCl+NaOH' || reverseMix === 'HCl+NaOH') {
          eqn = 'HCl + NaOH → NaCl + H₂O';
          color = 'rgba(16, 185, 129, 0.3)'; // neutral light green
          phenomenon = 'Phản ứng trung hòa tỏa nhiệt nhẹ. Không tạo kết tủa hay chất khí.';
        } else if (mix === 'CuSO4+NaOH' || reverseMix === 'CuSO4+NaOH') {
          eqn = 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄';
          color = 'rgba(14, 165, 233, 0.3)';
          ppt = true;
          pptCol = 'rgba(14, 165, 233, 0.8)'; // blue precipitate
          phenomenon = 'Tạo kết tủa keo màu xanh lam của Đồng(II) hiđrôxit Cu(OH)₂.';
        } else if (mix === 'FeCl3+KSCN' || reverseMix === 'FeCl3+KSCN') {
          eqn = 'FeCl₃ + 3KSCN ⇄ Fe(SCN)₃ + 3KCl';
          color = 'rgba(185, 28, 28, 0.75)'; // blood red
          phenomenon = 'Dung dịch chuyển sang màu đỏ máu đặc trưng của phức thiocyanat sắt(III).';
        } else if (mix === 'Na2CO3+HCl' || reverseMix === 'Na2CO3+HCl') {
          eqn = 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑';
          color = 'rgba(226, 232, 240, 0.4)';
          gas = true;
          phenomenon = 'Hiện tượng sủi bọt khí mạnh mẽ của khí Carbon dioxide CO₂.';
        } else if (mix === 'AgNO3+HCl' || reverseMix === 'AgNO3+HCl') {
          eqn = 'AgNO₃ + HCl → AgCl↓ + HNO₃';
          color = 'rgba(255, 255, 255, 0.4)';
          ppt = true;
          pptCol = 'rgba(241, 245, 249, 0.9)'; // white curdy
          phenomenon = 'Tạo kết tủa lắng màu trắng vón của Bạc clorua AgCl.';
        } else if (mix === 'BaCl2+Na2CO3' || reverseMix === 'BaCl2+Na2CO3') {
          eqn = 'BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl';
          color = 'rgba(255, 255, 255, 0.4)';
          ppt = true;
          pptCol = 'rgba(255, 255, 255, 0.9)';
          phenomenon = 'Xuất hiện kết tủa trắng tinh khiết của Bari cacbonat BaCO₃.';
        } else if (mix === 'CuSO4+BaCl2' || reverseMix === 'CuSO4+BaCl2') {
          eqn = 'CuSO₄ + BaCl₂ → BaSO₄↓ + CuCl₂';
          color = 'rgba(14, 165, 233, 0.25)'; // faint blue solution
          ppt = true;
          pptCol = 'rgba(255, 255, 255, 0.9)'; // white ppt of BaSO4
          phenomenon = 'Tạo kết tủa trắng mịn của Bari sunfat BaSO₄ không tan trong axit, dung dịch trên có màu xanh nhạt.';
        } else if (mix === 'FeCl3+NaOH' || reverseMix === 'FeCl3+NaOH') {
          eqn = 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl';
          color = 'rgba(245, 158, 11, 0.2)';
          ppt = true;
          pptCol = 'rgba(180, 83, 9, 0.8)'; // reddish-brown Fe(OH)3
          phenomenon = 'Tạo kết tủa màu nâu đỏ của Sắt(III) hiđrôxit Fe(OH)₃.';
        }

        setLiquidColor(color);
        setShowBubbles(gas);
        setShowPrecipitate(ppt);
        setPrecipitateColor(pptCol);
        if (gas || ppt) {
          playSound(gas ? 'fizz' : 'sizzle');
        }

        const resultObj = { equation: eqn, phenomenon, color, ppt, gas };
        setIonResult(resultObj);

        // Add to global simulation logs
        addLabSimulation({
          studentId: student?.id || 'HS001',
          type: 'chemistry',
          subType: 'ion_exchange',
          params: { tube1: selectedTube1, tube2: selectedTube2 },
          result: { summary: eqn, phenomenon }
        });

      }, 1000);
    }, 1000);
  };

  const handleClearIon = () => {
    setSelectedTube1(null);
    setSelectedTube2(null);
    setPouringState('idle');
    setIonResult(null);
    setLiquidColor('rgba(255,255,255,0.7)');
    setShowBubbles(false);
    setShowPrecipitate(false);
  };

  // ==========================================
  // 2. STATE & HANDLERS: METAL ACTIVITY SERIES
  // ==========================================
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [metalAnimState, setMetalAnimState] = useState('idle'); // idle, dipping, reacting, done
  const [metalResult, setMetalResult] = useState(null);
  const [tubeSolutionColor, setTubeSolutionColor] = useState('');
  const [coatedMetalColor, setCoatedMetalColor] = useState('');

  const metals = [
    { name: 'Mg', label: 'Magiê (Mg)', color: '#d1d5db', activeValue: 6 },
    { name: 'Al', label: 'Nhôm (Al)', color: '#cbd5e1', activeValue: 5 },
    { name: 'Zn', label: 'Kẽm (Zn)', color: '#94a3b8', activeValue: 4 },
    { name: 'Fe', label: 'Sắt (Fe)', color: '#4b5563', activeValue: 3 },
    { name: 'Cu', label: 'Đồng (Cu)', color: '#ea580c', activeValue: 2 },
    { name: 'Ag', label: 'Bạc (Ag)', color: '#f8fafc', activeValue: 1 }
  ];

  const solutions = [
    { name: 'CuSO4', label: 'Dung dịch CuSO₄', initColor: 'rgba(14, 165, 233, 0.75)', activeValue: 2, text: 'Cu²⁺' },
    { name: 'FeSO4', label: 'Dung dịch FeSO₄', initColor: 'rgba(52, 211, 153, 0.45)', activeValue: 3, text: 'Fe²⁺' },
    { name: 'AgNO3', label: 'Dung dịch AgNO₃', initColor: 'rgba(255, 255, 255, 0.25)', activeValue: 1, text: 'Ag⁺' },
    { name: 'ZnSO4', label: 'Dung dịch ZnSO₄', initColor: 'rgba(255, 255, 255, 0.1)', activeValue: 4, text: 'Zn²⁺' }
  ];

  const handleRunMetalSeries = () => {
    if (!selectedMetal || !selectedSolution) return;
    const metalData = metals.find(m => m.name === selectedMetal);
    const solData = solutions.find(s => s.name === selectedSolution);

    setMetalAnimState('dipping');
    setTubeSolutionColor(solData.initColor);
    setCoatedMetalColor('');
    playSound('pour');

    setTimeout(() => {
      setMetalAnimState('reacting');
      
      // Determine if reaction occurs: Metal activity must be strictly greater than Salt metal activity
      const isReactive = metalData.activeValue > solData.activeValue;
      let eqn = `${selectedMetal} + ${selectedSolution} → Không phản ứng`;
      let finalSolColor = solData.initColor;
      let coatColor = '';
      let bubbles = false;
      let phenomenon = 'Không xảy ra phản ứng vì kim loại kém hoạt động hơn cation trong dung dịch.';

      if (isReactive) {
        playSound('sizzle');
        if (selectedMetal === 'Mg') {
          coatColor = '#b45309'; // reddish copper or dark sponge
          bubbles = true;
          phenomenon = 'Phản ứng xảy ra mãnh liệt! Sủi nhiều bọt khí nhỏ, bề mặt thanh Magiê bị ăn mòn và giải phóng kim loại bám ngoài.';
          if (selectedSolution === 'CuSO4') {
            eqn = 'Mg + CuSO₄ → MgSO₄ + Cu↓';
            finalSolColor = 'rgba(255, 255, 255, 0.15)'; // fades to clear
          } else if (selectedSolution === 'AgNO3') {
            eqn = 'Mg + 2AgNO₃ → Mg(NO₃)₂ + 2Ag↓';
            coatColor = '#e2e8f0'; // silver coating
            finalSolColor = 'rgba(255,255,255,0.2)';
          } else if (selectedSolution === 'FeSO4') {
            eqn = 'Mg + FeSO₄ → MgSO₄ + Fe↓';
            coatColor = '#374151'; // dark iron
            finalSolColor = 'rgba(255,255,255,0.2)';
          } else if (selectedSolution === 'ZnSO4') {
            eqn = 'Mg + ZnSO₄ → MgSO₄ + Zn↓';
            coatColor = '#94a3b8';
            finalSolColor = 'rgba(255,255,255,0.2)';
          }
        } else if (selectedMetal === 'Zn') {
          coatColor = '#ea580c'; // copper color
          if (selectedSolution === 'CuSO4') {
            eqn = 'Zn + CuSO₄ → ZnSO₄ + Cu↓';
            finalSolColor = 'rgba(255, 255, 255, 0.2)'; // fades to clear
            phenomenon = 'Bề mặt thanh Kẽm bị sậm lại, phủ lớp kim loại Đồng màu đỏ cam. Màu xanh của dung dịch nhạt dần.';
          } else if (selectedSolution === 'AgNO3') {
            eqn = 'Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag↓';
            coatColor = '#cbd5e1'; // silver needle crystals
            finalSolColor = 'rgba(255,255,255,0.25)';
            phenomenon = 'Bạc bám kết tinh lấp lánh dạng kim trên thanh Kẽm.';
          } else if (selectedSolution === 'FeSO4') {
            eqn = 'Zn + FeSO₄ → ZnSO₄ + Fe↓';
            coatColor = '#4b5563';
            finalSolColor = 'rgba(255,255,255,0.2)';
            phenomenon = 'Một lớp Sắt xám đen bám chậm lên bề mặt thanh Kẽm.';
          }
        } else if (selectedMetal === 'Al') {
          coatColor = '#ea580c';
          if (selectedSolution === 'CuSO4') {
            eqn = '2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu↓';
            finalSolColor = 'rgba(255, 255, 255, 0.2)';
            phenomenon = 'Lớp oxit nhôm bảo vệ bị phá vỡ, Đồng bám đỏ và dung dịch mất màu xanh dần.';
          } else if (selectedSolution === 'AgNO3') {
            eqn = 'Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag↓';
            coatColor = '#e2e8f0';
            phenomenon = 'Kim loại bạc bám xốp màu trắng xám lên thanh Nhôm.';
          } else if (selectedSolution === 'FeSO4') {
            eqn = '2Al + 3FeSO₄ → Al₂(SO₄)₃ + 3Fe↓';
            coatColor = '#475569';
            phenomenon = 'Nhôm đẩy Sắt ra tạo kết tủa đen bám trên lá nhôm.';
          }
        } else if (selectedMetal === 'Fe') {
          if (selectedSolution === 'CuSO4') {
            eqn = 'Fe + CuSO₄ → FeSO₄ + Cu↓';
            coatColor = '#ea580c'; // copper coating
            finalSolColor = 'rgba(52, 211, 153, 0.4)'; // turns pale green
            phenomenon = 'Đinh sắt bị bám một lớp kim loại Đồng màu đỏ gạch rất rõ rệt. Dung dịch chuyển dần sang xanh lá cây nhạt.';
          } else if (selectedSolution === 'AgNO3') {
            eqn = 'Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag↓';
            coatColor = '#e2e8f0';
            finalSolColor = 'rgba(52, 211, 153, 0.2)';
            phenomenon = 'Kim loại Bạc trắng xám bám lên đinh sắt.';
          }
        } else if (selectedMetal === 'Cu') {
          if (selectedSolution === 'AgNO3') {
            eqn = 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓';
            coatColor = '#94a3b8'; // silver
            finalSolColor = 'rgba(14, 165, 233, 0.45)'; // solution turns blue
            phenomenon = 'Thanh đồng bị phủ một lớp tinh thể Bạc màu trắng xám. Dung dịch chuyển sang màu xanh dương nhạt của Cu²⁺.';
          }
        }
      }

      setTimeout(() => {
        setMetalAnimState('done');
        setTubeSolutionColor(finalSolColor);
        setCoatedMetalColor(coatColor);
        setMetalResult({ equation: eqn, phenomenon, isReactive, bubbles });

        addLabSimulation({
          studentId: student?.id || 'HS001',
          type: 'chemistry',
          subType: 'activity_series',
          params: { metal: selectedMetal, solution: selectedSolution },
          result: { summary: eqn, phenomenon }
        });
      }, 1000);
    }, 1200);
  };

  const handleClearMetal = () => {
    setSelectedMetal(null);
    setSelectedSolution(null);
    setMetalAnimState('idle');
    setMetalResult(null);
    setTubeSolutionColor('');
    setCoatedMetalColor('');
  };

  // ==========================================
  // 3. STATE & HANDLERS: pH INDICATOR
  // ==========================================
  const [selectedPhSolution, setSelectedPhSolution] = useState(null);
  const [selectedPhIndicator, setSelectedPhIndicator] = useState(null);
  const [phActive, setPhActive] = useState(false);
  const [phLiquidColor, setPhLiquidColor] = useState('rgba(255,255,255,0.7)');
  const [phPointerPos, setPhPointerPos] = useState(50); // percentage along the 0-14 bar
  const [phDetails, setPhDetails] = useState(null);

  const phSolutions = [
    { name: 'HCl', label: 'Axit Clohydric (HCl)', baseColor: 'rgba(255,255,255,0.6)', pH: 1, desc: 'Axit vô cơ mạnh' },
    { name: 'CH3COOH', label: 'Giấm ăn (CH₃COOH)', baseColor: 'rgba(255,255,255,0.6)', pH: 3, desc: 'Axit hữu cơ yếu' },
    { name: 'H2O', label: 'Nước cất (H₂O)', baseColor: 'rgba(255,255,255,0.6)', pH: 7, desc: 'Môi trường trung tính' },
    { name: 'Ca(OH)2', label: 'Nước vôi trong Ca(OH)₂', baseColor: 'rgba(255,255,255,0.6)', pH: 12, desc: 'Bazơ yếu ít tan' },
    { name: 'NaOH', label: 'Natri Hiđrôxit (NaOH)', baseColor: 'rgba(255,255,255,0.6)', pH: 13, desc: 'Kiềm (Bazơ mạnh)' }
  ];

  const phIndicators = [
    { name: 'litmus', label: 'Quỳ tím', desc: 'Chỉ thị màu axit/bazơ cơ bản' },
    { name: 'phenolphthalein', label: 'Phenolphthalein', desc: 'Chỉ thị phát hiện bazơ mạnh' },
    { name: 'methyl_orange', label: 'Methyl cam', desc: 'Chỉ thị dải axit pH thấp' }
  ];

  const handleRunPhTest = () => {
    if (!selectedPhSolution || !selectedPhIndicator) return;
    setPhActive(true);
    playSound('pour');

    const sol = phSolutions.find(s => s.name === selectedPhSolution);
    setTimeout(() => {
      setPhActive(false);
      
      // Determine final color based on pH and Indicator type
      let finalColor = 'rgba(255,255,255,0.7)';
      let indicatorText = '';

      if (selectedPhIndicator === 'litmus') {
        if (sol.pH < 7) {
          finalColor = 'rgba(239, 68, 68, 0.45)'; // Red
          indicatorText = 'Quỳ tím chuyển đỏ';
        } else if (sol.pH === 7) {
          finalColor = 'rgba(168, 85, 247, 0.3)'; // Violet
          indicatorText = 'Quỳ tím giữ nguyên màu tím';
        } else {
          finalColor = 'rgba(59, 130, 246, 0.45)'; // Blue
          indicatorText = 'Quỳ tím hóa xanh';
        }
      } else if (selectedPhIndicator === 'phenolphthalein') {
        if (sol.pH > 8.3) {
          finalColor = 'rgba(236, 72, 153, 0.65)'; // Intense Pink/Fuchsia
          indicatorText = 'Phenolphthalein chuyển sang màu hồng đậm';
        } else {
          finalColor = 'rgba(255,255,255,0.7)'; // Colorless
          indicatorText = 'Phenolphthalein giữ nguyên không màu';
        }
      } else if (selectedPhIndicator === 'methyl_orange') {
        if (sol.pH < 3.1) {
          finalColor = 'rgba(239, 68, 68, 0.55)'; // Red
          indicatorText = 'Methyl cam hóa đỏ';
        } else if (sol.pH >= 3.1 && sol.pH <= 4.4) {
          finalColor = 'rgba(249, 115, 22, 0.65)'; // Orange
          indicatorText = 'Methyl cam hóa cam';
        } else {
          finalColor = 'rgba(234, 179, 8, 0.6)'; // Yellow
          indicatorText = 'Methyl cam hóa vàng';
        }
      }

      setPhLiquidColor(finalColor);
      setPhPointerPos((sol.pH / 14) * 100);
      playSound('sizzle');

      setPhDetails({
        pH: sol.pH,
        desc: sol.desc,
        indicatorText,
        classification: sol.pH < 4 ? 'Axit mạnh' : sol.pH < 7 ? 'Axit yếu' : sol.pH === 7 ? 'Trung tính' : sol.pH < 12.5 ? 'Bazơ yếu' : 'Bazơ mạnh'
      });

      addLabSimulation({
        studentId: student?.id || 'HS001',
        type: 'chemistry',
        subType: 'ph_indicator',
        params: { solution: selectedPhSolution, indicator: selectedPhIndicator },
        result: { summary: `Đo pH của ${sol.label}: pH = ${sol.pH}`, phenomenon: indicatorText }
      });
    }, 1000);
  };

  const handleClearPh = () => {
    setSelectedPhSolution(null);
    setSelectedPhIndicator(null);
    setPhDetails(null);
    setPhLiquidColor('rgba(255,255,255,0.7)');
    setPhPointerPos(50);
  };

  // ==========================================
  // 4. STATE & HANDLERS: COMBUSTION
  // ==========================================
  const [combustible, setCombustible] = useState(null);
  const [combustionEnv, setCombustionEnv] = useState('air'); // air, oxygen
  const [burnState, setBurnState] = useState('idle'); // idle, burning, done
  const [combustionResult, setCombustionResult] = useState(null);

  const combustibles = [
    { name: 'C', label: 'Cacbon (C)', color: '#374151', text: 'Màu đen, cháy âm ỉ' },
    { name: 'Mg', label: 'Magiê (Mg)', color: '#cbd5e1', text: 'Dải bạc sáng, cháy chói' },
    { name: 'Fe', label: 'Bột Sắt (Fe)', color: '#4b5563', text: 'Hạt xám mịn, bắn tia lửa' },
    { name: 'Na', label: 'Natri (Na)', color: '#fef08a', text: 'Kim loại mềm, ngọn lửa vàng' }
  ];

  const handleRunCombustion = () => {
    if (!combustible) return;
    setBurnState('burning');
    playSound('fizz');

    setTimeout(() => {
      setBurnState('done');
      let eqn = '';
      let flameDesc = '';
      let productDesc = '';

      if (combustible === 'C') {
        eqn = 'C + O₂ → CO₂';
        flameDesc = combustionEnv === 'oxygen' 
          ? 'Cacbon cháy sáng chói rực rỡ, không khói, sinh nhiệt lượng lớn.' 
          : 'Cacbon cháy âm ỉ màu đỏ trong không khí.';
        productDesc = 'Khí Carbon dioxide (CO₂) không màu, không mùi được tạo thành.';
      } else if (combustible === 'Mg') {
        eqn = '2Mg + O₂ → 2MgO';
        flameDesc = combustionEnv === 'oxygen'
          ? 'Magiê cháy sáng chói lòa phát ra tia sáng trắng cực mạnh làm mờ cả camera.'
          : 'Magiê cháy mạnh tạo ra ánh sáng trắng rực rỡ.';
        productDesc = 'Sản phẩm tạo ra lớp bột màu trắng tinh của Magiê oxit (MgO).';
      } else if (combustible === 'Fe') {
        eqn = '3Fe + 2O₂ → Fe₃O₄';
        flameDesc = combustionEnv === 'oxygen'
          ? 'Bột sắt cháy dữ dội, các hạt sắt nóng chảy bắn ra xung quanh tạo thành chùm tia lửa màu cam rực rỡ tuyệt đẹp.'
          : 'Bột sắt cháy sáng đỏ yếu hơn, bắn ít tia lửa trong không khí.';
        productDesc = 'Tạo thành các hạt chất rắn màu đen của oxit sắt từ (Fe₃O₄).';
      } else if (combustible === 'Na') {
        eqn = '2Na + O₂ → Na₂O₂';
        flameDesc = combustionEnv === 'oxygen'
          ? 'Natri nóng chảy chảy loãng rồi bùng cháy dữ dội tạo ngọn lửa màu vàng chói lọi đặc trưng.'
          : 'Natri cháy với ngọn lửa màu vàng nhạt trong không khí.';
        productDesc = 'Tạo thành sản phẩm dạng bột màu vàng nhạt Natri peroxit (Na₂O₂).';
      }

      setCombustionResult({ equation: eqn, flameDesc, productDesc });

      addLabSimulation({
        studentId: student?.id || 'HS001',
        type: 'chemistry',
        subType: 'combustion',
        params: { substance: combustible, environment: combustionEnv },
        result: { summary: eqn, phenomenon: flameDesc }
      });
    }, 2000);
  };

  const handleClearCombustion = () => {
    setCombustible(null);
    setBurnState('idle');
    setCombustionResult(null);
  };

  // ==========================================
  // 5. STATE & HANDLERS: ELECTROLYSIS
  // ==========================================
  const [elecSolution, setElecSolution] = useState(null);
  const [powerOn, setPowerOn] = useState(false);
  const [elecDetails, setElecDetails] = useState(null);
  const [anodeBubbles, setAnodeBubbles] = useState([]);
  const [cathodeBubbles, setCathodeBubbles] = useState([]);
  const [cuDepositThickness, setCuDepositThickness] = useState(0);
  const [fadePercentage, setFadePercentage] = useState(0);

  const elecSolutions = [
    { name: 'NaCl', label: 'Dung dịch NaCl (có màng ngăn)', initColor: 'rgba(255, 255, 255, 0.2)' },
    { name: 'CuSO4', label: 'Dung dịch CuSO₄ (Điện cực trơ)', initColor: 'rgba(14, 165, 233, 0.7)' },
    { name: 'NaOH', label: 'Dung dịch NaOH', initColor: 'rgba(255, 255, 255, 0.15)' }
  ];

  // Simulation loop for electrolysis bubbles
  useEffect(() => {
    if (!powerOn || !elecSolution) return undefined;

    playSound('fizz');
    let interval;
    interval = setInterval(() => {
      // Generate random bubble coordinates
      const newAnode = Array.from({ length: 5 }, () => ({
        x: 40 + Math.random() * 20,
        y: 70 + Math.random() * 50,
        r: 1.5 + Math.random() * 2,
        speed: 1 + Math.random() * 1.5
      }));
      const newCathode = Array.from({ length: 5 }, () => ({
        x: 100 + Math.random() * 20,
        y: 70 + Math.random() * 50,
        r: 1.5 + Math.random() * 2,
        speed: 1 + Math.random() * 1.5
      }));
      setAnodeBubbles(newAnode);
      setCathodeBubbles(newCathode);

      if (elecSolution === 'CuSO4') {
        setCuDepositThickness(prev => Math.min(6, prev + 0.1));
        setFadePercentage(prev => Math.min(100, prev + 2));
      }
    }, 300);

    return () => clearInterval(interval);
  }, [powerOn, elecSolution]);

  const handleTogglePower = () => {
    if (!elecSolution) return;
    const isNextOn = !powerOn;
    setPowerOn(isNextOn);
    if (!isNextOn) {
      setAnodeBubbles([]);
      setCathodeBubbles([]);
    }

    if (isNextOn) {
      let anodeHalf = '';
      let cathodeHalf = '';
      let fullEqn = '';
      let explanation = '';

      if (elecSolution === 'NaCl') {
        anodeHalf = '2Cl⁻ → Cl₂↑ + 2e⁻';
        cathodeHalf = '2H₂O + 2e⁻ → H₂↑ + 2OH⁻';
        fullEqn = '2NaCl + 2H₂O ⎯⎯(đpmn)⎯→ H₂↑ + Cl₂↑ + 2NaOH';
        explanation = 'Tại Anot (+): Các ion Cl⁻ bị oxy hóa sinh ra khí Clo màu vàng lục độc hại. Tại Catot (-): Nước bị khử sinh ra khí Hydro và tích tụ kiềm NaOH làm dung dịch chuyển sang môi trường bazơ.';
      } else if (elecSolution === 'CuSO4') {
        anodeHalf = '2H₂O → O₂↑ + 4H⁺ + 4e⁻';
        cathodeHalf = 'Cu²⁺ + 2e⁻ → Cu↓';
        fullEqn = '2CuSO₄ + 2H₂O ⎯⎯(đpcđ)⎯→ 2Cu↓ + O₂↑ + 2H₂SO₄';
        explanation = 'Tại Anot (+): Nước bị oxy hóa tạo ra khí Oxy thoát ra dạng bọt khí. Tại Catot (-): Các ion Cu²⁺ bị khử tạo thành kim loại Đồng bám một lớp màu đỏ gạch bên ngoài điện cực. Dung dịch nhạt dần màu xanh dương.';
      } else if (elecSolution === 'NaOH') {
        anodeHalf = '4OH⁻ → O₂↑ + 2H₂O + 4e⁻';
        cathodeHalf = '2H₂O + 2e⁻ → H₂↑ + 2OH⁻';
        fullEqn = '2H₂O ⎯⎯(đp)⎯→ 2H₂↑ + O₂↑';
        explanation = 'Thực chất đây là quá trình điện phân nước. Anot tạo khí Oxy, Catot giải phóng khí Hydro gấp đôi thể tích. Nồng độ dung dịch NaOH tăng dần.';
      }

      setElecDetails({ anodeHalf, cathodeHalf, fullEqn, explanation });

      addLabSimulation({
        studentId: student?.id || 'HS001',
        type: 'chemistry',
        subType: 'electrolysis',
        params: { solution: elecSolution },
        result: { summary: fullEqn, phenomenon: explanation }
      });
    }
  };

  const handleClearElectrolysis = () => {
    setPowerOn(false);
    setElecSolution(null);
    setElecDetails(null);
    setCuDepositThickness(0);
    setFadePercentage(0);
  };

  // Get simulations matching this student and filter by chemistry
  const mySimulations = labSimulations?.filter(sim => sim.studentId === student?.id && sim.type === 'chemistry') || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
      <div>
        {/* Lab Navigation Sub-tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'ion_exchange', label: 'Trao đổi ion', icon: <Beaker size={15} /> },
            { id: 'activity_series', label: 'Dãy kim loại', icon: <Zap size={15} /> },
            { id: 'ph_indicator', label: 'Chỉ thị pH', icon: <Droplets size={15} /> },
            { id: 'combustion', label: 'Đốt cháy', icon: <Flame size={15} /> },
            { id: 'electrolysis', label: 'Điện phân', icon: <Zap size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setReactionActive(false);
              }}
              className={`btn ${activeSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '8px 16px' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. ION EXCHANGE TAB */}
        {activeSubTab === 'ion_exchange' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Beaker size={18} /> Phản ứng trao đổi ion trong dung dịch
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Selected Slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>CHẤT 1:</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedTube1 ? 'rgba(99,102,241,0.08)' : '#f1f5f9', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                      <span style={{ color: selectedTube1 ? 'var(--accent-primary)' : '#94a3b8' }}>{selectedTube1 || 'Chọn ống'}</span>
                      {selectedTube1 && <button onClick={() => setSelectedTube1(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>X</button>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>CHẤT 2:</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedTube2 ? 'rgba(16,185,129,0.08)' : '#f1f5f9', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                      <span style={{ color: selectedTube2 ? '#10b981' : '#94a3b8' }}>{selectedTube2 || 'Chọn ống'}</span>
                      {selectedTube2 && <button onClick={() => setSelectedTube2(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>X</button>}
                    </div>
                  </div>
                </div>

                {/* Rack */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {ionTubes.map(tube => {
                    const isSelected = selectedTube1 === tube.name || selectedTube2 === tube.name;
                    return (
                      <div 
                        key={tube.name}
                        onClick={() => handleSelectIonTube(tube.name)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                          transform: isSelected ? 'translateY(-6px)' : 'none', transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '24px', height: '80px', border: `2px solid ${isSelected ? 'var(--accent-primary)' : '#64748b'}`,
                          borderRadius: '0 0 12px 12px', background: 'rgba(255,255,255,0.2)', position: 'relative', overflow: 'hidden'
                        }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', background: tube.color }}></div>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '4px', color: isSelected ? 'var(--accent-primary)' : '#475569' }}>{tube.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={handleRunIonExchange}
                    disabled={reactionActive || !selectedTube1 || !selectedTube2}
                    className="btn btn-primary"
                    style={{ flex: 1, height: 40, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                  >
                    {reactionActive ? 'Đang phản ứng...' : 'Tiến hành phản ứng'}
                  </button>
                  <button onClick={handleClearIon} className="btn btn-secondary" style={{ height: 40 }}>Làm sạch</button>
                </div>

                {ionResult && !reactionActive && (
                  <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phương trình:</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#065f46', background: '#fff', padding: '6px 12px', borderRadius: 6, margin: '4px 0 8px 0', border: '1px solid rgba(0,0,0,0.05)' }}>{ionResult.equation}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong>Hiện tượng:</strong> {ionResult.phenomenon}</div>
                  </div>
                )}
              </div>

              {/* Graphics Beaker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 20, position: 'relative' }}>
                <div style={{ position: 'relative', width: 140, height: 180 }}>
                  
                  {/* Pouring tube 1 */}
                  {pouringState === 'pouring1' && (
                    <div style={{
                      position: 'absolute', top: 5, left: -25, width: '16px', height: '50px', border: '2px solid #64748b',
                      borderRadius: '0 0 8px 8px', background: 'rgba(255,255,255,0.2)', transform: 'rotate(-60deg)', transformOrigin: 'top right', zIndex: 10
                    }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', background: ionTubes.find(t=>t.name===selectedTube1)?.color }} />
                      <div style={{ position: 'absolute', top: '100%', right: '2px', width: '3px', height: '45px', background: ionTubes.find(t=>t.name===selectedTube1)?.color, transform: 'rotate(60deg)', transformOrigin: 'top right', animation: 'streamFlow 0.5s infinite linear' }} />
                    </div>
                  )}

                  {/* Pouring tube 2 */}
                  {pouringState === 'pouring2' && (
                    <div style={{
                      position: 'absolute', top: 5, right: -25, width: '16px', height: '50px', border: '2px solid #64748b',
                      borderRadius: '0 0 8px 8px', background: 'rgba(255,255,255,0.2)', transform: 'rotate(60deg)', transformOrigin: 'top left', zIndex: 10
                    }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', background: ionTubes.find(t=>t.name===selectedTube2)?.color }} />
                      <div style={{ position: 'absolute', top: '100%', left: '2px', width: '3px', height: '45px', background: ionTubes.find(t=>t.name===selectedTube2)?.color, transform: 'rotate(-60deg)', transformOrigin: 'top left', animation: 'streamFlow 0.5s infinite linear' }} />
                    </div>
                  )}

                  {/* Beaker Body */}
                  <div style={{
                    width: 120, height: 140, border: '4px solid #475569', borderTop: 'none', borderRadius: '0 0 16px 16px',
                    position: 'absolute', bottom: 10, left: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.1)'
                  }}>
                    {/* Lips */}
                    <div style={{ position: 'absolute', top: 0, left: -4, width: 8, height: 4, background: '#475569', borderRadius: 4 }}></div>
                    <div style={{ position: 'absolute', top: 0, right: -4, width: 8, height: 4, background: '#475569', borderRadius: 4 }}></div>

                    {/* Liquid fill */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, width: '100%',
                      height: reactionActive ? '45%' : pouringState === 'completed' ? '70%' : pouringState === 'pouring1' ? '30%' : '10%',
                      background: liquidColor, transition: 'all 1.0s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {/* Bubbles animation */}
                      {showBubbles && (
                        <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
                          {BUBBLES_DATA.map((bubble, i) => (
                            <span 
                              key={i} 
                              style={{
                                position: 'absolute', bottom: 0, left: bubble.left, width: bubble.size, height: bubble.size,
                                background: 'rgba(255,255,255,0.8)', borderRadius: '50%', animationDelay: bubble.delay,
                                animation: `gasRise ${bubble.duration} infinite linear`
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Precipitate layer */}
                      {showPrecipitate && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30%',
                          background: precipitateColor, borderRadius: '0 0 12px 12px', borderTop: '2px solid rgba(255,255,255,0.4)',
                          animation: 'pulse 1.8s infinite'
                        }}></div>
                      )}
                    </div>

                    {/* Vortex mixer */}
                    {reactionActive && (
                      <div style={{
                        position: 'absolute', top: '30%', left: '42%', width: 14, height: 50,
                        border: '2px dashed #64748b', borderTop: 'none', borderBottom: 'none', borderRadius: '50%',
                        animation: 'spin 0.4s infinite linear'
                      }}></div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cốc phản ứng</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. METAL ACTIVITY SERIES */}
        {activeSubTab === 'activity_series' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} /> Khảo sát Dãy hoạt động hóa học của Kim loại
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Metals list */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>1. CHỌN THANH KIM LOẠI:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 6 }}>
                    {metals.map(metal => (
                      <button
                        key={metal.name}
                        onClick={() => setSelectedMetal(metal.name)}
                        className={`btn ${selectedMetal === metal.name ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '8px 4px', background: selectedMetal === metal.name ? 'var(--accent-primary)' : '#fff', color: selectedMetal === metal.name ? '#fff' : '#1e293b', border: '1px solid #cbd5e1' }}
                      >
                        {metal.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salt solutions list */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>2. CHỌN DUNG DỊCH MUỐI:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {solutions.map(sol => (
                      <button
                        key={sol.name}
                        onClick={() => setSelectedSolution(sol.name)}
                        className={`btn ${selectedSolution === sol.name ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '10px 8px', background: selectedSolution === sol.name ? '#10b981' : '#fff', color: selectedSolution === sol.name ? '#fff' : '#1e293b', border: '1px solid #cbd5e1' }}
                      >
                        {sol.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button 
                    onClick={handleRunMetalSeries}
                    disabled={!selectedMetal || !selectedSolution || metalAnimState === 'dipping' || metalAnimState === 'reacting'}
                    className="btn btn-primary"
                    style={{ flex: 1, height: 40, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none' }}
                  >
                    Nhúng thanh kim loại
                  </button>
                  <button onClick={handleClearMetal} className="btn btn-secondary" style={{ height: 40 }}>Làm sạch</button>
                </div>

                {metalResult && (
                  <div style={{ padding: 12, background: metalResult.isReactive ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${metalResult.isReactive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, borderRadius: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phương trình:</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.92rem', color: metalResult.isReactive ? '#065f46' : '#991b1b', background: '#fff', padding: '6px 12px', borderRadius: 6, margin: '4px 0 8px 0', border: '1px solid rgba(0,0,0,0.05)' }}>{metalResult.equation}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong>Hiện tượng:</strong> {metalResult.phenomenon}</div>
                  </div>
                )}
              </div>

              {/* Graphics Test Tube */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 20 }}>
                <div style={{ position: 'relative', width: 100, height: 200 }}>
                  {/* Test tube outline */}
                  <div style={{
                    position: 'absolute', bottom: 10, left: 30, width: 40, height: 160, border: '3.5px solid #475569',
                    borderRadius: '0 0 20px 20px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)'
                  }}>
                    {/* Solution fill */}
                    {selectedSolution && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '65%',
                        background: tubeSolutionColor || solutions.find(s=>s.name===selectedSolution)?.initColor,
                        transition: 'background 1.2s ease-in-out'
                      }}>
                        {/* Bubbles if reactive */}
                        {metalResult?.bubbles && metalAnimState === 'done' && (
                          <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
                            {BUBBLES_DATA.slice(0, 4).map((bubble, i) => (
                              <span 
                                key={i} 
                                style={{
                                  position: 'absolute', bottom: 0, left: bubble.left, width: 2, height: 2,
                                  background: 'rgba(255,255,255,0.8)', borderRadius: '50%', animationDelay: bubble.delay,
                                  animation: `gasRise ${bubble.duration} infinite linear`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metal Strip */}
                  {selectedMetal && (
                    <div style={{
                      position: 'absolute',
                      left: 42,
                      width: 16,
                      height: 100,
                      background: metals.find(m=>m.name===selectedMetal)?.color,
                      border: '1.5px solid #334155',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      borderRadius: '2px 2px 0 0',
                      // Dipping translation
                      transform: (metalAnimState === 'dipping' || metalAnimState === 'reacting' || metalAnimState === 'done') ? 'translateY(80px)' : 'translateY(10px)',
                      transition: 'transform 1.0s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      zIndex: 5
                    }}>
                      {/* Reactant coating layer */}
                      {coatedMetalColor && metalAnimState === 'done' && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%',
                          background: coatedMetalColor, transition: 'background 0.5s', opacity: 0.95
                        }} />
                      )}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8 }}>Ống nghiệm khảo sát</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. pH INDICATOR & ACID-BASE */}
        {activeSubTab === 'ph_indicator' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplets size={18} /> Thử nghiệm Chỉ thị màu & Đo nồng độ pH
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Solutions select cards */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>1. CHỌN DUNG DỊCH ĐO:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {phSolutions.map(sol => (
                      <div
                        key={sol.name}
                        onClick={() => setSelectedPhSolution(sol.name)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10,
                          border: `1.5px solid ${selectedPhSolution === sol.name ? 'var(--accent-primary)' : 'rgba(0,0,0,0.06)'}`,
                          background: selectedPhSolution === sol.name ? 'rgba(99, 102, 241, 0.06)' : '#fff', cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{sol.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sol.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicators grid */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>2. CHỌN CHẤT CHÌ THỊ MÀU:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
                    {phIndicators.map(ind => (
                      <button
                        key={ind.name}
                        onClick={() => setSelectedPhIndicator(ind.name)}
                        className={`btn ${selectedPhIndicator === ind.name ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '10px 4px', background: selectedPhIndicator === ind.name ? 'var(--accent-secondary)' : '#fff', color: selectedPhIndicator === ind.name ? '#fff' : '#1e293b', border: '1px solid #cbd5e1' }}
                        title={ind.desc}
                      >
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={handleRunPhTest}
                    disabled={!selectedPhSolution || !selectedPhIndicator || phActive}
                    className="btn btn-primary"
                    style={{ flex: 1, height: 40, background: 'linear-gradient(135deg, #a855f7, #7e22ce)', border: 'none' }}
                  >
                    Nhỏ chỉ thị & Đo pH
                  </button>
                  <button onClick={handleClearPh} className="btn btn-secondary" style={{ height: 40 }}>Làm sạch</button>
                </div>
              </div>

              {/* Graphics Beaker & pH bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 20 }}>
                {/* Color changing beaker */}
                <div style={{ position: 'relative', width: 100, height: 110, marginBottom: 15 }}>
                  <div style={{
                    width: 80, height: 90, border: '3.5px solid #475569', borderTop: 'none',
                    borderRadius: '0 0 12px 12px', position: 'absolute', bottom: 10, left: 10,
                    overflow: 'hidden', background: 'rgba(255,255,255,0.1)'
                  }}>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, width: '100%',
                      height: selectedPhSolution ? '65%' : '10%',
                      background: phLiquidColor, transition: 'background 0.8s ease-in-out'
                    }}></div>
                  </div>
                </div>

                {/* pH scale bar */}
                <div style={{ width: '100%', marginTop: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Axit (0)</span>
                    <span>Trung tính (7)</span>
                    <span>Bazơ (14)</span>
                  </div>
                  
                  {/* Color bar */}
                  <div style={{
                    position: 'relative', width: '100%', height: 12, borderRadius: 6,
                    background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #a855f7)'
                  }}>
                    {/* Animated Pointer */}
                    {phDetails && (
                      <div style={{
                        position: 'absolute',
                        bottom: 14,
                        left: `${phPointerPos}%`,
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'left 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#1e293b', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>pH {phDetails.pH}</span>
                        <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1e293b' }}></div>
                      </div>
                    )}
                  </div>
                </div>

                {phDetails && (
                  <div style={{ width: '100%', marginTop: 16, background: '#fff', border: '1px solid rgba(0,0,0,0.05)', padding: 10, borderRadius: 10, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Chỉ số pH:</strong> <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{phDetails.pH} ({phDetails.classification})</span></div>
                    <div style={{ marginTop: 4 }}><strong>Kết quả màu:</strong> {phDetails.indicatorText}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. COMBUSTION EXPERIMENT */}
        {activeSubTab === 'combustion' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={18} /> Phản ứng Đốt cháy & Oxi hóa ở nhiệt độ cao
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Select combustible */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>1. CHỌN CHẤT ĐỐT CHÁY:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {combustibles.map(item => (
                      <button
                        key={item.name}
                        onClick={() => setCombustible(item.name)}
                        className={`btn ${combustible === item.name ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '10px 8px', background: combustible === item.name ? 'var(--accent-secondary)' : '#fff', color: combustible === item.name ? '#fff' : '#1e293b', border: '1px solid #cbd5e1' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select environment */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>2. MÔI TRƯỜNG CHỨA KHÍ:</span>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input type="radio" name="env" checked={combustionEnv === 'air'} onChange={() => setCombustionEnv('air')} />
                      Không khí thường
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input type="radio" name="env" checked={combustionEnv === 'oxygen'} onChange={() => setCombustionEnv('oxygen')} />
                      Khí Oxi tinh khiết (O₂)
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={handleRunCombustion}
                    disabled={!combustible || burnState === 'burning'}
                    className="btn btn-primary"
                    style={{ flex: 1, height: 40, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}
                  >
                    {burnState === 'burning' ? 'Đang đốt...' : 'Châm lửa đốt'}
                  </button>
                  <button onClick={handleClearCombustion} className="btn btn-secondary" style={{ height: 40 }}>Làm sạch</button>
                </div>
              </div>

              {/* Graphics Combustion */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 16, padding: 20, minHeight: 200 }}>
                <div style={{ position: 'relative', width: 140, height: 130 }}>
                  {/* Jar Outline */}
                  <div style={{
                    position: 'absolute', top: 0, left: 30, width: 80, height: 110,
                    border: '3px solid #64748b', borderRadius: '8px 8px 0 0', borderBottom: 'none',
                    background: combustionEnv === 'oxygen' ? 'rgba(14, 165, 233, 0.05)' : 'rgba(255,255,255,0.02)'
                  }}>
                    {combustionEnv === 'oxygen' && (
                      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.62rem', background: '#0ea5e9', color: '#fff', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>BÌNH OXY</div>
                    )}
                  </div>
                  
                  {/* Stand / Crucible base */}
                  <div style={{ position: 'absolute', bottom: 10, left: 20, width: 100, height: 10, background: '#475569', borderRadius: 3 }}></div>
                  <div style={{ position: 'absolute', bottom: 20, left: 55, width: 30, height: 8, background: '#94a3b8', borderRadius: '15px 15px 0 0' }}></div>

                  {/* Combustible lump */}
                  {combustible && burnState !== 'done' && (
                    <div style={{
                      position: 'absolute', bottom: 28, left: 63, width: 14, height: 10,
                      background: combustibles.find(c=>c.name===combustible)?.color,
                      borderRadius: '50% 50% 2px 2px', border: '1px solid #1e293b'
                    }}></div>
                  )}

                  {/* Flame effect */}
                  {burnState === 'burning' && (
                    <div className="burning-flame" style={{
                      position: 'absolute', bottom: 26, left: 50, width: 40, height: 50,
                      background: combustible === 'C' ? 'radial-gradient(circle, rgba(59,130,246,0.9) 0%, transparent 70%)' :
                                  combustible === 'Mg' ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(243,244,246,0.7) 40%, transparent 80%)' :
                                  combustible === 'Fe' ? 'radial-gradient(circle, rgba(249,115,22,0.9) 0%, transparent 60%)' :
                                  'radial-gradient(circle, rgba(234,179,8,1) 0%, rgba(249,115,22,0.7) 50%, transparent 80%)',
                      filter: combustible === 'Mg' ? 'drop-shadow(0 0 15px #fff)' : 'none',
                      animation: 'pulse 0.2s infinite alternate'
                    }}>
                      {/* Sparks for Fe */}
                      {combustible === 'Fe' && (
                        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                          <span style={{ position: 'absolute', top: 5, left: 10, width: 2, height: 2, background: '#fbbf24', borderRadius: '50%' }} />
                          <span style={{ position: 'absolute', top: 12, right: 8, width: 2, height: 2, background: '#f59e0b', borderRadius: '50%' }} />
                          <span style={{ position: 'absolute', top: 2, right: 12, width: 1.5, height: 1.5, background: '#fff', borderRadius: '50%' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Burned residue */}
                  {burnState === 'done' && (
                    <div style={{
                      position: 'absolute', bottom: 28, left: 60, width: 20, height: 6,
                      background: combustible === 'Mg' ? '#f1f5f9' : combustible === 'Fe' ? '#374151' : '#1e293b',
                      borderRadius: '5px', border: '1px solid #64748b'
                    }}></div>
                  )}
                </div>

                {combustionResult && burnState === 'done' && (
                  <div style={{ width: '100%', marginTop: 10, background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10, fontSize: '0.78rem', color: '#e2e8f0' }}>
                    <div style={{ fontFamily: 'monospace', color: '#34d399', fontWeight: 700, marginBottom: 4 }}>{combustionResult.equation}</div>
                    <div><strong>Ánh lửa:</strong> {combustionResult.flameDesc}</div>
                    <div style={{ marginTop: 4 }}><strong>Sản phẩm:</strong> {combustionResult.productDesc}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. ELECTROLYSIS EXPERIMENT */}
        {activeSubTab === 'electrolysis' && (
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} /> Mô phỏng Điện phân dung dịch Chất điện ly
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Select Solution */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CHỌN DUNG DỊCH ĐIỆN PHÂN:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {elecSolutions.map(sol => (
                      <div
                        key={sol.name}
                        onClick={() => {
                          if (!powerOn) setElecSolution(sol.name);
                        }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10,
                          border: `1.5px solid ${elecSolution === sol.name ? '#f59e0b' : 'rgba(0,0,0,0.06)'}`,
                          background: elecSolution === sol.name ? 'rgba(245, 158, 11, 0.05)' : '#fff',
                          cursor: powerOn ? 'not-allowed' : 'pointer', opacity: powerOn && elecSolution !== sol.name ? 0.5 : 1
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{sol.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={handleTogglePower}
                    disabled={!elecSolution}
                    className={`btn ${powerOn ? 'btn-danger' : 'btn-primary'}`}
                    style={{ flex: 1, height: 40, background: powerOn ? '#ef4444' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff' }}
                  >
                    {powerOn ? 'Tắt nguồn điện' : 'Bật nguồn điện (DC)'}
                  </button>
                  <button onClick={handleClearElectrolysis} disabled={powerOn} className="btn btn-secondary" style={{ height: 40 }}>Làm sạch</button>
                </div>

                {elecDetails && (
                  <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#b45309', background: '#fff', padding: '6px 12px', borderRadius: 6, margin: '2px 0 8px 0', border: '1px solid rgba(0,0,0,0.05)' }}>{elecDetails.fullEqn}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div><strong>Anot (+):</strong> {elecDetails.anodeHalf}</div>
                      <div><strong>Catot (-):</strong> {elecDetails.cathodeHalf}</div>
                    </div>
                    <div>{elecDetails.explanation}</div>
                  </div>
                )}
              </div>

              {/* Graphics Electrolysis tank */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 16, padding: 20 }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  
                  {/* Battery/Power Source representation */}
                  <div style={{ position: 'absolute', top: 5, left: 55, width: 50, height: 20, border: '2px solid #94a3b8', borderRadius: 4, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: powerOn ? '#4ade80' : '#f87171' }}>{powerOn ? '12V ON' : 'OFF'}</span>
                  </div>

                  {/* Wire line path */}
                  <svg style={{ position: 'absolute', top: 20, left: 0, width: '100%', height: 40, pointerEvents: 'none' }}>
                    <path d="M 45 40 L 45 5 M 55 5 L 75 5 M 85 5 L 115 5 L 115 40" fill="none" stroke={powerOn ? '#eab308' : '#475569'} strokeWidth="2" />
                  </svg>

                  {/* Electrolysis Tank */}
                  <div style={{
                    position: 'absolute', bottom: 5, left: 10, width: 140, height: 100,
                    border: '4.5px solid #64748b', borderRadius: '0 0 16px 16px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)'
                  }}>
                    {/* Solution level inside */}
                    {elecSolution && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80%',
                        // Dynamically fade blue color for CuSO4
                        background: elecSolution === 'CuSO4' 
                          ? `rgba(14, 165, 233, ${Math.max(0.15, 0.75 - fadePercentage/150)})` 
                          : elecSolutions.find(s=>s.name===elecSolution)?.initColor,
                        transition: 'background 0.5s'
                      }}></div>
                    )}

                    {/* Electrodes */}
                    {/* Anode + */}
                    <div style={{ position: 'absolute', bottom: 10, left: 30, width: 12, height: 80, background: '#374151', border: '1px solid #1e293b' }} title="Anot (+)">
                      <div style={{ position: 'absolute', top: 2, left: 2, fontSize: '0.5rem', color: '#fff', fontWeight: 800 }}>A</div>
                    </div>
                    {/* Cathode - */}
                    <div style={{ position: 'absolute', bottom: 10, left: 98, width: 12, height: 80, background: '#94a3b8', border: '1px solid #334155' }} title="Catot (-)">
                      <div style={{ position: 'absolute', top: 2, left: 2, fontSize: '0.5rem', color: '#1e293b', fontWeight: 800 }}>C</div>
                      {/* Cu coating */}
                      {elecSolution === 'CuSO4' && cuDepositThickness > 0 && (
                        <div style={{ position: 'absolute', top: 0, left: -2, width: 16, height: 80, border: `${cuDepositThickness}px solid #ea580c`, borderRadius: 1 }} />
                      )}
                    </div>

                    {/* Bubble streams */}
                    {powerOn && (
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {anodeBubbles.map((b, i) => (
                          <circle key={`a-${i}`} cx={b.x} cy={b.y} r={b.r} fill={elecSolution === 'NaCl' ? '#86efac' : '#fff'} opacity="0.7" />
                        ))}
                        {cathodeBubbles.map((b, i) => (
                          <circle key={`c-${i}`} cx={b.x} cy={b.y} r={b.r} fill="#fff" opacity="0.8" />
                        ))}
                      </svg>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Bể điện phân</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT HISTORY SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(255,255,255,0.6)', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} /> Nhật ký thí nghiệm Hóa
          </h4>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420 }}>
            {mySimulations.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px 10px' }}>
                Chưa có thí nghiệm hóa học nào được lưu.
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
                    <span style={{ color: 'var(--accent-secondary)' }}>
                      {sim.subType === 'ion_exchange' ? 'Trao đổi ion' :
                       sim.subType === 'activity_series' ? 'Dãy kim loại' :
                       sim.subType === 'ph_indicator' ? 'Chỉ thị pH' :
                       sim.subType === 'combustion' ? 'Phản ứng cháy' : 'Điện phân'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{sim.date}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
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

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gasRise {
          0% { bottom: 0; opacity: 1; transform: scale(0.8); }
          100% { bottom: 90%; opacity: 0; transform: scale(1.3); }
        }
        @keyframes streamFlow {
          0% { height: 0; opacity: 0.3; }
          50% { height: 45px; opacity: 0.9; }
          100% { height: 45px; opacity: 0.9; }
        }
      `}} />
    </div>
  );
}
