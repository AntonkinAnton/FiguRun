// ═══════════════════════════════════════
//  ui.js — HUD, оверлеи, медали, аналитика
//  Загружается после state.js
// ═══════════════════════════════════════

// ── АНАЛИТИКА ──────────────────────────
function ga(eventName, params){
    if(typeof gtag === 'function') gtag('event', eventName, params);
}

// ── МОНЕТКА В HUD ──────────────────────
function drawCoinIcon(){
    const ic = document.getElementById('coin-icon');
    if(!ic) return;
    const c  = ic.getContext('2d');
    c.clearRect(0,0,26,26);
    const cx=13, cy=13, r=10;
    c.fillStyle='#f1c40f';
    c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fill();
    c.strokeStyle='#e67e22'; c.lineWidth=2.5;
    c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.stroke();
    c.fillStyle='rgba(255,255,255,0.42)';
    c.beginPath(); c.arc(cx-3,cy-3,4,0,Math.PI*2); c.fill();
}

function updateCoinsHud(){
    document.getElementById('coins-val').textContent = totalCoins;
    document.getElementById('coins-all').textContent = allTimeCoins;
}

// ── ПАУЗА ──────────────────────────────
function setPauseIcon(isPaused){
    document.getElementById('pause-btn').textContent = isPaused ? '▶' : '⏸';
}

function togglePause(){
    if(!gameRunning && !paused) return;
    paused = !paused;
    setPauseIcon(paused);
    document.getElementById('pause-menu').style.display = paused ? 'flex' : 'none';
    if(!paused && !loopRunning){ loopRunning=true; requestAnimationFrame(loop); }
}

// ── МЕДАЛИ ─────────────────────────────
function checkMedals(){
    for(let m of MEDALS){
        if(!m.shown && score>=m.dist){
            m.shown = true;
            showMedal(m.label);
            ga('medal_reached', { distance_m: m.dist, label: m.label });
            break;
        }
    }
}

function showMedal(label){
    const el = document.getElementById('medal-popup');
    el.textContent = label;
    el.style.opacity = '1';
    clearTimeout(medalTimer);
    medalTimer = setTimeout(()=>{ el.style.opacity='0'; }, 2200);
}

// ── GAME OVER ──────────────────────────
function showGameOver(){
    const s  = Math.floor(score);
    const hc = Math.max(totalCoins, highCoins);
    const isNewRecord = s > highScore;
    if(isNewRecord){ highScore=s; localStorage.setItem('cubeRunnerHS',s); }
    localStorage.setItem('cubeRunnerHC', hc); highCoins = hc;

    document.getElementById('final').textContent     = `Расстояние: ${s} м`;
    document.getElementById('best').textContent      = `Рекорд: ${highScore} м`;
    document.getElementById('coinscore').textContent = `Монет: ${totalCoins} (итого: ${allTimeCoins})`;
    document.getElementById('gameover').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';

    const sessionSec = Math.round((Date.now() - sessionStartTime) / 1000);
    ga('game_over', {
        distance_m:      s,
        coins_collected: totalCoins,
        death_cause:     lastDeathCause,
        session_seconds: sessionSec,
        is_new_record:   isNewRecord,
        shape:           currentShape,
        launch_number:   totalLaunches,
    });
}

// ── GAME FLOW (UI-часть) ────────────────
function startGame(){
    document.getElementById('start').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'flex';
    setPauseIcon(false);
    resetGame();
    gameRunning = true;
    if(!loopRunning){ loopRunning=true; requestAnimationFrame(loop); }

    totalLaunches++;
    localStorage.setItem('fg_launches', totalLaunches);
    sessionStartTime = Date.now();
    ga('game_start', {
        launch_number: totalLaunches,
        is_first_visit: isFirstVisit,
        shape: currentShape,
        color: currentPlayerColor,
    });
}

function restartGame(){
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'flex';
    setPauseIcon(false);
    resetGame();
    gameRunning = true;
    if(!loopRunning){ loopRunning=true; requestAnimationFrame(loop); }

    totalLaunches++;
    localStorage.setItem('fg_launches', totalLaunches);
    sessionStartTime = Date.now();
    ga('game_restart', {
        launch_number: totalLaunches,
        shape: currentShape,
        color: currentPlayerColor,
    });
}

function restartFromPause(){
    document.getElementById('pause-menu').style.display = 'none';
    paused = false;
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'flex';
    setPauseIcon(false);
    resetGame();
    gameRunning = true;
    if(!loopRunning){ loopRunning=true; requestAnimationFrame(loop); }
    totalLaunches++;
    localStorage.setItem('fg_launches', totalLaunches);
    sessionStartTime = Date.now();
    ga('game_restart', { launch_number: totalLaunches, shape: currentShape, color: currentPlayerColor });
}
