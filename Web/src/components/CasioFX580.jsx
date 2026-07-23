import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  HelpCircle,
  History,
  RotateCcw,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Cpu,
  Layers,
  ArrowRightLeft,
  FileText,
  Sliders,
  Maximize,
  Grid,
  Database
} from 'lucide-react';

// Physical constants (40 constants)
const PHYSICAL_CONSTANTS = [
  { id: 'c0', symbol: 'c₀', name: 'Tốc độ ánh sáng chân không', val: 299792458, unit: 'm/s' },
  { id: 'h', symbol: 'h', name: 'Hằng số Planck', val: 6.62607015e-34, unit: 'J·s' },
  { id: 'hbar', symbol: 'ℏ', name: 'Hằng số Planck thu gọn', val: 1.054571817e-34, unit: 'J·s' },
  { id: 'e', symbol: 'e', name: 'Điện tích nguyên tố', val: 1.602176634e-19, unit: 'C' },
  { id: 'G', symbol: 'G', name: 'Hằng số hấp dẫn', val: 6.67430e-11, unit: 'm³/(kg·s²)' },
  { id: 'me', symbol: 'mₑ', name: 'Khối lượng Electron', val: 9.1093837015e-31, unit: 'kg' },
  { id: 'mp', symbol: 'mₚ', name: 'Khối lượng Proton', val: 1.67262192369e-27, unit: 'kg' },
  { id: 'mn', symbol: 'mₙ', name: 'Khối lượng Neutron', val: 1.67492749804e-27, unit: 'kg' },
  { id: 'u', symbol: 'u', name: 'Đơn vị khối lượng nguyên tử', val: 1.6605390666e-27, unit: 'kg' },
  { id: 'NA', symbol: 'N₇', name: 'Hằng số Avogadro', val: 6.02214076e23, unit: 'mol⁻¹' },
  { id: 'kB', symbol: 'k', name: 'Hằng số Boltzmann', val: 1.380649e-23, unit: 'J/K' },
  { id: 'R', symbol: 'R', name: 'Hằng số khí lý tưởng', val: 8.314462618, unit: 'J/(mol·K)' },
  { id: 'eps0', symbol: 'ε₀', name: 'Hằng số điện', val: 8.8541878128e-12, unit: 'F/m' },
  { id: 'mu0', symbol: 'μ₀', name: 'Hằng số từ', val: 1.25663706212e-6, unit: 'N/A²' },
  { id: 'F', symbol: 'F', name: 'Hằng số Faraday', val: 96485.33212, unit: 'C/mol' },
  { id: 'sigma', symbol: 'σ', name: 'Hằng số Stefan-Boltzmann', val: 5.670374419e-8, unit: 'W/(m²·K⁴)' },
  { id: 'g', symbol: 'g', name: 'Gia tốc trọng trường chuẩn', val: 9.80665, unit: 'm/s²' },
  { id: 'atm', symbol: '1atm', name: 'Áp suất khí quyển chuẩn', val: 101325, unit: 'Pa' },
  { id: 'a0', symbol: 'a₀', name: 'Bán kính Bohr', val: 5.29177210903e-11, unit: 'm' },
  { id: 'muB', symbol: 'μ₈', name: 'Bohr magneton', val: 9.2740100783e-24, unit: 'J/T' },
];

// Unit conversions
const UNIT_CONVERSIONS = [
  { group: 'Chiều dài', from: 'in', to: 'cm', ratio: 2.54 },
  { group: 'Chiều dài', from: 'ft', to: 'm', ratio: 0.3048 },
  { group: 'Chiều dài', from: 'yd', to: 'm', ratio: 0.9144 },
  { group: 'Chiều dài', from: 'mile', to: 'km', ratio: 1.609344 },
  { group: 'Vận tốc', from: 'km/h', to: 'm/s', ratio: 1 / 3.6 },
  { group: 'Vận tốc', from: 'knot', to: 'km/h', ratio: 1.852 },
  { group: 'Khối lượng', from: 'lb', to: 'kg', ratio: 0.45359237 },
  { group: 'Khối lượng', from: 'oz', to: 'g', ratio: 28.349523125 },
  { group: 'Áp suất', from: 'atm', to: 'kPa', ratio: 101.325 },
  { group: 'Áp suất', from: 'mmHg', to: 'Pa', ratio: 133.322 },
  { group: 'Năng lượng', from: 'cal', to: 'J', ratio: 4.184 },
  { group: 'Năng lượng', from: 'kWh', to: 'J', ratio: 3600000 },
  { group: 'Năng lượng', from: 'eV', to: 'J', ratio: 1.602176634e-19 },
];

// Modes list
const MODES = [
  { id: 1, name: 'COMP', label: '1: Tính toán thường', icon: '🔢', desc: 'Số học, Lượng giác, Mũ, Log, Vi/Tích phân, SOLVE, CALC' },
  { id: 2, name: 'CMPLX', label: '2: Số phức', icon: '🌀', desc: 'Số phức a+bi, Polar r∠θ, Pha dao động THPT Lý' },
  { id: 3, name: 'BASE-N', label: '3: Cơ số N', icon: '💻', desc: 'Hệ 2 (BIN), 8 (OCT), 10 (DEC), 16 (HEX) & Phép Bitwise' },
  { id: 4, name: 'MATRIX', label: '4: Ma trận', icon: '▦', desc: 'Ma trận MatA..D (đến 4x4), Định thức det, Nghịch đảo, Tích' },
  { id: 5, name: 'VECTOR', label: '5: Véc-tơ', icon: '↗️', desc: 'Véc-tơ 2D & 3D, Tích vô hướng (Dot), Tích có hướng (Cross)' },
  { id: 6, name: 'STAT', label: '6: Thống kê', icon: '📊', desc: 'Thống kê 1 biến (Trung bình, độ lệch chuẩn), Hồi quy tuyến tính' },
  { id: 7, name: 'DIST', label: '7: Phân phối', icon: '📈', desc: 'Phân phối xác suất Chuẩn (Normal), Nhị thức (Binomial)' },
  { id: 8, name: 'TABLE', label: '8: Bảng giá trị', icon: '📋', desc: 'Bảng f(x) & g(x) tìm GTLN/GTNN trên đoạn [a, b]' },
  { id: 9, name: 'EQN/SOLV', label: '9: Phương trình', icon: '🧮', desc: 'Hệ PT 2,3,4 ẩn & PT bậc 2,3,4, Cực trị Parabol' },
  { id: 10, name: 'INEQ', label: '10: Bất phương trình', icon: '⚖️', desc: 'Bất phương trình bậc 2, 3, 4' },
  { id: 11, name: 'RATIO', label: '11: Tỷ lệ thức', icon: '⚖️', desc: 'Giải tỷ lệ A:B = X:D hoặc A:B = C:X' }
];

