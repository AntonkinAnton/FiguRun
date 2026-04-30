// ═══════════════════════════════════════
//  state.js — все общие изменяемые переменные
//  Загружается после config.js
// ═══════════════════════════════════════

// Canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Игрок
let player = {
    x: 110, y: 620, size: 48, vy: 0, rotation: 0,
    grounded: true, jumpsLeft: 2,
    shield: false, shieldTimer: 0,
    superJumpTimer: 0, speedBoostTimer: 0,
    growTimer: 0, growScale: 1,
    shrinkGrace: 0,          // неуязвимость после окончания grow
    megaGrow: false,         // режим двойного grow
    onLift: null, prevLiftY: 0,
    onSlide: null,
    dead: false, deathAnim: null
};

// Игровое состояние
let baseSpeed = 4.85;
let currentSpeed = baseSpeed;
let platforms = [];
let hazards = [];
let particles = [];
let freeCoins = [];
let cameraX = 0;
let score = 0;
let totalCoins = 0;

// ── СОХРАНЕНИЕ ─────────────────────────
function loadSave() {
    let s = JSON.parse(localStorage.getItem('fg_save') || 'null');
    if (!s) {
        s = {
            highScore: parseInt(localStorage.getItem('cubeRunnerHS') || '0'),
            allTimeCoins: parseInt(localStorage.getItem('cubeRunnerATC') || '0'),
            lcdCharges: 0,
            lives: 0,
        };
        localStorage.setItem('fg_save', JSON.stringify(s));
    }
    s.lcdCharges = s.lcdCharges || 0;
    s.lives = s.lives || 0;
    return s;
}
function saveSave() {
    localStorage.setItem('fg_save', JSON.stringify(save));
}

// Рекорды (localStorage)
let save         = loadSave();
let highScore    = save.highScore;
// let highCoins    = 0;
let allTimeCoins = save.allTimeCoins;
// ── ИНВЕНТАРЬ LCD ──────────────────────
let lcdInventory    = save.lcdCharges;
let lcdPickups      = [];  // массив пикапов в мире {x, y, collected}
let lcdPickupCount  = 0;   // счётчик за ран

// Ghost-trail буферы
let trailBuf = [];
let speedTrailBuf = [];

// Сотрясение экрана
let screenShake = 0;

// Loop control
let loopRunning = false;
let gameRunning = false;
let paused = false;
let lastPlatformEnd = 0;

// Бустер-трекер
let boosterState = { lastType: null, platformsSinceLast: 0, minInterval: 4, maxInterval: 9 };
let nextBoosterIn = 5;
// Счётчики выпадений бустеров за текущий ран
let boosterRunCount = { jump: 0, speed: 0, shield: 0, grow: 0 };
// Флаг: следующий бустер должен быть grow (followChance)
let pendingFollowGrow = false;

// Визуальные переменные (рандомятся на каждый ран)
let currentShape = 'square';
let currentPlayerColor = '#e74c3c';
let currentTheme = {};

// Медали
let MEDALS = buildMedals();

// Analytics
let totalLaunches = parseInt(localStorage.getItem('fg_launches') || '0');
let sessionStartTime = 0;
let lastDeathCause = 'fall';
const isFirstVisit = !localStorage.getItem('fg_visited');
if (isFirstVisit) localStorage.setItem('fg_visited', '1');

// Игровое время (накапливается через effectiveDt — замедляется при LCD)
let gameTime = 0;

// Medal popup timer
let medalTimer = 0;


let timeScale = 1;
let lcdActive = false;
let lcdChecked = false;
let lcdSlowTarget = 0.12; // динамический target замедления, пересчитывается в activateLCD
let _lcdTestMode = false;

// Точки рисуемой линии (экранные координаты)
let drawPoints = [];
let isDrawing = false;

// Админ-панель - Добавляешь в  main.js объект window.admin:
// javascriptwindow.admin = {
//     addCoins: (n) => { allTimeCoins += n; save.allTimeCoins = allTimeCoins; saveSave(); updateCoinsHud(); },
//     addLcd:   (n) => { lcdInventory += n; save.lcdCharges = lcdInventory; saveSave(); updateLcdHud(); },
//     setScore: (n) => { score = n; },
//     reset:    ()  => { localStorage.removeItem('fg_save'); location.reload(); },
//     status:   ()  => console.table({ allTimeCoins, lcdInventory, score: Math.floor(score) }),
// };
// Тогда в консоли браузера (F12):
// admin.addCoins(1000)
// admin.addLcd(5)
// admin.status()
// admin.reset()