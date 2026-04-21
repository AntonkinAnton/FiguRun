// ═══════════════════════════════════════
//  state.js — все общие изменяемые переменные
//  Загружается после config.js
// ═══════════════════════════════════════

// Canvas
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

// Игрок
let player = {
    x:110, y:620, size:48, vy:0, rotation:0,
    grounded:true, jumpsLeft:2,
    shield:false, shieldTimer:0,
    superJumpTimer:0, speedBoostTimer:0,
    growTimer:0, growScale:1,
    shrinkGrace:0,          // неуязвимость после окончания grow
    onLift:null, prevLiftY:0,
    onSlide:null,
    dead:false, deathAnim:null
};

// Игровое состояние
let baseSpeed    = 4.85;
let currentSpeed = baseSpeed;
let platforms    = [];
let hazards      = [];
let particles    = [];
let freeCoins    = [];
let cameraX      = 0;
let score        = 0;
let totalCoins   = 0;

// Рекорды (localStorage)
let highScore    = parseInt(localStorage.getItem('cubeRunnerHS'))  || 0;
let highCoins    = parseInt(localStorage.getItem('cubeRunnerHC'))  || 0;
let allTimeCoins = parseInt(localStorage.getItem('cubeRunnerATC')) || 0;

// Ghost-trail буферы
let trailBuf      = [];
let speedTrailBuf = [];

// Loop control
let loopRunning  = false;
let gameRunning  = false;
let paused       = false;
let lastPlatformEnd = 0;

// Бустер-трекер
let boosterState = {lastType:null, platformsSinceLast:0, minInterval:4, maxInterval:9};
let nextBoosterIn = 5;

// Визуальные переменные (рандомятся на каждый ран)
let currentShape       = 'square';
let currentPlayerColor = '#e74c3c';
let currentTheme       = {};

// Медали
let MEDALS = buildMedals();

// Analytics
let totalLaunches   = parseInt(localStorage.getItem('fg_launches') || '0');
let sessionStartTime = 0;
let lastDeathCause   = 'fall';
const isFirstVisit   = !localStorage.getItem('fg_visited');
if(isFirstVisit) localStorage.setItem('fg_visited', '1');

// Medal popup timer
let medalTimer = 0;