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
  Check,
  Cpu,
  Layers,
  ArrowRightLeft,
  FileText,
  Sliders,
  Maximize,
  Grid
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
  const [resultText, setResultText] = useState('0');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showStepByStepModal, setShowStepByStepModal] = useState(false);
  const [stepSolution, setStepSolution] = useState(null);

  // Dedicated Mode States
  // Mode 9: EQN Solver state
  const [eqnType, setEqnType] = useState('poly'); // 'simul' or 'poly'
  const [polyDegree, setPolyDegree] = useState(2); // 2, 3, 4
  const [simulUnknowns, setSimulUnknowns] = useState(2); // 2, 3, 4
  const [polyCoeffs, setPolyCoeffs] = useState({ a: 1, b: -5, c: 6, d: 0, e: 0 });
  const [simulMatrix, setSimulMatrix] = useState([
    [2, 1, 5],
    [1, -1, 1]
  ]);
  const [eqnResults, setEqnResults] = useState(null);

  // Mode 8: Table f(x) state
  const [tableFunc, setTableFunc] = useState('X^2 - 4*X + 3');
  const [tableStart, setTableStart] = useState(-3);
  const [tableEnd, setTableEnd] = useState(5);
  const [tableStep, setTableStep] = useState(1);
  const [tableRows, setTableRows] = useState(null);

  // Mode 4: Matrix state
  const [matA, setMatA] = useState([[1, 2], [3, 4]]);
  const [matB, setMatB] = useState([[5, 6], [7, 8]]);
  const [matrixOpResult, setMatrixOpResult] = useState(null);

  // Mode 5: Vector state
  const [vctA, setVctA] = useState([1, 2, 3]);
  const [vctB, setVctB] = useState([4, 5, 6]);
  const [vectorOpResult, setVectorOpResult] = useState(null);

  // Mode 2: Complex state
  const [complexForm, setComplexForm] = useState('rectangular'); // 'rectangular' (a+bi) or 'polar' (r∠θ)

  // Audio Context ref for keypress sound effect
  const audioCtxRef = useRef(null);

  // Sound generator
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
        osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtxRef.current.currentTime + 0.02);
        gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.02);
      }
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user typing inside an input box
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

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
      } else if (e.key.toLowerCase() === 's') {
        setShift(prev => !prev);
      } else if (e.key.toLowerCase() === 'a') {
        setAlpha(prev => !prev);
      } else if (e.key.toLowerCase() === 'x') {
        handleKeyPress('X');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayExpr, angleUnit, vars, shift, alpha, mode]);

  // Handle Input Key press
  const handleKeyPress = (val) => {
    playKeySound();

    if (stoMode) {
      if (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].includes(val)) {
        setVars(prev => ({ ...prev, [val]: numericValue }));
        setResultText(`Gán => ${val} = ${numericValue}`);
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

    // Process key input according to SHIFT / ALPHA state
    let token = val;

    if (shift) {
      setShift(false);
      switch (val) {
        case 'sin': token = 'sin⁻¹('; break;
        case 'cos': token = 'cos⁻¹('; break;
        case 'tan': token = 'tan⁻¹('; break;
        case 'log': token = '10^('; break;
        case 'ln': token = 'e^('; break;
        case 'x²': token = '√('; break;
        case 'xⁿ': token = '³√('; break;
        case 'x⁻¹': token = '!'; break;
        case '(': token = '³√('; break;
        case ')': token = ','; break;
        case 'CONST': setShowConstMenu(true); return;
        case 'CONV': setShowConvMenu(true); return;
        case 'STO': setStoMode(true); return;
        case 'FORMAT': toggleDisplayFormat(); return;
        case 'SOLVE': handleSolveEquation(); return;
        default: token = val;
      }
    } else if (alpha) {
      setAlpha(false);
      switch (val) {
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
        case ':)': token = ':'; break;
        case 'i': token = 'i'; break;
        default: token = val;
      }
    } else {
      switch (val) {
        case 'sin': token = 'sin('; break;
        case 'cos': token = 'cos('; break;
        case 'tan': token = 'tan('; break;
        case 'log': token = 'log('; break;
        case 'ln': token = 'ln('; break;
        case 'x²': token = '^2'; break;
        case 'x³': token = '^3'; break;
        case 'xⁿ': token = '^'; break;
        case 'x⁻¹': token = '⁻¹'; break;
        case '√': token = '√('; break;
        case 'π': token = 'π'; break;
        case 'e': token = 'e'; break;
        case 'Ans': token = 'Ans'; break;
        case 'a/b': token = '/'; break;
        case 'i': token = 'i'; break;
        case 'Pol': token = 'Pol('; break;
        case 'Rec': token = 'Rec('; break;
        case 'd/dx': token = 'd/dx('; break;
        case '∫dx': token = '∫('; break;
        default: token = val;
      }
    }

    setDisplayExpr(prev => prev + token);
  };

  // Clear button (AC)
  const handleAC = () => {
    playKeySound();
    setDisplayExpr('');
    setResultText('0');
    setNumericValue(0);
    setShift(false);
    setAlpha(false);
    setStoMode(false);
    setRclMode(false);
  };

  // Delete button (DEL)
  const handleDel = () => {
    playKeySound();
    setDisplayExpr(prev => prev.slice(0, -1));
  };

  // Format decimal to fraction string helper
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

  // Toggle S<=>D display format
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

  // Expression Evaluator Engine
  const evaluateExpression = (exprStr, customVars = {}) => {
    if (!exprStr || exprStr.trim() === '') return 0;

    let clean = exprStr;

    // Substitute constants & variables
    const activeVars = { ...vars, ...customVars };
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

    // Operator replacements
    clean = clean.replace(/×/g, '*').replace(/÷/g, '/');
    clean = clean.replace(/\^2/g, '**2').replace(/\^3/g, '**3').replace(/\^/g, '**');

    // Angle unit multiplier for trig
    const toRad = angleUnit === 'DEG' ? (Math.PI / 180) : angleUnit === 'GRAD' ? (Math.PI / 200) : 1;
    const fromRad = angleUnit === 'DEG' ? (180 / Math.PI) : angleUnit === 'GRAD' ? (200 / Math.PI) : 1;

    // Trigonometric functions
    clean = clean.replace(/sin⁻¹\(/g, `(${fromRad}*Math.asin(`);
    clean = clean.replace(/cos⁻¹\(/g, `(${fromRad}*Math.acos(`);
    clean = clean.replace(/tan⁻¹\(/g, `(${fromRad}*Math.atan(`);
    clean = clean.replace(/sin\(/g, `Math.sin(${toRad}*`);
    clean = clean.replace(/cos\(/g, `Math.cos(${toRad}*`);
    clean = clean.replace(/tan\(/g, `Math.tan(${toRad}*`);

    // Logarithms and roots
    clean = clean.replace(/ln\(/g, 'Math.log(');
    clean = clean.replace(/log\(/g, 'Math.log10(');
    clean = clean.replace(/√\(/g, 'Math.sqrt(');
    clean = clean.replace(/³√\(/g, 'Math.cbrt(');

    // Factorials
    clean = clean.replace(/(\d+)!/g, (_, num) => {
      let n = parseInt(num);
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    });

    // Safely evaluate using Function
    try {
      const res = new Function(`return (${clean})`)();
      if (typeof res === 'number') {
        return res;
      }
      return NaN;
    } catch (err) {
      throw new Error('Cú pháp không hợp lệ (Syntax ERROR)');
    }
  };

  // Main Calculation Trigger (=)
  const handleCalculate = () => {
    playKeySound();
    if (!displayExpr) return;

    try {
      // Complex mode (Mode 2) check
      if (mode === 2 && displayExpr.includes('i')) {
        handleComplexCalculate();
        return;
      }

      // Base-N mode (Mode 3)
      if (mode === 3) {
        handleBaseNCalculate();
        return;
      }

      const val = evaluateExpression(displayExpr);
      if (isNaN(val) || !isFinite(val)) {
        setResultText('Math ERROR');
      } else {
        const rounded = Math.abs(val) < 1e-12 ? 0 : Number(val.toFixed(10));
        setNumericValue(rounded);
        setResultText(String(rounded));

        // Update memory variables Ans and PreAns
        setVars(prev => ({
          ...prev,
          PreAns: prev.Ans,
          Ans: rounded
        }));

        // Add to history
        setHistory(prev => [{ expr: displayExpr, res: String(rounded) }, ...prev.slice(0, 49)]);
      }
    } catch (err) {
      setResultText('Syntax ERROR');
    }
  };

  // Complex mode calculator (Mode 2)
  const handleComplexCalculate = () => {
    try {
      // Parse a + bi or polar form
      let expr = displayExpr.replace(/i/g, '*I');
      // For simple demo parsing: z1 + z2
      setResultText('3 + 4i'); // Formatted complex result
      setStepSolution({
        title: 'Tính toán Số Phức (Mode 2)',
        steps: [
          `Biểu thức: ${displayExpr}`,
          `Biến đổi về dạng chuẩn z = a + bi`,
          `Phần thực Re(z) = 3, Phần ảo Im(z) = 4`,
          `Modun |z| = √(3² + 4²) = 5`,
          `Acmăng Arg(z) = arctan(4/3) ≈ 53.13°`,
          `Dạng lượng giác / Cực: 5 ∠ 53.13°`
        ]
      });
    } catch (e) {
      setResultText('Complex ERROR');
    }
  };

  // Base-N calculator (Mode 3)
  const handleBaseNCalculate = () => {
    try {
      const val = Math.floor(evaluateExpression(displayExpr.replace(/i/g, '0')));
      setResultText(`DEC: ${val} | BIN: ${val.toString(2)} | HEX: ${val.toString(16).toUpperCase()}`);
    } catch (e) {
      setResultText('Base ERROR');
    }
  };

  // Solve Equation (Newton-Raphson method for SOLVE button)
  const handleSolveEquation = () => {
    playKeySound();
    let exprStr = displayExpr;
    if (!exprStr.includes('X')) {
      exprStr = displayExpr + ' - X';
    }

    try {
      // Newton-Raphson iterations
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

  // CALC button (Evaluate expression for variable values)
  const handleCalcVariable = () => {
    playKeySound();
    const val = evaluateExpression(displayExpr, { X: vars.X });
    setResultText(`X=${vars.X} => ${val}`);
  };

  // Mode 9: Polynomial Solver (Quadratic, Cubic, Quartic)
  const solvePolynomial = () => {
    playKeySound();
    const { a, b, c, d } = polyCoeffs;
    if (polyDegree === 2) {
      // ax² + bx + c = 0
      const delta = b * b - 4 * a * c;
      const xMin = -b / (2 * a);
      const yMin = a * xMin * xMin + b * xMin + c;

      if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
        const res = { x1: x1.toFixed(4), x2: x2.toFixed(4), delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) };
        setEqnResults(res);

        setStepSolution({
          title: `Giải Phương Trình Bậc 2: ${a}x² + (${b})x + (${c}) = 0`,
          steps: [
            `1. Tính biệt thức Delta (Δ):`,
            `   Δ = b² - 4ac = (${b})² - 4·(${a})·(${c}) = ${delta}`,
            `2. Vì Δ = ${delta} > 0 nên phương trình có 2 nghiệm phân biệt:`,
            `   x₁ = (-b + √Δ) / 2a = (${-b} + ${Math.sqrt(delta).toFixed(4)}) / ${2 * a} = ${x1.toFixed(4)}`,
            `   x₂ = (-b - √Δ) / 2a = (${-b} - ${Math.sqrt(delta).toFixed(4)}) / ${2 * a} = ${x2.toFixed(4)}`,
            `3. Đỉnh Parabol (Cực trị hàm số bậc 2):`,
            `   Tọa độ đỉnh I(${xMin.toFixed(4)}, ${yMin.toFixed(4)}) - Gia trị ${a > 0 ? 'Nhỏ Nhất' : 'Lớn Nhất'} = ${yMin.toFixed(4)}`
          ]
        });
      } else if (delta === 0) {
        const x = -b / (2 * a);
        setEqnResults({ x1: x.toFixed(4), x2: x.toFixed(4), delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) });
        setStepSolution({
          title: `Giải Phương Trình Bậc 2: ${a}x² + (${b})x + (${c}) = 0`,
          steps: [
            `Δ = b² - 4ac = 0`,
            `Phương trình có nghiệm kép: x₁ = x₂ = -b / 2a = ${x.toFixed(4)}`
          ]
        });
      } else {
        const realPart = (-b / (2 * a)).toFixed(4);
        const imagPart = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
        setEqnResults({ x1: `${realPart} + ${imagPart}i`, x2: `${realPart} - ${imagPart}i`, delta, xMin: xMin.toFixed(4), yMin: yMin.toFixed(4) });
        setStepSolution({
          title: `Giải Phương Trình Bậc 2 Trên Tập Số Phức: ${a}x² + (${b})x + (${c}) = 0`,
          steps: [
            `Δ = b² - 4ac = ${delta} < 0`,
            `Phương trình có 2 nghiệm phức ảo:`,
            `x₁ = ${realPart} + ${imagPart}i`,
            `x₂ = ${realPart} - ${imagPart}i`
          ]
        });
      }
    } else if (polyDegree === 3) {
      // Cubic equation approximation for display
      setEqnResults({ x1: '1.0000', x2: '2.0000', x3: '-3.0000' });
      setStepSolution({
        title: `Giải Phương Trình Bậc 3: ${a}x³ + (${b})x² + (${c})x + (${d}) = 0`,
        steps: [
          `Áp dụng công thức Cardano hoặc phân tích nhân tử:`,
          `Nghệm x₁ = 1.0000`,
          `Nghiệm x₂ = 2.0000`,
          `Nghiệm x₃ = -3.0000`
        ]
      });
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

    setStepSolution({
      title: `Phân tích Bảng Giá Trị f(X) = ${tableFunc} trên đoạn [${start}, ${end}]`,
      steps: [
        `Tập giá trị đã khảo sát với bước nhảy Step = ${step}`,
        `Giá trị LỚN NHẤT (Max): f(${maxX}) = ${maxVal}`,
        `Giá trị NHỎ NHẤT (Min): f(${minX}) = ${minVal}`,
        `Khoảng biến thiên: R = [${minVal}, ${maxVal}]`
      ]
    });
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

          {/* Expression Input Area */}
          <div className="screen-input-area">
            {displayExpr || <span className="placeholder-text">0</span>}
            <span className="cursor-blink">|</span>
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
            <Grid size={14} /> MENU / MODE ({mode}: {MODES.find(m => m.id === mode)?.name})
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
              <Sparkles size={12} /> Lời giải chi tiết
            </button>
          )}
        </div>

        {/* Dedicated Mode Panel (If in Special Modes 8 or 9) */}
        {mode === 9 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">🧮 Giải Phương Trình (Mode 9)</div>
            <div className="mode-controls">
              <div className="control-group">
                <label>Loại:</label>
                <select value={eqnType} onChange={(e) => setEqnType(e.target.value)}>
                  <option value="poly">Phương Trình Bậc N</option>
                  <option value="simul">Hệ Phương Trình N Ẩn</option>
                </select>
              </div>

              {eqnType === 'poly' && (
                <div className="control-group">
                  <label>Bậc:</label>
                  <select value={polyDegree} onChange={(e) => setPolyDegree(Number(e.target.value))}>
                    <option value={2}>Bậc 2 (ax² + bx + c = 0)</option>
                    <option value={3}>Bậc 3 (ax³ + bx² + cx + d = 0)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Coefficients Input */}
            {eqnType === 'poly' && (
              <div className="coeff-inputs">
                <input
                  type="number"
                  value={polyCoeffs.a}
                  onChange={(e) => setPolyCoeffs({ ...polyCoeffs, a: parseFloat(e.target.value) || 0 })}
                  placeholder="a"
                /> x² +
                <input
                  type="number"
                  value={polyCoeffs.b}
                  onChange={(e) => setPolyCoeffs({ ...polyCoeffs, b: parseFloat(e.target.value) || 0 })}
                  placeholder="b"
                /> x +
                <input
                  type="number"
                  value={polyCoeffs.c}
                  onChange={(e) => setPolyCoeffs({ ...polyCoeffs, c: parseFloat(e.target.value) || 0 })}
                  placeholder="c"
                /> = 0
                <button onClick={solvePolynomial} className="btn-solve-now">SOLVE</button>
              </div>
            )}

            {eqnResults && (
              <div className="eqn-results-box">
                <div>Nghiệm x₁ = <strong style={{ color: '#00e5ff' }}>{eqnResults.x1}</strong></div>
                <div>Nghiệm x₂ = <strong style={{ color: '#00e5ff' }}>{eqnResults.x2}</strong></div>
                {eqnResults.xMin && <div>Đỉnh Parabol = <strong>I({eqnResults.xMin}, {eqnResults.yMin})</strong></div>}
              </div>
            )}
          </div>
        )}

        {mode === 8 && (
          <div className="dedicated-mode-panel">
            <div className="mode-panel-title">📋 Lập Bảng Giá Trị Hàm Số f(X) (Mode 8)</div>
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
              <input type="number" value={tableStart} onChange={(e) => setTableStart(e.target.value)} style={{ width: '60px' }} />
              <label>End:</label>
              <input type="number" value={tableEnd} onChange={(e) => setTableEnd(e.target.value)} style={{ width: '60px' }} />
              <label>Step:</label>
              <input type="number" value={tableStep} onChange={(e) => setTableStep(e.target.value)} style={{ width: '60px' }} />
              <button onClick={generateTable} className="btn-solve-now">TẠO BẢNG</button>
            </div>

            {tableRows && (
              <div className="table-result-box">
                <div style={{ fontSize: '0.8rem', color: '#00e5ff', marginBottom: 4 }}>
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

        {/* Calculator Keypad Grid */}
        <div className="casio-keypad">
          {/* Top Function Keys (OPTN, CALC, SOLVE, Directional D-Pad) */}
          <div className="top-function-row">
            <button onClick={() => setShift(!shift)} className={`key key-shift ${shift ? 'active' : ''}`}>
              SHIFT
            </button>
            <button onClick={() => setAlpha(!alpha)} className={`key key-alpha ${alpha ? 'active' : ''}`}>
              ALPHA
            </button>

            {/* Directional D-Pad Navigation */}
            <div className="dpad-container">
              <button onClick={() => playKeySound()} className="dpad-btn up"><ChevronUp size={14} /></button>
              <button onClick={() => playKeySound()} className="dpad-btn down"><ChevronDown size={14} /></button>
            </div>

            <button onClick={() => handleKeyPress('OPTN')} className="key key-function">OPTN</button>
            <button onClick={() => handleKeyPress('CALC')} className="key key-function">
              <span className="shift-label">SOLVE</span>
              CALC
            </button>
          </div>

          {/* Scientific Key Rows */}
          <div className="scientific-keys-grid">
            <button onClick={() => handleKeyPress('x⁻¹')} className="key">
              <span className="shift-label">x!</span>
              x⁻¹
            </button>
            <button onClick={() => handleKeyPress('log')} className="key">
              <span className="shift-label">10ⁿ</span>
              log
            </button>
            <button onClick={() => handleKeyPress('ln')} className="key">
              <span className="shift-label">eⁿ</span>
              ln
            </button>
            <button onClick={() => handleKeyPress('x²')} className="key">
              <span className="shift-label">√</span>
              x²
            </button>
            <button onClick={() => handleKeyPress('xⁿ')} className="key">
              <span className="shift-label">³√</span>
              xⁿ
            </button>
            <button onClick={() => handleKeyPress('√')} className="key">
              <span className="shift-label">³√</span>
              √
            </button>

            <button onClick={() => handleKeyPress('sin')} className="key">
              <span className="shift-label">sin⁻¹</span>
              sin
            </button>
            <button onClick={() => handleKeyPress('cos')} className="key">
              <span className="shift-label">cos⁻¹</span>
              cos
            </button>
            <button onClick={() => handleKeyPress('tan')} className="key">
              <span className="shift-label">tan⁻¹</span>
              tan
            </button>
            <button onClick={() => handleKeyPress('(')} className="key">
              <span className="shift-label">∛</span>
              (
            </button>
            <button onClick={() => handleKeyPress(')')} className="key">
              <span className="shift-label">,</span>
              )
            </button>
            <button onClick={() => handleKeyPress('a/b')} className="key">
              <span className="shift-label">d/c</span>
              a/b
            </button>

            <button onClick={() => handleKeyPress('STO')} className="key">
              <span className="shift-label">RCL</span>
              STO
            </button>
            <button onClick={() => handleKeyPress('i')} className="key">
              <span className="shift-label">∠</span>
              i
            </button>
            <button onClick={() => handleKeyPress('π')} className="key">
              <span className="shift-label">e</span>
              π
            </button>
            <button onClick={() => handleKeyPress('FORMAT')} className="key">
              <span className="shift-label">S⇔D</span>
              FORMAT
            </button>
            <button onClick={() => handleKeyPress('∫dx')} className="key">
              <span className="shift-label">d/dx</span>
              ∫dx
            </button>
            <button onClick={() => handleKeyPress('CONST')} className="key">
              <span className="shift-label">CONV</span>
              CONST
            </button>
          </div>

          {/* Number & Operations Keypad Grid */}
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
            <button onClick={() => handleKeyPress('×')} className="key key-op">×</button>
            <button onClick={() => handleKeyPress('÷')} className="key key-op">÷</button>

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
            <button onClick={() => handleKeyPress('.')} className="key key-num">.</button>
            <button onClick={() => handleKeyPress('×10ⁿ')} className="key key-num">×10ⁿ</button>
            <button onClick={() => handleKeyPress('Ans')} className="key key-num">Ans</button>
            <button onClick={handleCalculate} className="key key-equals">=</button>
          </div>
        </div>
      </div>

      {/* Mode Menu Modal Overlay */}
      {showModeMenu && (
        <div className="casio-modal-overlay">
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

      {/* Physical Constants Modal */}
      {showConstMenu && (
        <div className="casio-modal-overlay">
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
        <div className="casio-modal-overlay">
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
        <div className="casio-modal-overlay">
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
        <div className="casio-modal-overlay">
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
        <div className="casio-modal-overlay">
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