export default function CasioFX580({ isFloating = false, onClose = null }) {
  // State for Calculator status
  const [mode, setMode] = useState(1); // Mode 1 to 11
  const [shift, setShift] = useState(false);
  const [alpha, setAlpha] = useState(false);
  const [angleUnit, setAngleUnit] = useState('DEG'); // DEG, RAD, GRAD
  const [displayExpr, setDisplayExpr] = useState('');
  const [cursorPos, setCursorPos] = useState(0);

  // Interactive Natural V.P.A.M. Template States
  const [activeTemplate, setActiveTemplate] = useState('NONE'); // 'NONE' | 'FRAC' | 'INTEGRAL' | 'LOGBASE' | 'POWER'
  const [activeBox, setActiveBox] = useState('main');

  // Fraction fields
  const [fracNum, setFracNum] = useState('');
  const [fracDen, setFracDen] = useState('');

  // Definite Integral fields
  const [integBody, setIntegBody] = useState('');
  const [integLower, setIntegLower] = useState('');
  const [integUpper, setIntegUpper] = useState('');

  // Log base fields
  const [logBase, setLogBase] = useState('');
  const [logArg, setLogArg] = useState('');

  // Power field
  const [powerExp, setPowerExp] = useState('');
  const [resultText, setResultText] = useState('0');
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Output format state: 'decimal', 'fraction', 'mixed', 'scientific'
  const [displayFormat, setDisplayFormat] = useState('decimal');
  const [numericValue, setNumericValue] = useState(0);

  // Memory variables: A, B, C, D, E, F, X, Y, M, Ans, PreAns
  const [vars, setVars] = useState({
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0, Ans: 0, PreAns: 0
  });
  const [stoMode, setStoMode] = useState(false);
  const [rclMode, setRclMode] = useState(false);

  // Overlays / Modals inside calculator
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showConstMenu, setShowConstMenu] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [showOptnMenu, setShowOptnMenu] = useState(false);
  const [showVarsModal, setShowVarsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showStepByStepModal, setShowStepByStepModal] = useState(false);
  const [stepSolution, setStepSolution] = useState(null);

  // DEDICATED MODES STATES

  // Mode 2: Complex
  const [cplxZ1, setCplxZ1] = useState({ real: 3, imag: 4 });
  const [cplxZ2, setCplxZ2] = useState({ real: 1, imag: -2 });
  const [cplxResult, setCplxResult] = useState(null);

  // Mode 3: Base-N
  const [baseNVal, setBaseNVal] = useState(255);
  const [activeBase, setActiveBase] = useState('DEC');

  // Mode 4: Matrix
  const [matDim, setMatDim] = useState(2); // 2x2, 3x3
  const [matA, setMatA] = useState([[1, 2], [3, 4]]);
  const [matB, setMatB] = useState([[5, 6], [7, 8]]);
  const [matrixResult, setMatrixResult] = useState(null);

  // Mode 5: Vector
  const [vctDim, setVctDim] = useState(3); // 2D or 3D
  const [vctA, setVctA] = useState([1, 2, 3]);
  const [vctB, setVctB] = useState([4, 5, 6]);
  const [vectorResult, setVectorResult] = useState(null);

  // Mode 6: Stat
  const [statPoints, setStatPoints] = useState('1, 2, 3, 4, 5, 6, 7, 8');
  const [statYPoints, setStatYPoints] = useState('2, 4, 5, 7, 8, 10, 11, 14');
  const [statResult, setStatResult] = useState(null);

  // Mode 7: Dist
  const [distType, setDistType] = useState('normPD'); // normPD, normCD, binomPD, binomCD
  const [distParams, setDistParams] = useState({ x: 0, mu: 0, sigma: 1, k: 3, n: 10, p: 0.5 });
  const [distResult, setDistResult] = useState(null);

  // Mode 8: Table
  const [tableFunc, setTableFunc] = useState('X^2 - 4*X + 3');
  const [tableStart, setTableStart] = useState(-3);
  const [tableEnd, setTableEnd] = useState(5);
  const [tableStep, setTableStep] = useState(1);
  const [tableRows, setTableRows] = useState(null);

  // Mode 9: EQN/SOLV
  const [eqnType, setEqnType] = useState('poly'); // 'simul' or 'poly'
  const [polyDegree, setPolyDegree] = useState(2); // 2, 3, 4
  const [simulDim, setSimulDim] = useState(2); // 2, 3, 4
  const [polyCoeffs, setPolyCoeffs] = useState({ a: 1, b: -5, c: 6, d: 0, e: 0 });
  const [simulCoeffs, setSimulCoeffs] = useState({
    a1: 2, b1: 1, c1: 0, d1: 5,
    a2: 1, b2: -1, c2: 0, d2: 1,
    a3: 0, b3: 0, c3: 1, d3: 0
  });
  const [eqnResults, setEqnResults] = useState(null);

  // Mode 10: INEQ
  const [ineqSymbol, setIneqSymbol] = useState('>'); // '>', '>=', '<', '<='
  const [ineqCoeffs, setIneqCoeffs] = useState({ a: 1, b: -5, c: 6 });
  const [ineqResult, setIneqResult] = useState(null);

  // Mode 11: RATIO
  const [ratioType, setRatioType] = useState(1); // 1: A:B = X:D, 2: A:B = C:X
  const [ratioVals, setRatioVals] = useState({ A: 2, B: 4, C: 3, D: 6 });
  const [ratioResult, setRatioResult] = useState(null);

  // Audio Context ref
  const audioCtxRef = useRef(null);

  const playKeySound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, audioCtxRef.current.currentTime + 0.02);
        gain.gain.setValueAtTime(0.14, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.02);
      }
    } catch (e) {}
  };

  const commitActiveTemplateToDisplayExpr = (targetPos = 'right') => {
    if (activeTemplate === 'NONE') return;

    let templateStr = '';
    if (activeTemplate === 'FRAC') {
      templateStr = `(${fracNum || '0'})/(${fracDen || '1'})`;
    } else if (activeTemplate === 'INTEGRAL') {
      templateStr = `∫(${integBody || 'X'},${integLower || '0'},${integUpper || '1'})`;
    } else if (activeTemplate === 'LOGBASE') {
      templateStr = `log_(${logBase || '10'},${logArg || '1'})`;
    } else if (activeTemplate === 'POWER') {
      templateStr = `^(${powerExp || '1'})`;
    }

    if (templateStr) {
      setDisplayExpr(prev => {
        const left = prev.slice(0, cursorPos);
        const right = prev.slice(cursorPos);
        const updated = left + templateStr + right;
        setCursorPos(targetPos === 'left' ? left.length : left.length + templateStr.length);
        return updated;
      });
    }

    setActiveTemplate('NONE');
    setActiveBox('main');
    setFracNum('');
    setFracDen('');
    setIntegBody('');
    setIntegLower('');
    setIntegUpper('');
    setLogBase('');
    setLogArg('');
    setPowerExp('');
  };

  const navigateLeft = () => {
    playKeySound();
    if (activeTemplate === 'FRAC') {
      if (activeBox === 'den') setActiveBox('num');
      else if (activeBox === 'num') commitActiveTemplateToDisplayExpr('left');
      else setCursorPos(prev => Math.max(0, prev - 1));
    } else if (activeTemplate === 'INTEGRAL') {
      if (activeBox === 'body') setActiveBox('upper');
      else if (activeBox === 'upper') setActiveBox('lower');
      else if (activeBox === 'lower') commitActiveTemplateToDisplayExpr('left');
      else setCursorPos(prev => Math.max(0, prev - 1));
    } else if (activeTemplate === 'LOGBASE') {
      if (activeBox === 'arg') setActiveBox('base');
      else if (activeBox === 'base') commitActiveTemplateToDisplayExpr('left');
      else setCursorPos(prev => Math.max(0, prev - 1));
    } else if (activeTemplate === 'POWER') {
      if (activeBox === 'exp') commitActiveTemplateToDisplayExpr('left');
      else setCursorPos(prev => Math.max(0, prev - 1));
    } else {
      setCursorPos(prev => Math.max(0, prev - 1));
    }
  };

  const navigateRight = () => {
    playKeySound();
    if (activeTemplate === 'FRAC') {
      if (activeBox === 'num') setActiveBox('den');
      else if (activeBox === 'den') commitActiveTemplateToDisplayExpr('right');
      else setCursorPos(prev => Math.min(displayExpr.length, prev + 1));
    } else if (activeTemplate === 'INTEGRAL') {
      if (activeBox === 'lower') setActiveBox('upper');
      else if (activeBox === 'upper') setActiveBox('body');
      else if (activeBox === 'body') commitActiveTemplateToDisplayExpr('right');
      else setCursorPos(prev => Math.min(displayExpr.length, prev + 1));
    } else if (activeTemplate === 'LOGBASE') {
      if (activeBox === 'base') setActiveBox('arg');
      else if (activeBox === 'arg') commitActiveTemplateToDisplayExpr('right');
      else setCursorPos(prev => Math.min(displayExpr.length, prev + 1));
    } else if (activeTemplate === 'POWER') {
      if (activeBox === 'exp') commitActiveTemplateToDisplayExpr('right');
      else setCursorPos(prev => Math.min(displayExpr.length, prev + 1));
    } else {
      setCursorPos(prev => Math.min(displayExpr.length, prev + 1));
    }
  };

  const navigateUp = () => {
    playKeySound();
    if (activeTemplate === 'FRAC' && activeBox === 'den') {
      setActiveBox('num');
    } else if (activeTemplate === 'INTEGRAL') {
      if (activeBox === 'lower') setActiveBox('upper');
      else if (activeBox === 'upper') setActiveBox('body');
    } else if (activeTemplate === 'LOGBASE' && activeBox === 'base') {
      setActiveBox('arg');
    } else if (history.length > 0) {
      setDisplayExpr(history[0].expr);
    }
  };

  const navigateDown = () => {
    playKeySound();
    if (activeTemplate === 'FRAC' && activeBox === 'num') {
      setActiveBox('den');
    } else if (activeTemplate === 'INTEGRAL') {
      if (activeBox === 'body') setActiveBox('upper');
      else if (activeBox === 'upper') setActiveBox('lower');
    } else if (activeTemplate === 'LOGBASE' && activeBox === 'arg') {
      setActiveBox('base');
    } else {
      handleAC();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === '.') {
        handleKeyPress('.');
      } else if (e.key === '+') {
        handleKeyPress('+');
      } else if (e.key === '-') {
        handleKeyPress('-');
      } else if (e.key === '*') {
        handleKeyPress('×');
      } else if (e.key === '/') {
        handleKeyPress('÷');
      } else if (e.key === '(' || e.key === ')') {
        handleKeyPress(e.key);
      } else if (e.key === '^') {
        handleKeyPress('xⁿ');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleDel();
      } else if (e.key === 'Escape') {
        handleAC();
      } else if (e.key.toLowerCase() === 'x') {
        handleKeyPress('X');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateRight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayExpr, angleUnit, vars, shift, alpha, mode, activeTemplate, activeBox]);

  // Prime Factorization Helper (FACT)
  const getPrimeFactorizationStr = (n) => {
    let num = Math.abs(Math.floor(n));
    if (num <= 1) return `${n}`;
    let factors = [];
    let d = 2;
    while (num >= 2) {
      let count = 0;
      while (num % d === 0) {
        count++;
        num /= d;
      }
      if (count > 0) {
        factors.push(count > 1 ? `${d}^${count}` : `${d}`);
      }
      d++;
      if (d * d > num) {
        if (num > 1) {
          factors.push(`${num}`);
          break;
        }
      }
    }
    return (n < 0 ? '-' : '') + factors.join(' × ');
  };

  // Natural Display Renderer Helper (Formating fractions, integrals, log base, superscripts, roots, etc.)
  const renderNaturalMath = (text) => {
    try {
      if (!text) return null;
      const str = String(text);

      // 0. Handle d/dx before fraction check (contains '/' but is not a fraction)
      if (str.includes('d/dx(')) {
        const idx = str.indexOf('d/dx(');
        const before = str.slice(0, idx);
        const after = str.slice(idx + 5); // after 'd/dx('
        return (
          <span>
            {before && renderNaturalMath(before)}
            <span><span style={{ textDecoration: 'underline' }}>d</span>/dx(</span>
            {after && renderNaturalMath(after)}
          </span>
        );
      }

      // 1. Integral: ∫(body, lower, upper) or ∫(...) or ∫
      if (str.includes('∫')) {
        const match = str.match(/∫\((.*?)\)/);
        let body = '', lower = '', upper = '';
        if (match && match[1]) {
          const parts = match[1].split(',');
          body = parts[0] || '';
          lower = parts[1] || '';
          upper = parts[2] || '';
        }

        return (
          <span className="casio-integral">
            <span className="integral-symbol">
              <span className="integral-upper">{upper ? renderNaturalMath(upper) : <span className="frac-box"></span>}</span>
              <span className="integral-lower">{lower ? renderNaturalMath(lower) : <span className="frac-box"></span>}</span>
            </span>
            <span className="integral-body">
              {body ? renderNaturalMath(body) : <span className="frac-box"></span>} <span style={{ fontStyle: 'italic', marginLeft: 2, fontWeight: 700 }}>dx</span>
            </span>
          </span>
        );
      }

      // 2. Logarithm with Base: log_(base, arg) or log_(...) or log_
      if (str.includes('log_')) {
        const match = str.match(/log_\((.*?)\)/);
        let base = '', arg = '';
        if (match && match[1]) {
          const parts = match[1].split(',');
          base = parts[0] || '';
          arg = parts[1] || '';
        }

        return (
          <span className="casio-log">
            <span className="log-text">log</span>
            <span className="log-base">{base ? renderNaturalMath(base) : <span className="frac-box"></span>}</span>
            <span className="log-arg">({arg ? renderNaturalMath(arg) : <span className="frac-box"></span>})</span>
          </span>
        );
      }

      // 3. Fraction: handle committed format (num)/(den) and simple a/b
      if (str.includes('/')) {
        // Try to match committed fraction format: (num)/(den) possibly followed by more expression
        const commitMatch = str.match(/^(.*?)\(([^()]*)\)\/\(([^()]*)\)(.*)$/);
        if (commitMatch) {
          const [, before, num, den, after] = commitMatch;
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <span className="casio-frac">
                <span className="frac-num">
                  {num ? renderNaturalMath(num) : <span className="frac-box"></span>}
                </span>
                <span className="frac-den">
                  {den ? renderNaturalMath(den) : <span className="frac-box"></span>}
                </span>
              </span>
              {after ? renderNaturalMath(after) : null}
            </span>
          );
        }

        // Fallback: simple fraction with single /
        const slashIndex = str.indexOf('/');
        const numPart = str.slice(0, slashIndex).trim();
        const denPart = str.slice(slashIndex + 1).trim();

        const numClean = numPart.replace(/^\(|\)$/g, '');
        const denClean = denPart.replace(/^\(|\)$/g, '');

        return (
          <span className="casio-frac">
            <span className="frac-num">
              {numClean ? renderNaturalMath(numClean) : <span className="frac-box"></span>}
            </span>
            <span className="frac-den">
              {denClean ? renderNaturalMath(denClean) : <span className="frac-box"></span>}
            </span>
          </span>
        );
      }

      // 4. Power/exponent: ^(exp) from committed template
      if (str.includes('^(')) {
        const match = str.match(/^(.*?)\^\(([^()]*)\)(.*)$/);
        if (match) {
          const [, before, exp, after] = match;
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <sup className="casio-sup">{exp || '□'}</sup>
              {after ? renderNaturalMath(after) : null}
            </span>
          );
        }
      }

      // 5. Square Root: √(content) or √(unclosed
      if (str.includes('√(')) {
        const idx = str.indexOf('√(');
        const before = str.slice(0, idx);
        const rest = str.slice(idx + 2);

        let parenCount = 1;
        let closeIdx = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === '(') parenCount++;
          else if (rest[i] === ')') {
            parenCount--;
            if (parenCount === 0) {
              closeIdx = i;
              break;
            }
          }
        }

        if (closeIdx !== -1) {
          const inner = rest.slice(0, closeIdx);
          const after = rest.slice(closeIdx + 1);
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <span className="casio-sqrt" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05em', marginRight: '1px' }}>√</span>
                <span style={{ borderTop: '1.8px solid #122115', paddingTop: '1px', paddingLeft: '2px', paddingRight: '2px' }}>
                  ({inner ? renderNaturalMath(inner) : null})
                </span>
              </span>
              {after ? renderNaturalMath(after) : null}
            </span>
          );
        } else {
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <span className="casio-sqrt" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05em', marginRight: '1px' }}>√</span>
                <span style={{ borderTop: '1.8px solid #122115', paddingTop: '1px', paddingLeft: '2px', paddingRight: '2px' }}>
                  ({renderNaturalMath(rest)}
                </span>
              </span>
            </span>
          );
        }
      }

      // 6. Cube Root: ³√(content) or ³√(unclosed
      if (str.includes('³√(')) {
        const idx = str.indexOf('³√(');
        const before = str.slice(0, idx);
        const rest = str.slice(idx + 3);

        let parenCount = 1;
        let closeIdx = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === '(') parenCount++;
          else if (rest[i] === ')') {
            parenCount--;
            if (parenCount === 0) {
              closeIdx = i;
              break;
            }
          }
        }

        if (closeIdx !== -1) {
          const inner = rest.slice(0, closeIdx);
          const after = rest.slice(closeIdx + 1);
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <span className="casio-cbrt" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05em', marginRight: '1px' }}>∛</span>
                <span style={{ borderTop: '1.8px solid #122115', paddingTop: '1px', paddingLeft: '2px', paddingRight: '2px' }}>
                  ({inner ? renderNaturalMath(inner) : null})
                </span>
              </span>
              {after ? renderNaturalMath(after) : null}
            </span>
          );
        } else {
          return (
            <span>
              {before ? renderNaturalMath(before) : null}
              <span className="casio-cbrt" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05em', marginRight: '1px' }}>∛</span>
                <span style={{ borderTop: '1.8px solid #122115', paddingTop: '1px', paddingLeft: '2px', paddingRight: '2px' }}>
                  ({renderNaturalMath(rest)}
                </span>
              </span>
            </span>
          );
        }
      }

      // Convert string tokens to pretty JSX elements
      let parts = String(text).split(/(\^2|\^3|\^[0-9A-Za-z]+|sin⁻¹\(|cos⁻¹\(|tan⁻¹\(|∫\()/g);

      return parts.map((part, index) => {
        if (part === '^2') return <sup key={index} className="casio-sup">2</sup>;
        if (part === '^3') return <sup key={index} className="casio-sup">3</sup>;
        if (part.startsWith('^')) return <sup key={index} className="casio-sup">{part.slice(1)}</sup>;
        if (part === 'sin⁻¹(') return <span key={index}>sin<sup>-1</sup>(</span>;
        if (part === 'cos⁻¹(') return <span key={index}>cos<sup>-1</sup>(</span>;
        if (part === 'tan⁻¹(') return <span key={index}>tan<sup>-1</sup>(</span>;
        if (part === '∫(') return <span key={index}>∫ (</span>;
        return <span key={index}>{part}</span>;
      });
    } catch (e) {
      // Fallback: render raw text if parsing fails
      return <span>{String(text)}</span>;
    }
  };

  // Key press handler
  const handleKeyPress = (val) => {
    playKeySound();

    if (stoMode) {
      if (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].includes(val)) {
        setVars(prev => ({ ...prev, [val]: numericValue }));
        setResultText(`Ans → ${val} = ${numericValue}`);
        setStoMode(false);
        setShift(false);
        return;
      }
    }

    if (rclMode) {
      if (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].includes(val)) {
        const storedVal = vars[val];
        setDisplayExpr(prev => prev + storedVal);
        setRclMode(false);
        return;
      }
    }

    let token = val;

    if (shift) {
      setShift(false);
      switch (val) {
        case 'sin': token = 'sin⁻¹('; break;
        case 'cos': token = 'cos⁻¹('; break;
        case 'tan': token = 'tan⁻¹('; break;
        case 'x²': token = '√('; break;
        case 'xⁿ': token = '³√('; break;
        case 'x⁻¹': token = '!'; break;
        case 'log': token = '10^('; break;
        case 'ln': token = 'e^('; break;
        case '(': token = '%'; break;
        case ')': token = ','; break;
        case '+': token = 'nPr'; break;
        case '-': token = 'nCr'; break;
        case '.': token = 'Ran#'; break;
        case '0': token = 'Rnd('; break;
        case 'Ans': token = 'PreAns'; break;
        case '=': toggleDisplayFormat(); return;
        case 'STO': setShowVarsModal(true); return;
        case 'CONST': setShowConstMenu(true); return;
        case 'CONV': setShowConvMenu(true); return;
        case 'S⇔D': toggleDisplayFormat(); return;
        case 'CALC': handleSolveEquation(); return;
        case 'FACT': 
          if (Number.isInteger(numericValue)) {
            setResultText(getPrimeFactorizationStr(numericValue));
          }
          return;
        default: token = val;
      }
    } else if (alpha) {
      setAlpha(false);
      switch (val) {
        case '(-)': token = 'A'; break;
        case '°\'"': token = 'B'; break;
        case 'hyp': token = 'C'; break;
        case 'sin': token = 'D'; break;
        case 'cos': token = 'E'; break;
        case 'tan': token = 'F'; break;
        case 'ENG': token = 'Y'; break;
        case 'M+': token = 'M'; break;
        case ')': token = 'X'; break;
        case 'S⇔D': token = ':'; break;
        case '7': token = 'A'; break;
        case '8': token = 'B'; break;
        case '9': token = 'C'; break;
        case '4': token = 'D'; break;
        case '5': token = 'E'; break;
        case '6': token = 'F'; break;
        case '1': token = 'X'; break;
        case '2': token = 'Y'; break;
        case '0': token = 'M'; break;
        case 'CALC': handleCalcVariable(); return;
        default: token = val;
      }
    } else {
      switch (val) {
        case 'sin': token = 'sin('; break;
        case 'cos': token = 'cos('; break;
        case 'tan': token = 'tan('; break;
        case 'log': token = 'log_('; break;
        case 'ln': token = 'ln('; break;
        case 'x²': token = '^2'; break;
        case 'x³': token = '^3'; break;
        case 'xⁿ': token = '^'; break;
        case 'x⁻¹': token = '⁻¹'; break;
        case '√': token = '√('; break;
        case 'π': token = 'π'; break;
        case 'e': token = 'e'; break;
        case 'Ans': token = 'Ans'; break;
        case 'a/b':
          commitActiveTemplateToDisplayExpr('right');
          setActiveTemplate('FRAC');
          setActiveBox('num');
          setFracNum('');
          setFracDen('');
          return;
        case '∫dx':
          commitActiveTemplateToDisplayExpr('right');
          setActiveTemplate('INTEGRAL');
          setActiveBox('body');
          setIntegBody('');
          setIntegLower('');
          setIntegUpper('');
          return;
        case 'log':
          commitActiveTemplateToDisplayExpr('right');
          setActiveTemplate('LOGBASE');
          setActiveBox('base');
          setLogBase('');
          setLogArg('');
          return;
        case 'xⁿ':
          commitActiveTemplateToDisplayExpr('right');
          setActiveTemplate('POWER');
          setActiveBox('exp');
          setPowerExp('');
          return;
        case 'i': token = 'i'; break;
        case 'Pol': token = 'Pol('; break;
        case 'Rec': token = 'Rec('; break;
        case 'd/dx': token = 'd/dx('; break;
        case 'STO': setStoMode(true); return;
        case 'RCL': setRclMode(true); return;
        case 'OPTN': setShowOptnMenu(true); return;
        default: token = val;
      }
    }

    if (activeTemplate === 'FRAC' && activeBox !== 'none') {
      if (activeBox === 'num') setFracNum(prev => prev + token);
      else if (activeBox === 'den') setFracDen(prev => prev + token);
      return;
    } else if (activeTemplate === 'INTEGRAL' && activeBox !== 'none') {
      if (activeBox === 'body') setIntegBody(prev => prev + token);
      else if (activeBox === 'lower') setIntegLower(prev => prev + token);
      else if (activeBox === 'upper') setIntegUpper(prev => prev + token);
      return;
    } else if (activeTemplate === 'LOGBASE' && activeBox !== 'none') {
      if (activeBox === 'base') setLogBase(prev => prev + token);
      else if (activeBox === 'arg') setLogArg(prev => prev + token);
      return;
    } else if (activeTemplate === 'POWER' && activeBox !== 'none') {
      if (activeBox === 'exp') setPowerExp(prev => prev + token);
      return;
    }

    setDisplayExpr(prev => {
      const left = prev.slice(0, cursorPos);
      const right = prev.slice(cursorPos);
      const updated = left + token + right;
      setCursorPos(left.length + token.length);
      return updated;
    });
  };

  const handleAC = () => {
    playKeySound();
    setDisplayExpr('');
    setCursorPos(0);
    setActiveTemplate('NONE');
    setActiveBox('main');
    setFracNum('');
    setFracDen('');
    setIntegBody('');
    setIntegLower('');
    setIntegUpper('');
    setLogBase('');
    setLogArg('');
    setPowerExp('');
    setResultText('0');
    setNumericValue(0);
    setShift(false);
    setAlpha(false);
    setStoMode(false);
    setRclMode(false);
  };

  const handleDel = () => {
    playKeySound();
    if (activeTemplate === 'FRAC' && activeBox !== 'none') {
      if (activeBox === 'num') {
        if (fracNum.length > 0) setFracNum(prev => prev.slice(0, -1));
        else setActiveTemplate('NONE');
      } else if (activeBox === 'den') {
        if (fracDen.length > 0) setFracDen(prev => prev.slice(0, -1));
        else setActiveBox('num');
      }
      return;
    } else if (activeTemplate === 'INTEGRAL' && activeBox !== 'none') {
      if (activeBox === 'body') {
        if (integBody.length > 0) setIntegBody(prev => prev.slice(0, -1));
        else setActiveTemplate('NONE');
      } else if (activeBox === 'lower') {
        if (integLower.length > 0) setIntegLower(prev => prev.slice(0, -1));
        else setActiveBox('body');
      } else if (activeBox === 'upper') {
        if (integUpper.length > 0) setIntegUpper(prev => prev.slice(0, -1));
        else setActiveBox('lower');
      }
      return;
    } else if (activeTemplate === 'LOGBASE' && activeBox !== 'none') {
      if (activeBox === 'base') {
        if (logBase.length > 0) setLogBase(prev => prev.slice(0, -1));
        else setActiveTemplate('NONE');
      } else if (activeBox === 'arg') {
        if (logArg.length > 0) setLogArg(prev => prev.slice(0, -1));
        else setActiveBox('base');
      }
      return;
    } else if (activeTemplate === 'POWER' && activeBox !== 'none') {
      if (powerExp.length > 0) setPowerExp(prev => prev.slice(0, -1));
      else setActiveTemplate('NONE');
      return;
    }

    if (cursorPos === 0) return;
    setDisplayExpr(prev => {
      const left = prev.slice(0, cursorPos - 1);
      const right = prev.slice(cursorPos);
      setCursorPos(left.length);
      return left + right;
    });
  };

  const decimalToFraction = (val) => {
    if (isNaN(val) || !isFinite(val)) return null;
    if (Number.isInteger(val)) return `${val}`;
    const tolerance = 1.0E-9;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = val;
    do {
      let a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(val - h1 / k1) > val * tolerance && k1 < 10000);

    if (k1 > 1 && Math.abs(val - h1 / k1) < 1e-6) {
      return { num: h1, den: k1, str: `${h1}/${k1}` };
    }
    return null;
  };

  const toggleDisplayFormat = () => {
    playKeySound();
    if (displayFormat === 'decimal') {
      const frac = decimalToFraction(numericValue);
      if (frac) {
        setDisplayFormat('fraction');
        setResultText(frac.str);
      } else {
        setDisplayFormat('scientific');
        setResultText(numericValue.toExponential(6));
      }
    } else if (displayFormat === 'fraction') {
      setDisplayFormat('mixed');
      const frac = decimalToFraction(numericValue);
      if (frac && Math.abs(frac.num) > frac.den) {
        const whole = Math.floor(Math.abs(frac.num) / frac.den) * (frac.num < 0 ? -1 : 1);
        const rem = Math.abs(frac.num) % frac.den;
        setResultText(`${whole} ${rem}/${frac.den}`);
      } else {
        setDisplayFormat('scientific');
        setResultText(numericValue.toExponential(6));
      }
    } else if (displayFormat === 'mixed') {
      setDisplayFormat('scientific');
      setResultText(numericValue.toExponential(6));
    } else {
      setDisplayFormat('decimal');
      setResultText(String(numericValue));
    }
  };

  const evaluateExpression = (exprStr, customVars = {}) => {
    if (!exprStr || exprStr.trim() === '') return 0;

    let clean = exprStr;
    const activeVars = { ...vars, ...customVars };

    clean = clean.replace(/PreAns/g, activeVars.PreAns || 0);
    clean = clean.replace(/Ans/g, activeVars.Ans || 0);
    clean = clean.replace(/π/g, Math.PI);
    clean = clean.replace(/e/g, Math.E);
    clean = clean.replace(/\bA\b/g, activeVars.A || 0);
    clean = clean.replace(/\bB\b/g, activeVars.B || 0);
    clean = clean.replace(/\bC\b/g, activeVars.C || 0);
    clean = clean.replace(/\bD\b/g, activeVars.D || 0);
    clean = clean.replace(/\bE\b/g, activeVars.E || 0);
    clean = clean.replace(/\bF\b/g, activeVars.F || 0);
    clean = clean.replace(/\bX\b/g, activeVars.X || 0);
    clean = clean.replace(/\bY\b/g, activeVars.Y || 0);
    clean = clean.replace(/\bM\b/g, activeVars.M || 0);

    clean = clean.replace(/×/g, '*').replace(/÷/g, '/');
    clean = clean.replace(/\^2/g, '**2').replace(/\^3/g, '**3').replace(/\^/g, '**');

    const toRad = angleUnit === 'DEG' ? (Math.PI / 180) : angleUnit === 'GRAD' ? (Math.PI / 200) : 1;
    const fromRad = angleUnit === 'DEG' ? (180 / Math.PI) : angleUnit === 'GRAD' ? (200 / Math.PI) : 1;

    clean = clean.replace(/sin⁻¹\(/g, `(${fromRad}*Math.asin(`);
    clean = clean.replace(/cos⁻¹\(/g, `(${fromRad}*Math.acos(`);
    clean = clean.replace(/tan⁻¹\(/g, `(${fromRad}*Math.atan(`);
    clean = clean.replace(/sin\(/g, `Math.sin(${toRad}*`);
    clean = clean.replace(/cos\(/g, `Math.cos(${toRad}*`);
    clean = clean.replace(/tan\(/g, `Math.tan(${toRad}*`);

    clean = clean.replace(/ln\(/g, 'Math.log(');
    clean = clean.replace(/log\(/g, 'Math.log10(');
    clean = clean.replace(/√\(/g, 'Math.sqrt(');
    clean = clean.replace(/³√\(/g, 'Math.cbrt(');

    clean = clean.replace(/(\d+)!/g, (_, num) => {
      let n = parseInt(num);
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    });

    try {
      const res = new Function(`return (${clean})`)();
      if (typeof res === 'number') {
        return res;
      }
      return NaN;
    } catch (err) {
      throw new Error('Cú pháp không hợp lệ');
    }
  };

  const evalDefiniteIntegral = (bodyStr, lowVal, upVal) => {
    const N = 100;
    const h = (upVal - lowVal) / N;
    let sum = evaluateExpression(bodyStr, { X: lowVal }) + evaluateExpression(bodyStr, { X: upVal });
    for (let i = 1; i < N; i++) {
      const xVal = lowVal + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * evaluateExpression(bodyStr, { X: xVal });
    }
    return (h / 3) * sum;
  };

  const handleCalculate = () => {
    playKeySound();

    let mainVal = displayExpr ? evaluateExpression(displayExpr) : 0;
    let finalVal = mainVal;
    let histLabel = displayExpr || '0';

    try {
      if (activeTemplate === 'FRAC') {
        const nVal = evaluateExpression(fracNum || '0');
        const dVal = evaluateExpression(fracDen || '1');
        finalVal = (displayExpr ? mainVal : 0) + (nVal / dVal);
        histLabel = `${displayExpr} (${fracNum || 0})/(${fracDen || 1})`;
      } else if (activeTemplate === 'INTEGRAL') {
        const lowVal = evaluateExpression(integLower || '0');
        const upVal = evaluateExpression(integUpper || '1');
        const bodyRes = evalDefiniteIntegral(integBody || 'X', lowVal, upVal);
        finalVal = (displayExpr ? mainVal : 0) + bodyRes;
        histLabel = `∫_${integLower}^${integUpper} (${integBody}) dx`;
      } else if (activeTemplate === 'LOGBASE') {
        const bVal = evaluateExpression(logBase || '10');
        const aVal = evaluateExpression(logArg || '1');
        const logRes = Math.log(aVal) / Math.log(bVal);
        finalVal = (displayExpr ? mainVal : 0) + logRes;
        histLabel = `log_${logBase}(${logArg})`;
      } else if (activeTemplate === 'POWER') {
        const pVal = evaluateExpression(powerExp || '1');
        finalVal = Math.pow(mainVal, pVal);
        histLabel = `${displayExpr}^(${powerExp})`;
      }

      if (isNaN(finalVal) || !isFinite(finalVal)) {
        setResultText('Math ERROR');
      } else {
        const rounded = Math.abs(finalVal) < 1e-12 ? 0 : Number(finalVal.toFixed(10));
        setNumericValue(rounded);
        setResultText(String(rounded));

        setVars(prev => ({
          ...prev,
          PreAns: prev.Ans,
          Ans: rounded
        }));

        setHistory(prev => [{ expr: histLabel, res: String(rounded) }, ...prev.slice(0, 49)]);
      }
    } catch (err) {
      setResultText('Syntax ERROR');
    }
  };

  const handleSolveEquation = () => {
    playKeySound();
    let exprStr = displayExpr;
    if (!exprStr.includes('X')) {
      exprStr = displayExpr + ' - X';
    }

    try {
      let x = 1.0;
      const f = (xVal) => evaluateExpression(exprStr, { X: xVal });
      const df = (xVal) => (f(xVal + 1e-6) - f(xVal - 1e-6)) / 2e-6;

      for (let i = 0; i < 100; i++) {
        const fx = f(x);
        if (Math.abs(fx) < 1e-9) break;
        const dfx = df(x);
        if (Math.abs(dfx) < 1e-12) break;
        x = x - fx / dfx;
      }

      const sol = Number(x.toFixed(8));
      setVars(prev => ({ ...prev, X: sol }));
      setResultText(`X = ${sol}`);

      setStepSolution({
        title: 'Lời giải chi tiết bằng Thuật toán Newton-Raphson (SOLVE)',
        steps: [
          `Phương trình: ${displayExpr} = 0`,
          `Đổi phương trình về dạng f(X) = 0`,
          `Chọn điểm xấp xỉ ban đầu X₀ = 1.0`,
          `Áp dụng công thức lặp: Xₙ₊₁ = Xₙ - f(Xₙ)/f'(Xₙ)`,
          `Hội tụ nghiệm tìm được: X = ${sol}`,
          `Kiểm tra lại: f(${sol}) ≈ 0`
        ]
      });
    } catch (e) {
      setResultText('Can\'t Solve');
    }
  };

  const handleCalcVariable = () => {
    playKeySound();
    const val = evaluateExpression(displayExpr, { X: vars.X });
    setResultText(`X=${vars.X} => ${val}`);
  };

  // FULL MODE SOLVERS IMPLEMENTATIONS

  // Mode 2: Complex Solver
  const solveComplex = () => {
    playKeySound();
    const a1 = cplxZ1.real, b1 = cplxZ1.imag;
    const a2 = cplxZ2.real, b2 = cplxZ2.imag;

    const sumR = a1 + a2, sumI = b1 + b2;
    const prodR = a1 * a2 - b1 * b2, prodI = a1 * b2 + a2 * b1;
    const modZ1 = Math.sqrt(a1 * a1 + b1 * b1);
    const argZ1 = (Math.atan2(b1, a1) * 180 / Math.PI).toFixed(2);

    setCplxResult({
      sum: `${sumR} + ${sumI}i`,
      prod: `${prodR} + ${prodI}i`,
      mod: modZ1.toFixed(4),
      polar: `${modZ1.toFixed(4)} ∠ ${argZ1}°`
    });
  };

  // Mode 4: Matrix Solver
  const solveMatrix = () => {
    playKeySound();
    const a = matA[0][0], b = matA[0][1], c = matA[1][0], d = matA[1][1];
    const detA = a * d - b * c;
    const trA = a + d;

    let invA = 'Không có (det = 0)';
    if (detA !== 0) {
      invA = `[${(d/detA).toFixed(2)}, ${(-b/detA).toFixed(2)}; ${(-c/detA).toFixed(2)}, ${(a/detA).toFixed(2)}]`;
    }

    setMatrixResult({
      detA,
      trA,
      invA,
      transA: `[${a}, ${c}; ${b}, ${d}]`
    });
  };

  // Mode 5: Vector Solver
  const solveVector = () => {
    playKeySound();
    const [x1, y1, z1] = vctA;
    const [x2, y2, z2] = vctB;

    const dotP = x1 * x2 + y1 * y2 + z1 * z2;
    const crossP = [y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2];
    const magA = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
    const magB = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2);
    const cosTheta = dotP / (magA * magB);
    const angleDeg = (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI).toFixed(2);

    setVectorResult({
      dotP,
      crossP: `(${crossP.join(', ')})`,
      magA: magA.toFixed(4),
      angleDeg: `${angleDeg}°`
    });
  };

  // Mode 6: Stat Solver
  const solveStat = () => {
    playKeySound();
    const xArr = statPoints.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    const yArr = statYPoints.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));

    if (xArr.length === 0) return;
    const n = xArr.length;
    const sumX = xArr.reduce((a, b) => a + b, 0);
    const meanX = sumX / n;
    const sumX2 = xArr.reduce((a, b) => a + b * b, 0);
    const varX = (sumX2 / n) - (meanX * meanX);
    const stdDevX = Math.sqrt(Math.max(0, varX));

    let regInfo = null;
    if (yArr.length === n) {
      const sumY = yArr.reduce((a, b) => a + b, 0);
      const meanY = sumY / n;
      const sumXY = xArr.reduce((acc, x, i) => acc + x * yArr[i], 0);
      const sumY2 = yArr.reduce((a, b) => a + b * b, 0);

      const bCoeff = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const aCoeff = meanY - bCoeff * meanX;
      const rCoeff = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      regInfo = { a: aCoeff.toFixed(4), b: bCoeff.toFixed(4), r: rCoeff.toFixed(4) };
    }

    setStatResult({
      n,
      meanX: meanX.toFixed(4),
      sumX,
      stdDevX: stdDevX.toFixed(4),
      regInfo
    });
  };

  // Mode 7: Dist Solver
  const solveDist = () => {
    playKeySound();
    const { x, mu, sigma, k, n, p } = distParams;

    if (distType === 'normPD') {
      const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
      setDistResult(`f(${x}) = ${pdf.toFixed(6)}`);
    } else if (distType === 'binomPD') {
      const nCrVal = (nVal, kVal) => {
        let res = 1;
        for (let i = 1; i <= kVal; i++) res = res * (nVal - i + 1) / i;
        return res;
      };
      const prob = nCrVal(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
      setDistResult(`P(X = ${k}) = ${prob.toFixed(6)}`);
    }
  };

  // Mode 9: EQN Solver (Simultaneous & Polynomial)
  const solvePolynomial = () => {
    playKeySound();
    const { a, b, c } = polyCoeffs;
    if (polyDegree === 2) {
      const delta = b * b - 4 * a * c;
      const xMin = -b / (2 * a);
      const yMin = a * xMin * xMin + b * xMin + c;

      if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
        setEqnResults({ x1: x1.toFixed(4), x2: x2.toFixed(4), delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) });
      } else if (delta === 0) {
        const x = -b / (2 * a);
        setEqnResults({ x1: x.toFixed(4), x2: x.toFixed(4), delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) });
      } else {
        const realPart = (-b / (2 * a)).toFixed(4);
        const imagPart = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
        setEqnResults({ x1: `${realPart} + ${imagPart}i`, x2: `${realPart} - ${imagPart}i`, delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) });
      }
    }
  };

  const solveSimultaneous = () => {
    playKeySound();
    const { a1, b1, d1, a2, b2, d2 } = simulCoeffs;
    const det = a1 * b2 - a2 * b1;
    if (det === 0) {
      setEqnResults({ error: 'Hệ vô nghiệm hoặc vô số nghiệm' });
    } else {
      const x = (d1 * b2 - d2 * b1) / det;
      const y = (a1 * d2 - a2 * d1) / det;
      setEqnResults({ simulX: x.toFixed(4), simulY: y.toFixed(4) });
    }
  };

  // Mode 10: INEQ Solver
  const solveInequality = () => {
    playKeySound();
    const { a, b, c } = ineqCoeffs;
    const delta = b * b - 4 * a * c;

    if (delta > 0) {
      const x1 = Math.min((-b + Math.sqrt(delta)) / (2 * a), (-b - Math.sqrt(delta)) / (2 * a)).toFixed(2);
      const x2 = Math.max((-b + Math.sqrt(delta)) / (2 * a), (-b - Math.sqrt(delta)) / (2 * a)).toFixed(2);

      if (ineqSymbol === '>') setIneqResult(`x < ${x1} hoặc x > ${x2}`);
      else if (ineqSymbol === '<') setIneqResult(`${x1} < x < ${x2}`);
      else if (ineqSymbol === '>=') setIneqResult(`x ≤ ${x1} hoặc x ≥ ${x2}`);
      else if (ineqSymbol === '<=') setIneqResult(`${x1} ≤ x ≤ ${x2}`);
    } else {
      setIneqResult('Tất cả số thực ℝ hoặc Vô nghiệm');
    }
  };

  // Mode 11: RATIO Solver
  const solveRatio = () => {
    playKeySound();
    const { A, B, C, D } = ratioVals;
    if (ratioType === 1) {
      // A:B = X:D => X = (A*D)/B
      const XVal = (A * D) / B;
      setRatioResult(`X = ${XVal}`);
    } else {
      // A:B = C:X => X = (B*C)/A
      const XVal = (B * C) / A;
      setRatioResult(`X = ${XVal}`);
    }
  };

  // Mode 8: Table Generator f(x)
  const generateTable = () => {
    playKeySound();
    const rows = [];
    const step = parseFloat(tableStep) || 1;
    const start = parseFloat(tableStart) || 0;
    const end = parseFloat(tableEnd) || 10;

    let minVal = Infinity;
    let maxVal = -Infinity;
    let minX = start;
    let maxX = start;

    for (let x = start; x <= end + 1e-9; x += step) {
      const roundedX = Number(x.toFixed(4));
      try {
        const y = evaluateExpression(tableFunc, { X: roundedX });
        const roundedY = isNaN(y) ? 'ERROR' : Number(y.toFixed(4));
        rows.push({ x: roundedX, y: roundedY });

        if (typeof roundedY === 'number') {
          if (roundedY < minVal) { minVal = roundedY; minX = roundedX; }
          if (roundedY > maxVal) { maxVal = roundedY; maxX = roundedX; }
        }
      } catch (e) {
        rows.push({ x: roundedX, y: 'ERROR' });
      }
    }

    setTableRows({ rows, minVal, minX, maxVal, maxX });
  };

  return (
    <div className={`casio-container ${isFloating ? 'floating' : 'full-page'} animate-fade`}>
      {/* Top control bar for options */}
      <div className="casio-top-bar">
        <div className="casio-brand">
          <Calculator className="brand-icon" size={20} />
          <span>CASIO <small style={{ color: '#00e5ff', fontWeight: 700 }}>fx-580VN X</small></span>
          <span className="classwiz-tag">CLASSWIZ</span>
        </div>

        <div className="casio-quick-actions">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="top-btn"
            title={soundEnabled ? 'Tắt âm thanh phím' : 'Bật âm thanh phím'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => setShowVarsModal(true)}
            className="top-btn"
            title="Xem giá trị biến nhớ (RECALL)"
          >
            <Database size={15} /> Bảng Biến
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="top-btn"
            title="Lịch sử tính toán"
          >
            <History size={16} /> Lịch sử ({history.length})
          </button>
          <button
            onClick={() => setShowGuideModal(true)}
            className="top-btn"
            title="Mẹo thi THPT Quốc Gia"
          >
            <BookOpen size={16} /> Mẹo thi THPT
          </button>

          {isFloating && onClose && (
            <button onClick={onClose} className="top-btn close-btn" title="Đóng máy tính">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Body of Casio Calculator */}
      <div className="casio-body">
        {/* Metallic Blue Top Accent with Solar Cell */}
        <div className="casio-header-panel">
          <div className="solar-cell">
            <span className="solar-grid"></span>
            <span className="solar-grid"></span>
            <span className="solar-grid"></span>
            <span className="solar-grid"></span>
            <span className="solar-label">TWO WAY POWER</span>
          </div>
          <div className="model-subtitle">HIGH RESOLUTION NATURAL-V.P.A.M.</div>
        </div>

        {/* High Resolution Dot-Matrix Screen */}
        <div className="casio-screen">
          {/* Status Bar Indicators */}
          <div className="screen-status-bar">
            <span className={`status-indicator ${shift ? 'active shift' : ''}`}>S</span>
            <span className={`status-indicator ${alpha ? 'active alpha' : ''}`}>A</span>
            <span className={`status-indicator ${vars.M !== 0 ? 'active' : ''}`}>M</span>
            <span className={`status-indicator ${stoMode ? 'active' : ''}`}>STO</span>
            <span className={`status-indicator ${rclMode ? 'active' : ''}`}>RCL</span>
            <span className="status-mode">{MODES.find(m => m.id === mode)?.name}</span>
            <span className="status-angle">{angleUnit}</span>
            <span className="status-math">MATH</span>
          </div>

          {/* Expression Input Area with Natural Display Formatting & Interactive Templates */}
          <div className="screen-input-area">
            {displayExpr ? renderNaturalMath(displayExpr.slice(0, cursorPos)) : null}
            {activeTemplate === 'NONE' && <span className="cursor-blink">|</span>}
            {displayExpr ? renderNaturalMath(displayExpr.slice(cursorPos)) : null}

            {/* 1. Interactive Stacked Fraction Template */}
            {activeTemplate === 'FRAC' && (
              <span className="casio-frac">
                <span
                  className={`frac-num ${activeBox === 'num' ? 'active-box' : ''}`}
                  onClick={() => setActiveBox('num')}
                >
                  {fracNum}
                  {activeBox === 'num' && <span className="cursor-blink">|</span>}
                  {!fracNum && activeBox !== 'num' && <span className="frac-box" />}
                </span>
                <span
                  className={`frac-den ${activeBox === 'den' ? 'active-box' : ''}`}
                  onClick={() => setActiveBox('den')}
                >
                  {fracDen}
                  {activeBox === 'den' && <span className="cursor-blink">|</span>}
                  {!fracDen && activeBox !== 'den' && <span className="frac-box" />}
                </span>
              </span>
            )}

            {/* 2. Interactive Definite Integral Template */}
            {activeTemplate === 'INTEGRAL' && (
              <span className="casio-integral">
                <span className="integral-symbol">
                  <span
                    className={`integral-upper ${activeBox === 'upper' ? 'active-box' : ''}`}
                    onClick={() => setActiveBox('upper')}
                  >
                    {integUpper}
                    {activeBox === 'upper' && <span className="cursor-blink">|</span>}
                    {!integUpper && activeBox !== 'upper' && <span className="frac-box" />}
                  </span>
                  <span
                    className={`integral-lower ${activeBox === 'lower' ? 'active-box' : ''}`}
                    onClick={() => setActiveBox('lower')}
                  >
                    {integLower}
                    {activeBox === 'lower' && <span className="cursor-blink">|</span>}
                    {!integLower && activeBox !== 'lower' && <span className="frac-box" />}
                  </span>
                </span>
                <span
                  className={`integral-body ${activeBox === 'body' ? 'active-box' : ''}`}
                  onClick={() => setActiveBox('body')}
                >
                  {integBody}
                  {activeBox === 'body' && <span className="cursor-blink">|</span>}
                  {!integBody && activeBox !== 'body' && <span className="frac-box" />}
                  <span style={{ fontStyle: 'italic', marginLeft: 3, fontWeight: 700 }}>dx</span>
                </span>
              </span>
            )}

            {/* 3. Interactive Logarithm with Base Template */}
            {activeTemplate === 'LOGBASE' && (
              <span className="casio-log">
                <span className="log-text">log</span>
                <span
                  className={`log-base ${activeBox === 'base' ? 'active-box' : ''}`}
                  onClick={() => setActiveBox('base')}
                >
                  {logBase}
                  {activeBox === 'base' && <span className="cursor-blink">|</span>}
                  {!logBase && activeBox !== 'base' && <span className="frac-box" />}
                </span>
                <span
                  className={`log-arg ${activeBox === 'arg' ? 'active-box' : ''}`}
                  onClick={() => setActiveBox('arg')}
                >
                  ({logArg}
                  {activeBox === 'arg' && <span className="cursor-blink">|</span>}
                  {!logArg && activeBox !== 'arg' && <span className="frac-box" />})
                </span>
              </span>
            )}

            {/* 4. Interactive Power Exponent Template */}
            {activeTemplate === 'POWER' && (
              <sup
                className={`power-exp ${activeBox === 'exp' ? 'active-box' : ''}`}
                onClick={() => setActiveBox('exp')}
                style={{ color: '#00e5ff', fontWeight: 900 }}
              >
                {powerExp}
                {activeBox === 'exp' && <span className="cursor-blink">|</span>}
                {!powerExp && activeBox !== 'exp' && <span className="frac-box" />}
              </sup>
            )}

            {!displayExpr && activeTemplate === 'NONE' && <span className="placeholder-text">0</span>}
          </div>

          {/* Result Output Area */}
          <div className="screen-result-area">
            {resultText}
          </div>
        </div>

        {/* Mode Selector & Quick Tool Row */}
        <div className="casio-mode-bar">
          <button
            onClick={() => setShowModeMenu(true)}
            className="mode-menu-btn"
          >
            <Grid size={14} /> MENU ({mode}: {MODES.find(m => m.id === mode)?.name})
          </button>

          <button
            onClick={() => setAngleUnit(prev => prev === 'DEG' ? 'RAD' : prev === 'RAD' ? 'GRAD' : 'DEG')}
            className="unit-toggle-btn"
          >
            <ArrowRightLeft size={12} /> {angleUnit}
          </button>

          <button
            onClick={toggleDisplayFormat}
            className="sd-toggle-btn"
            title="Đổi định dạng Phân số / Thập phân (S<=>D)"
          >
            S ⇔ D ({displayFormat})
          </button>

          {stepSolution && (
            <button
              onClick={() => setShowStepByStepModal(true)}
              className="solution-btn"
            >
              <Sparkles size={12} /> Lời giải
            </button>
          )}
        </div>

        {/* Dedicated Interactive Control Panels for ALL 11 Modes */}

        {/* Mode 2: Complex */}
        {mode === 2 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">🌀 Tính Toán Số Phức (Mode 2)</div>
            <div className="coeff-inputs">
              <label>z₁ =</label>
              <input type="number" value={cplxZ1.real} onChange={(e) => setCplxZ1({ ...cplxZ1, real: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> +
              <input type="number" value={cplxZ1.imag} onChange={(e) => setCplxZ1({ ...cplxZ1, imag: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> i
            </div>
            <div className="coeff-inputs" style={{ marginTop: 4 }}>
              <label>z₂ =</label>
              <input type="number" value={cplxZ2.real} onChange={(e) => setCplxZ2({ ...cplxZ2, real: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> +
              <input type="number" value={cplxZ2.imag} onChange={(e) => setCplxZ2({ ...cplxZ2, imag: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> i
              <button onClick={solveComplex} className="btn-solve-now">TÍNH Z</button>
            </div>
            {cplxResult && (
              <div className="eqn-results-box">
                <div>z₁ + z₂ = <strong style={{ color: '#00e5ff' }}>{cplxResult.sum}</strong></div>
                <div>z₁ × z₂ = <strong style={{ color: '#38bdf8' }}>{cplxResult.prod}</strong></div>
                <div>Modun |z₁| = <strong>{cplxResult.mod}</strong> | Dạng cực: <strong>{cplxResult.polar}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Base-N */}
        {mode === 3 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">💻 Hệ Cơ Số & Bitwise (Mode 3)</div>
            <div className="coeff-inputs">
              <label>Số thập phân DEC:</label>
              <input type="number" value={baseNVal} onChange={(e) => setBaseNVal(parseInt(e.target.value) || 0)} style={{ width: 100 }} />
            </div>
            <div className="eqn-results-box">
              <div>DEC (10): <strong style={{ color: '#00e5ff' }}>{baseNVal}</strong></div>
              <div>BIN (2): <strong style={{ color: '#38bdf8' }}>{baseNVal.toString(2)}</strong></div>
              <div>HEX (16): <strong style={{ color: '#f472b6' }}>{baseNVal.toString(16).toUpperCase()}</strong></div>
              <div>OCT (8): <strong style={{ color: '#eab308' }}>{baseNVal.toString(8)}</strong></div>
            </div>
          </div>
        )}

        {/* Mode 4: Matrix */}
        {mode === 4 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">▦ Ma Trận MatA (Mode 4)</div>
            <div className="coeff-inputs">
              <label>Kích thước:</label>
              <button className="btn-solve-now" style={{ padding: '2px 8px' }}>2x2</button>
              <input type="number" value={matA[0][0]} onChange={(e) => setMatA([[parseFloat(e.target.value)||0, matA[0][1]], matA[1]])} style={{ width: 40 }} />
              <input type="number" value={matA[0][1]} onChange={(e) => setMatA([[matA[0][0], parseFloat(e.target.value)||0], matA[1]])} style={{ width: 40 }} />
            </div>
            <div className="coeff-inputs" style={{ marginTop: 4 }}>
              <span style={{ width: 75 }}></span>
              <input type="number" value={matA[1][0]} onChange={(e) => setMatA([matA[0], [parseFloat(e.target.value)||0, matA[1][1]]])} style={{ width: 40 }} />
              <input type="number" value={matA[1][1]} onChange={(e) => setMatA([matA[0], [matA[0][0], parseFloat(e.target.value)||0]])} style={{ width: 40 }} />
              <button onClick={solveMatrix} className="btn-solve-now">TÍNH DET</button>
            </div>
            {matrixResult && (
              <div className="eqn-results-box">
                <div>Định thức det(MatA) = <strong style={{ color: '#00e5ff' }}>{matrixResult.detA}</strong></div>
                <div>Vết tr(MatA) = <strong style={{ color: '#38bdf8' }}>{matrixResult.trA}</strong></div>
                <div>Chuyển vị MatAᵀ = <strong>{matrixResult.transA}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* Mode 5: Vector */}
        {mode === 5 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">↗️ Phép Toán Véc-tơ (Mode 5)</div>
            <div className="coeff-inputs">
              <label>VctA:</label>
              <input type="number" value={vctA[0]} onChange={(e) => setVctA([parseFloat(e.target.value)||0, vctA[1], vctA[2]])} style={{ width: 38 }} />
              <input type="number" value={vctA[1]} onChange={(e) => setVctA([vctA[0], parseFloat(e.target.value)||0, vctA[2]])} style={{ width: 38 }} />
              <input type="number" value={vctA[2]} onChange={(e) => setVctA([vctA[0], vctA[1], parseFloat(e.target.value)||0])} style={{ width: 38 }} />
            </div>
            <div className="coeff-inputs" style={{ marginTop: 4 }}>
              <label>VctB:</label>
              <input type="number" value={vctB[0]} onChange={(e) => setVctB([parseFloat(e.target.value)||0, vctB[1], vctB[2]])} style={{ width: 38 }} />
              <input type="number" value={vctB[1]} onChange={(e) => setVctB([vctB[0], parseFloat(e.target.value)||0, vctB[2]])} style={{ width: 38 }} />
              <input type="number" value={vctB[2]} onChange={(e) => setVctB([vctB[0], vctB[1], parseFloat(e.target.value)||0])} style={{ width: 38 }} />
              <button onClick={solveVector} className="btn-solve-now">TÍNH TÍCH</button>
            </div>
            {vectorResult && (
              <div className="eqn-results-box">
                <div>Tích vô hướng VctA · VctB = <strong style={{ color: '#00e5ff' }}>{vectorResult.dotP}</strong></div>
                <div>Tích có hướng VctA × VctB = <strong style={{ color: '#38bdf8' }}>{vectorResult.crossP}</strong></div>
                <div>Độ dài |VctA| = <strong>{vectorResult.magA}</strong> | Góc = <strong>{vectorResult.angleDeg}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* Mode 6: Stat */}
        {mode === 6 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">📊 Thống Kê & Hồi Quy (Mode 6)</div>
            <div className="coeff-inputs">
              <label>Dữ liệu X:</label>
              <input type="text" value={statPoints} onChange={(e) => setStatPoints(e.target.value)} style={{ width: 170 }} />
            </div>
            <div className="coeff-inputs" style={{ marginTop: 4 }}>
              <label>Dữ liệu Y:</label>
              <input type="text" value={statYPoints} onChange={(e) => setStatYPoints(e.target.value)} style={{ width: 170 }} />
              <button onClick={solveStat} className="btn-solve-now">THỐNG KÊ</button>
            </div>
            {statResult && (
              <div className="eqn-results-box">
                <div>Kích thước mẫu n = <strong style={{ color: '#00e5ff' }}>{statResult.n}</strong> | Trung bình x̄ = <strong style={{ color: '#38bdf8' }}>{statResult.meanX}</strong></div>
                <div>Độ lệch chuẩn σₓ = <strong>{statResult.stdDevX}</strong></div>
                {statResult.regInfo && (
                  <div>Hồi quy y = a + bx: <strong>a = {statResult.regInfo.a}, b = {statResult.regInfo.b} (r = {statResult.regInfo.r})</strong></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 7: Dist */}
        {mode === 7 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">📈 Phân Phối Xác Suất (Mode 7)</div>
            <div className="coeff-inputs">
              <select value={distType} onChange={(e) => setDistType(e.target.value)}>
                <option value="normPD">Normal PD (Chuẩn)</option>
                <option value="binomPD">Binomial PD (Nhị thức)</option>
              </select>
              {distType === 'normPD' ? (
                <>
                  <label>x:</label><input type="number" value={distParams.x} onChange={(e) => setDistParams({...distParams, x: parseFloat(e.target.value)||0})} style={{ width: 36 }} />
                  <label>μ:</label><input type="number" value={distParams.mu} onChange={(e) => setDistParams({...distParams, mu: parseFloat(e.target.value)||0})} style={{ width: 36 }} />
                  <label>σ:</label><input type="number" value={distParams.sigma} onChange={(e) => setDistParams({...distParams, sigma: parseFloat(e.target.value)||1})} style={{ width: 36 }} />
                </>
              ) : (
                <>
                  <label>k:</label><input type="number" value={distParams.k} onChange={(e) => setDistParams({...distParams, k: parseInt(e.target.value)||0})} style={{ width: 34 }} />
                  <label>n:</label><input type="number" value={distParams.n} onChange={(e) => setDistParams({...distParams, n: parseInt(e.target.value)||10})} style={{ width: 34 }} />
                  <label>p:</label><input type="number" value={distParams.p} onChange={(e) => setDistParams({...distParams, p: parseFloat(e.target.value)||0.5})} style={{ width: 38 }} />
                </>
              )}
              <button onClick={solveDist} className="btn-solve-now">TÍNH P</button>
            </div>
            {distResult && (
              <div className="eqn-results-box">
                <strong style={{ color: '#00e5ff', fontSize: '0.9rem' }}>{distResult}</strong>
              </div>
            )}
          </div>
        )}

        {/* Mode 8: Table */}
        {mode === 8 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">📋 Bảng Giá Trị Hàm Số f(X) (Mode 8)</div>
            <div className="coeff-inputs" style={{ marginBottom: 8 }}>
              <label>f(X) =</label>
              <input
                type="text"
                value={tableFunc}
                onChange={(e) => setTableFunc(e.target.value)}
                style={{ width: '180px' }}
              />
            </div>
            <div className="coeff-inputs">
              <label>Start:</label>
              <input type="number" value={tableStart} onChange={(e) => setTableStart(e.target.value)} style={{ width: '50px' }} />
              <label>End:</label>
              <input type="number" value={tableEnd} onChange={(e) => setTableEnd(e.target.value)} style={{ width: '50px' }} />
              <label>Step:</label>
              <input type="number" value={tableStep} onChange={(e) => setTableStep(e.target.value)} style={{ width: '50px' }} />
              <button onClick={generateTable} className="btn-solve-now">TẠO BẢNG</button>
            </div>

            {tableRows && (
              <div className="table-result-box">
                <div style={{ fontSize: '0.75rem', color: '#00e5ff', marginBottom: 4 }}>
                  Max f(X) = <strong>{tableRows.maxVal}</strong> tại X = {tableRows.maxX} | Min f(X) = <strong>{tableRows.minVal}</strong> tại X = {tableRows.minX}
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>X</th>
                        <th>f(X)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.rows.map((r, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{r.x}</td>
                          <td style={{ fontWeight: 600, color: '#38bdf8' }}>{r.y}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 9: EQN */}
        {mode === 9 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">🧮 Giải Phương Trình (Mode 9)</div>
            <div className="mode-controls">
              <div className="control-group">
                <label>Loại:</label>
                <select value={eqnType} onChange={(e) => setEqnType(e.target.value)}>
                  <option value="poly">Phương Trình Bậc N</option>
                  <option value="simul">Hệ Phương Trình 2 Ẩn</option>
                </select>
              </div>

              {eqnType === 'poly' && (
                <div className="control-group">
                  <label>Bậc:</label>
                  <select value={polyDegree} onChange={(e) => setPolyDegree(Number(e.target.value))}>
                    <option value={2}>Bậc 2 (ax² + bx + c = 0)</option>
                  </select>
                </div>
              )}
            </div>

            {eqnType === 'poly' && (
              <div className="coeff-inputs">
                <input type="number" value={polyCoeffs.a} onChange={(e) => setPolyCoeffs({ ...polyCoeffs, a: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> x² +
                <input type="number" value={polyCoeffs.b} onChange={(e) => setPolyCoeffs({ ...polyCoeffs, b: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> x +
                <input type="number" value={polyCoeffs.c} onChange={(e) => setPolyCoeffs({ ...polyCoeffs, c: parseFloat(e.target.value) || 0 })} style={{ width: 44 }} /> = 0
                <button onClick={solvePolynomial} className="btn-solve-now">SOLVE</button>
              </div>
            )}

            {eqnType === 'simul' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="coeff-inputs">
                  <input type="number" value={simulCoeffs.a1} onChange={(e) => setSimulCoeffs({...simulCoeffs, a1: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> x +
                  <input type="number" value={simulCoeffs.b1} onChange={(e) => setSimulCoeffs({...simulCoeffs, b1: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> y =
                  <input type="number" value={simulCoeffs.d1} onChange={(e) => setSimulCoeffs({...simulCoeffs, d1: parseFloat(e.target.value)||0})} style={{ width: 38 }} />
                </div>
                <div className="coeff-inputs">
                  <input type="number" value={simulCoeffs.a2} onChange={(e) => setSimulCoeffs({...simulCoeffs, a2: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> x +
                  <input type="number" value={simulCoeffs.b2} onChange={(e) => setSimulCoeffs({...simulCoeffs, b2: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> y =
                  <input type="number" value={simulCoeffs.d2} onChange={(e) => setSimulCoeffs({...simulCoeffs, d2: parseFloat(e.target.value)||0})} style={{ width: 38 }} />
                  <button onClick={solveSimultaneous} className="btn-solve-now">SOLVE</button>
                </div>
              </div>
            )}

            {eqnResults && (
              <div className="eqn-results-box">
                {eqnResults.simulX ? (
                  <div>Nghiệm: <strong style={{ color: '#00e5ff' }}>x = {eqnResults.simulX}</strong>, <strong style={{ color: '#38bdf8' }}>y = {eqnResults.simulY}</strong></div>
                ) : (
                  <>
                    <div>Nghiệm x₁ = <strong style={{ color: '#00e5ff' }}>{eqnResults.x1}</strong></div>
                    <div>Nghiệm x₂ = <strong style={{ color: '#00e5ff' }}>{eqnResults.x2}</strong></div>
                    {eqnResults.xMin && <div>Đỉnh Parabol = <strong>I({eqnResults.xMin}, {eqnResults.yMin})</strong></div>}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 10: INEQ */}
        {mode === 10 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">⚖️ Giải Bất Phương Trình (Mode 10)</div>
            <div className="coeff-inputs">
              <input type="number" value={ineqCoeffs.a} onChange={(e) => setIneqCoeffs({...ineqCoeffs, a: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> x² +
              <input type="number" value={ineqCoeffs.b} onChange={(e) => setIneqCoeffs({...ineqCoeffs, b: parseFloat(e.target.value)||0})} style={{ width: 38 }} /> x +
              <input type="number" value={ineqCoeffs.c} onChange={(e) => setIneqCoeffs({...ineqCoeffs, c: parseFloat(e.target.value)||0})} style={{ width: 38 }} />
              <select value={ineqSymbol} onChange={(e) => setIneqSymbol(e.target.value)}>
                <option value=">">&gt; 0</option>
                <option value=">=">&ge; 0</option>
                <option value="<">&lt; 0</option>
                <option value="<=">&le; 0</option>
              </select>
              <button onClick={solveInequality} className="btn-solve-now">SOLVE</button>
            </div>
            {ineqResult && (
              <div className="eqn-results-box">
                <div>Nghiệm: <strong style={{ color: '#00e5ff', fontSize: '0.9rem' }}>{ineqResult}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* Mode 11: RATIO */}
        {mode === 11 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">⚖️ Tỷ Lệ Thức A:B = X:D (Mode 11)</div>
            <div className="coeff-inputs">
              <select value={ratioType} onChange={(e) => setRatioType(parseInt(e.target.value))}>
                <option value={1}>A : B = X : D</option>
                <option value={2}>A : B = C : X</option>
              </select>
            </div>
            <div className="coeff-inputs" style={{ marginTop: 4 }}>
              <label>A:</label><input type="number" value={ratioVals.A} onChange={(e) => setRatioVals({...ratioVals, A: parseFloat(e.target.value)||0})} style={{ width: 40 }} />
              <label>B:</label><input type="number" value={ratioVals.B} onChange={(e) => setRatioVals({...ratioVals, B: parseFloat(e.target.value)||0})} style={{ width: 40 }} />
              {ratioType === 1 ? (
                <><label>D:</label><input type="number" value={ratioVals.D} onChange={(e) => setRatioVals({...ratioVals, D: parseFloat(e.target.value)||0})} style={{ width: 40 }} /></>
              ) : (
                <><label>C:</label><input type="number" value={ratioVals.C} onChange={(e) => setRatioVals({...ratioVals, C: parseFloat(e.target.value)||0})} style={{ width: 40 }} /></>
              )}
              <button onClick={solveRatio} className="btn-solve-now">TÍNH X</button>
            </div>
            {ratioResult && (
              <div className="eqn-results-box">
                <strong style={{ color: '#00e5ff', fontSize: '0.95rem' }}>{ratioResult}</strong>
              </div>
            )}
          </div>
        )}

        {/* Calculator Keypad Grid - Authentic Casio fx-580 Matrix */}
        <div className="casio-keypad">
          <div className="top-function-row">
            <button onClick={() => setShift(!shift)} className={`key key-shift ${shift ? 'active' : ''}`}>
              SHIFT
            </button>
            <button onClick={() => setAlpha(!alpha)} className={`key key-alpha ${alpha ? 'active' : ''}`}>
              ALPHA
            </button>

            <div className="dpad-container">
              <button onClick={navigateLeft} className="dpad-btn left" title="Trái">
                <ChevronLeft size={12} />
              </button>
              <button onClick={navigateUp} className="dpad-btn up" title="Lên">
                <ChevronUp size={12} />
              </button>
              <button onClick={navigateDown} className="dpad-btn down" title="Xuống">
                <ChevronDown size={12} />
              </button>
              <button onClick={navigateRight} className="dpad-btn right" title="Phải">
                <ChevronRight size={12} />
              </button>
              <span className="dpad-center-badge">REPLAY</span>
            </div>

            <button onClick={() => handleKeyPress('OPTN')} className="key key-function">OPTN</button>
            <button onClick={() => handleKeyPress('CALC')} className="key key-function">
              <span className="shift-label">SOLVE</span>
              CALC
            </button>
          </div>

          <div className="scientific-keys-grid">
            {/* Row 1: Fraction, Square Root, x^2, x^n, Log, Ln */}
            <button onClick={() => handleKeyPress('a/b')} className="key">
              <span className="shift-label">d/c</span>
              <span className="casio-key-frac"><span>■</span><span>■</span></span>
            </button>
            <button onClick={() => handleKeyPress('√')} className="key">
              <span className="shift-label">³√</span>
              √
            </button>
            <button onClick={() => handleKeyPress('x²')} className="key">
              <span className="shift-label">√</span>
              x²
            </button>
            <button onClick={() => handleKeyPress('xⁿ')} className="key">
              <span className="shift-label">x√</span>
              xⁿ
            </button>
            <button onClick={() => handleKeyPress('log')} className="key">
              <span className="shift-label">10ⁿ</span>
              log
            </button>
            <button onClick={() => handleKeyPress('ln')} className="key">
              <span className="shift-label">eⁿ</span>
              ln
            </button>

            {/* Row 2: (-), DEG/MIN/SEC, x^-1, sin, cos, tan */}
            <button onClick={() => handleKeyPress('(-)')} className="key">
              <span className="alpha-label">A</span>
              (-)
            </button>
            <button onClick={() => handleKeyPress('°\'"')} className="key">
              <span className="alpha-label">B</span>
              ° ' "
            </button>
            <button onClick={() => handleKeyPress('x⁻¹')} className="key">
              <span className="shift-label">x!</span>
              <span className="alpha-label">C</span>
              x⁻¹
            </button>
            <button onClick={() => handleKeyPress('sin')} className="key">
              <span className="shift-label">sin⁻¹</span>
              <span className="alpha-label">D</span>
              sin
            </button>
            <button onClick={() => handleKeyPress('cos')} className="key">
              <span className="shift-label">cos⁻¹</span>
              <span className="alpha-label">E</span>
              cos
            </button>
            <button onClick={() => handleKeyPress('tan')} className="key">
              <span className="shift-label">tan⁻¹</span>
              <span className="alpha-label">F</span>
              tan
            </button>

            {/* Row 3: STO, ENG, (, ), S<=>D, M+ */}
            <button onClick={() => handleKeyPress('STO')} className="key">
              <span className="shift-label">RCL</span>
              STO
            </button>
            <button onClick={() => handleKeyPress('ENG')} className="key">
              <span className="alpha-label">Y</span>
              ENG
            </button>
            <button onClick={() => handleKeyPress('(')} className="key">
              <span className="shift-label">%</span>
              (
            </button>
            <button onClick={() => handleKeyPress(')')} className="key">
              <span className="shift-label">,</span>
              <span className="alpha-label">X</span>
              )
            </button>
            <button onClick={() => handleKeyPress('S⇔D')} className="key">
              <span className="alpha-label">:</span>
              S⇔D
            </button>
            <button onClick={() => handleKeyPress('M+')} className="key">
              <span className="alpha-label">M</span>
              M+
            </button>

            {/* Row 4: CONST, ∫dx, Pol, FACT, i, Ans */}
            <button onClick={() => handleKeyPress('CONST')} className="key">
              <span className="shift-label">CONV</span>
              CONST
            </button>
            <button onClick={() => handleKeyPress('∫dx')} className="key">
              <span className="shift-label">d/dx</span>
              ∫dx
            </button>
            <button onClick={() => handleKeyPress('Pol')} className="key">
              <span className="shift-label">Rec</span>
              Pol
            </button>
            <button onClick={() => handleKeyPress('FACT')} className="key">
              <span className="shift-label">Ran#</span>
              FACT
            </button>
            <button onClick={() => handleKeyPress('i')} className="key">
              <span className="shift-label">∠</span>
              i
            </button>
            <button onClick={() => handleKeyPress('Ans')} className="key">
              <span className="shift-label">PreAns</span>
              Ans
            </button>
          </div>

          <div className="number-keys-grid">
            <button onClick={() => handleKeyPress('7')} className="key key-num">
              <span className="alpha-label">A</span>
              7
            </button>
            <button onClick={() => handleKeyPress('8')} className="key key-num">
              <span className="alpha-label">B</span>
              8
            </button>
            <button onClick={() => handleKeyPress('9')} className="key key-num">
              <span className="alpha-label">C</span>
              9
            </button>
            <button onClick={handleDel} className="key key-del">DEL</button>
            <button onClick={handleAC} className="key key-ac">AC</button>

            <button onClick={() => handleKeyPress('4')} className="key key-num">
              <span className="alpha-label">D</span>
              4
            </button>
            <button onClick={() => handleKeyPress('5')} className="key key-num">
              <span className="alpha-label">E</span>
              5
            </button>
            <button onClick={() => handleKeyPress('6')} className="key key-num">
              <span className="alpha-label">F</span>
              6
            </button>
            <button onClick={() => handleKeyPress('×')} className="key key-op">
              <span className="shift-label">nPr</span>
              ×
            </button>
            <button onClick={() => handleKeyPress('÷')} className="key key-op">
              <span className="shift-label">nCr</span>
              ÷
            </button>

            <button onClick={() => handleKeyPress('1')} className="key key-num">
              <span className="alpha-label">X</span>
              1
            </button>
            <button onClick={() => handleKeyPress('2')} className="key key-num">
              <span className="alpha-label">Y</span>
              2
            </button>
            <button onClick={() => handleKeyPress('3')} className="key key-num">
              <span className="alpha-label">Z</span>
              3
            </button>
            <button onClick={() => handleKeyPress('+')} className="key key-op">+</button>
            <button onClick={() => handleKeyPress('-')} className="key key-op">-</button>

            <button onClick={() => handleKeyPress('0')} className="key key-num">
              <span className="alpha-label">M</span>
              0
            </button>
            <button onClick={() => handleKeyPress('.')} className="key key-num">
              <span className="shift-label">Ran#</span>
              .
            </button>
            <button onClick={() => handleKeyPress('×10ⁿ')} className="key key-num">
              <span className="shift-label">π</span>
              ×10ⁿ
            </button>
            <button onClick={() => handleKeyPress('Ans')} className="key key-num">
              <span className="shift-label">PreAns</span>
              Ans
            </button>
            <button onClick={handleCalculate} className="key key-equals">=</button>
          </div>
        </div>
      </div>

      {/* Mode Menu Modal Overlay */}
      {showModeMenu && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModeMenu(false); }}>
          <div className="casio-modal animate-pop">
            <div className="modal-header">
              <h3>CHỌN CHẾ ĐỘ (MENU / MODE)</h3>
              <button onClick={() => setShowModeMenu(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="mode-grid">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setShowModeMenu(false);
                    playKeySound();
                  }}
                  className={`mode-card ${mode === m.id ? 'active' : ''}`}
                >
                  <span className="mode-icon">{m.icon}</span>
                  <div className="mode-info">
                    <strong>{m.label}</strong>
                    <p>{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OPTN Options Menu Modal */}
      {showOptnMenu && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowOptnMenu(false); }}>
          <div className="casio-modal animate-pop" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3>TÙY CHỌN OPTN (Mode {mode})</h3>
              <button onClick={() => setShowOptnMenu(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="const-list">
              {mode === 1 && (
                <>
                  <button onClick={() => { setDisplayExpr(p => p + 'sinh('); setShowOptnMenu(false); }} className="const-item">
                    <span className="const-sym">sinh</span>
                    <span className="const-name">Hàm Hyperbolic sin</span>
                  </button>
                  <button onClick={() => { setDisplayExpr(p => p + 'cosh('); setShowOptnMenu(false); }} className="const-item">
                    <span className="const-sym">cosh</span>
                    <span className="const-name">Hàm Hyperbolic cos</span>
                  </button>
                  <button onClick={() => { setDisplayExpr(p => p + 'tanh('); setShowOptnMenu(false); }} className="const-item">
                    <span className="const-sym">tanh</span>
                    <span className="const-name">Hàm Hyperbolic tan</span>
                  </button>
                </>
              )}

              {mode === 2 && (
                <>
                  <button onClick={() => { setDisplayExpr(p => p + 'i'); setShowOptnMenu(false); }} className="const-item">
                    <span className="const-sym">i</span>
                    <span className="const-name">Đơn vị ảo</span>
                  </button>
                  <button onClick={() => { setDisplayExpr(p => p + '∠'); setShowOptnMenu(false); }} className="const-item">
                    <span className="const-sym">∠</span>
                    <span className="const-name">Góc Phase</span>
                  </button>
                </>
              )}

              {(mode !== 1 && mode !== 2) && (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '10px' }}>Chế độ này đã có bảng điều khiển trực quan riêng bên dưới màn hình.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Variables RECALL Modal (SHIFT + STO) */}
      {showVarsModal && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowVarsModal(false); }}>
          <div className="casio-modal animate-pop" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3><Database size={16} /> BẢNG GIÁ TRỊ BIẾN NHỚ (RECALL)</h3>
              <button onClick={() => setShowVarsModal(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setDisplayExpr(p => p + vars[v]);
                    setShowVarsModal(false);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 800 }}>{v} =</div>
                  <div style={{ fontSize: '0.9rem', color: '#00e5ff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vars[v]}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setVars({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0, Ans: 0, PreAns: 0 });
                setShowVarsModal(false);
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Tất Cả Biến Về 0
            </button>
          </div>
        </div>
      )}

      {/* Physical Constants Modal */}
      {showConstMenu && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowConstMenu(false); }}>
          <div className="casio-modal animate-pop">
            <div className="modal-header">
              <h3>HẰNG SỐ VẬT LÝ & HÓA HỌC (CONST)</h3>
              <button onClick={() => setShowConstMenu(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="const-list">
              {PHYSICAL_CONSTANTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setDisplayExpr(prev => prev + c.val);
                    setShowConstMenu(false);
                    playKeySound();
                  }}
                  className="const-item"
                >
                  <span className="const-sym">{c.symbol}</span>
                  <div className="const-name">{c.name}</div>
                  <span className="const-val">{c.val} {c.unit}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unit Conversion Modal */}
      {showConvMenu && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowConvMenu(false); }}>
          <div className="casio-modal animate-pop">
            <div className="modal-header">
              <h3>ĐỔI ĐƠN VỊ ĐO LƯỜNG (CONV)</h3>
              <button onClick={() => setShowConvMenu(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="const-list">
              {UNIT_CONVERSIONS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDisplayExpr(prev => prev + `*(${c.ratio})`);
                    setShowConvMenu(false);
                    playKeySound();
                  }}
                  className="const-item"
                >
                  <span className="const-sym">{c.from} → {c.to}</span>
                  <div className="const-name">Nhóm: {c.group}</div>
                  <span className="const-val">Hệ số x{c.ratio}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step by Step Solution Modal */}
      {showStepByStepModal && stepSolution && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowStepByStepModal(false); }}>
          <div className="casio-modal animate-pop" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3><Sparkles size={18} style={{ color: '#00e5ff' }} /> {stepSolution.title}</h3>
              <button onClick={() => setShowStepByStepModal(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="solution-content">
              {stepSolution.steps.map((st, idx) => (
                <div key={idx} className="solution-step">
                  {st}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THPT Exam Cheat Sheet Modal */}
      {showGuideModal && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGuideModal(false); }}>
          <div className="casio-modal animate-pop" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3><BookOpen size={18} /> MẸO BẤM MÁY CASIO 580 THI THPT QUỐC GIA</h3>
              <button onClick={() => setShowGuideModal(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="guide-content">
              <div className="guide-section">
                <h4>📐 Môn Toán: Tìm GTLN / GTNN trên đoạn [a, b]</h4>
                <p>👉 Vào <strong>MENU 8 (TABLE)</strong> ➔ Nhập hàm f(X) ➔ Start: a, End: b, Step: (b - a) / 29 ➔ Xem cột f(X) tìm min/max.</p>
              </div>

              <div className="guide-section">
                <h4>⚡ Môn Vật Lý: Tổng hợp Dao động điều hòa & Điện xoay chiều</h4>
                <p>👉 Vào <strong>MENU 2 (CMPLX)</strong> ➔ Chuyển dạng r∠θ (SHIFT 2 3) ➔ Nhập $A_1 \angle \varphi_1 + A_2 \angle \varphi_2$ ➔ Phím = cho kết quả biên độ A và pha ban đầu φ ngay lập tức!</p>
              </div>

              <div className="guide-section">
                <h4>🧪 Môn Hóa Học: Giải Hệ Phương Trình 3-4 Ẩn (Bảo toàn E, C, H)</h4>
                <p>👉 Vào <strong>MENU 9 ➔ 1 (Simul Equation)</strong> ➔ Chọn 3 hoặc 4 ẩn ➔ Nhập hệ ma trận hệ số ➔ Phím = cho nghiệm n, m, p, q.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="casio-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}>
          <div className="casio-modal animate-pop" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>LỊCH SỬ TÍNH TOÁN ({history.length})</h3>
              <button onClick={() => setShowHistoryModal(false)} className="close-btn"><X size={18} /></button>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Chưa có phép tính nào trong lịch sử.</p>
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setDisplayExpr(h.expr);
                      setShowHistoryModal(false);
                    }}
                    className="history-item"
                  >
                    <span className="hist-expr">{h.expr}</span>
                    <strong className="hist-res">= {h.res}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
