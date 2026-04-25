// ═══════════════════════════════════════
//  main.js — update, loop, input
//  Загружается последним
// ═══════════════════════════════════════

// Разлёт платформы на куски при megaGrow
function _smashPlatform(p){
    if(navigator.vibrate) navigator.vibrate(30)
    const sx = p.x - cameraX;
    const count = 8 + Math.floor(Math.random()*6);
    for(let i=0;i<count;i++){
        const bx = sx + Math.random()*p.w;
        const by = p.y + Math.random()*p.h;
        const a  = Math.random()*Math.PI*2;
        const spd= 3 + Math.random()*6;
        particles.push({
            x:bx, y:by,
            vx:Math.cos(a)*spd, vy:Math.sin(a)*spd - 2,
            life:1, decay:0.022+Math.random()*0.018,
            size:4+Math.random()*8,
            color: i%3===0 ? '#27ae60' : (i%3===1 ? '#3d250f' : '#8B5E3C'),
            shape:'square'
        });
    }
}

// Уничтожение мины большой фигурой — случайная анимация из 5 типов, чёрные частицы
function _crushMine(h, hx){
    // Лёгкая вибрация на мобильных
    if(navigator.vibrate) navigator.vibrate(30);
    const mx = hx + h.r, my = h.y;
    const type = DEATH_TYPES[Math.floor(Math.random()*DEATH_TYPES.length)];
    if(type==='explode'){
        for(let i=0;i<18;i++){
            const a=Math.random()*Math.PI*2, spd=3+Math.random()*5;
            particles.push({x:mx,y:my,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,life:1,decay:0.03+Math.random()*0.02,size:3+Math.random()*7,color:'#222',shape:'square'});
        }
    } else if(type==='dissolve'){
        for(let i=0;i<24;i++){
            const a=Math.random()*Math.PI*2;
            particles.push({x:mx,y:my,vx:(Math.cos(a)+Math.random()-0.5)*2,vy:(Math.sin(a)-1.2)*1.5,life:1,decay:0.02+Math.random()*0.015,size:2+Math.random()*5,color:'#333',shape:'circle'});
        }
    } else if(type==='pop'){
        for(let i=0;i<12;i++){
            const a=(Math.PI*2/12)*i;
            particles.push({x:mx,y:my,vx:Math.cos(a)*5,vy:Math.sin(a)*5,life:1,decay:0.045,size:3+Math.random()*4,color:'#222',shape:'circle'});
        }
    } else if(type==='melt'){
        for(let i=0;i<14;i++){
            const ox=(Math.random()-0.5)*30;
            particles.push({x:mx+ox,y:my,vx:(Math.random()-0.5)*1.2,vy:2+Math.random()*3,life:1,decay:0.015+Math.random()*0.01,size:5+Math.random()*6,color:'#1a1a1a',shape:'drop'});
        }
    } else { // unravel
        for(let i=0;i<20;i++){
            const a=(Math.PI*2/20)*i;
            particles.push({x:mx,y:my,vx:Math.cos(a+Math.PI/2)*2.5,vy:Math.sin(a+Math.PI/2)*2.5-1,life:1,decay:0.022,size:3,color:'#2a2a2a',shape:'circle'});
        }
    }
}

// ── LAST CHANCE DRAW: симуляция траектории ──────────────
// Возвращает true если игрок гарантированно упадёт в пропасть
function _predictWillDie(){
    const SIM_STEPS = 240;          // ~4 сек при 60fps
    const SIM_DT    = 1;
    const pSize     = player.size * player.growScale;

    // Снимок состояния
    let sy  = player.y;
    let svy = player.vy;
    let scx = cameraX;              // камера тоже движется

    for(let i=0; i<SIM_STEPS; i++){
        svy += GRAVITY * SIM_DT;
        sy  += svy * SIM_DT;
        scx += currentSpeed * SIM_DT;

        // Упал за экран — погибнет
        if(sy > H + 80) return true;

        // Проверяем платформы (берём их текущее положение — достаточно точно)
        for(let p of platforms){
            if(p.dead) continue;
            const px = p.x - scx;
            if(player.x + pSize > px && player.x < px + p.w &&
               svy >= 0 &&
               sy + pSize >= p.y && sy + pSize - svy * SIM_DT <= p.y + 8){
                return false; // найдена платформа — выживет
            }
        }

        // Проверяем мины (при контакте с миной игрок тоже не упадёт в пропасть)
        for(let h of hazards){
            const hx = h.x - scx;
            if(Math.hypot(hx + h.r - (player.x + pSize/2), h.y - (sy + pSize/2)) < h.r + pSize * 0.35){
                return false; // мина остановит
            }
        }
    }

    return true; // за 4 секунды ничего не встретил — упадёт
}

// ── LAST CHANCE DRAW: плавное изменение timeScale ───────
function _updateTimeScale(dt){
    const target = lcdActive ? lcdSlowTarget : 1;
    const speed  = lcdActive ? LCD_LERP_IN : LCD_LERP_OUT;
    timeScale += (target - timeScale) * speed * dt * 3;
    if(Math.abs(timeScale - target) < 0.005) timeScale = target;
}

// ── LAST CHANCE DRAW: деактивация (линия нарисована или отменена) ─
function cancelLCD(){
    lcdActive  = false;
    lcdChecked = true;
}

// triggerY — верхняя точка ближайшей платформы, по которой сработал триггер
function activateLCD(triggerY){
    // Физических кадров до дна экрана при свободном падении
    const distToDrop = Math.max(1, H - player.y);
    const physFrames = Math.sqrt(2 * distToDrop / GRAVITY);
    // timeScale такой, чтобы игрок получил LCD_PLAYER_SECONDS реального времени
    const realFrames = LCD_PLAYER_SECONDS * 60;
    lcdSlowTarget = Math.min(1, physFrames / realFrames);
    lcdActive  = true;
    lcdChecked = true;
}

function update(dt=1){
    if(paused) return;

    // Анимация смерти и частицы (работают даже после смерти)
    if(player.dead){
        if(player.deathAnim){
            player.deathAnim.t += dt;
            if(player.deathAnim.type==='pop'&&player.deathAnim.ring){
                const rng=player.deathAnim.ring;
                rng.r+=5*dt; rng.alpha=Math.max(0,1-rng.r/rng.maxR);
            }
        }
    }

    // Частицы всегда тикают
    for(let i=particles.length-1;i>=0;i--){
        const pt=particles[i];
        pt.x+=pt.vx*dt; pt.y+=pt.vy*dt;
        pt.vy+=(pt.shape==='drop'?0.25:0.18)*dt;
        pt.life-=pt.decay*dt;
        if(pt.life<=0) particles.splice(i,1);
    }

    // Мины — фаза вращения шипов (только когда игра идёт)
    for(let h of hazards){ h.phase+=0.04*dt; }

    // timeScale всегда обновляем — даже после смерти, чтобы замедление плавно снималось
    _updateTimeScale(dt);

    if(!gameRunning||player.dead) return;

    // ── LAST CHANCE DRAW: проверка и управление timeScale ──

    // Деактивируем если приземлились (до начала рисования)
    if(lcdActive && player.grounded) cancelLCD();

    // Сбрасываем lcdChecked когда игрок снова на земле или есть прыжки
    if(player.grounded || player.jumpsLeft > 0) lcdChecked = false;

    // Условие для проверки: в воздухе, прыжков нет, летим вниз
    if(!lcdActive && !lcdChecked &&
       !player.grounded && player.jumpsLeft === 0 &&
       player.vy > 0 && _lcdTestMode && !player.megaGrow){

        // Находим 2 ближайшие платформы по X и берём верхнюю (мин. Y) из них
        const nearby = platforms
            .filter(p => {
                if(p.dead) return false;
                const px = p.x - cameraX;
                return px + p.w >= player.x - 200 && px <= player.x + 500;
            })
            .sort((a,b) => {
                const ax = Math.abs((a.x - cameraX + a.w/2) - (player.x + player.size/2));
                const bx = Math.abs((b.x - cameraX + b.w/2) - (player.x + player.size/2));
                return ax - bx;
            })
            .slice(0, 2);

        // Верхняя точка из двух ближайших (для лифта — liftY0 - liftAmp, самая высокая)
        let triggerY = Infinity;
        for(let p of nearby){
            const top = p.type === 'lift' ? p.liftY0 - p.liftAmp : p.y;
            if(top < triggerY) triggerY = top;
        }

        // Как только нижний край фигуры прошёл верхнюю точку ближайших платформ + 4px запас
        if(triggerY < Infinity && player.y + player.size * player.growScale > triggerY + 4){
            lcdChecked = true;
            // Симулируем — активируем только если действительно не попадёт никуда
            if(_predictWillDie()) activateLCD(triggerY);
        }
    }

    // Пока LCD активен — физика замедлена, всё остальное через effectiveDt
    const effectiveDt = dt * timeScale;

    // Лифты и слайды — через effectiveDt (замедляются при LCD)
    for(let p of platforms){
        if(p.type==='lift'){
            const oldY = p.y;
            p.liftAngle += p.liftSpeed * effectiveDt;
            p.y = p.liftY0 + Math.sin(p.liftAngle) * p.liftAmp;
            p.y = Math.max(300, Math.min(800, p.y));
            p._dy = p.y - oldY;
        }
        if(p.type==='slide'){
            const oldX = p.x;
            p.slideAngle += p.slideSpeed * effectiveDt;
            p.x = p.slideX0 + Math.sin(p.slideAngle) * p.slideAmp;
            p._dx = p.x - oldX;
        }
    }
    const natural=baseSpeed+(score/5000)*1.2;
    const boost  =player.speedBoostTimer>0?SPEED_BOOST_ADD:0;
    currentSpeed =natural+boost;

    if(player.shieldTimer>0)    player.shieldTimer-=effectiveDt;
    if(player.shieldTimer<=0)   player.shield=false;
    if(player.superJumpTimer>0) player.superJumpTimer-=effectiveDt;
    if(player.speedBoostTimer>0)player.speedBoostTimer-=effectiveDt;
    const wasGrowing = player.growTimer > 0;
    if(player.growTimer>0)      player.growTimer-=effectiveDt;
    // Запускаем grace-период сразу как growTimer иссяк
    if(wasGrowing && player.growTimer<=0){
        player.shrinkGrace = 60;
        // Подброс вверх только при megaGrow — чтобы попасть на платформу после уменьшения
        if(player.megaGrow){
            player.vy = SUPER_JUMP * 1.6;
            player.grounded = false;
            player.jumpsLeft = 2;
        }
        player.megaGrow = false;
    }
    if(player.shrinkGrace>0)    player.shrinkGrace-=effectiveDt;
    if(screenShake>0)           screenShake = Math.max(0, screenShake - effectiveDt * 1.2);

    // Плавный масштаб — якорим нижний край (ноги на платформе)
    {
        const target = player.growTimer > 0
            ? (player.megaGrow ? MEGA_GROW_SCALE : GROW_SCALE)
            : 1;
        const speed  = 1 - Math.pow(1 - 0.18, effectiveDt);
        const oldBottom = player.y + player.size * player.growScale;
        player.growScale += (target - player.growScale) * speed;
        if(Math.abs(player.growScale - target) < 0.01) player.growScale = target;
        player.y = oldBottom - player.size * player.growScale;
    }

    // Лифт → игрок (вертикально)
    if(player.onLift&&!player.onLift.dead&&player.grounded) player.y+=player.onLift._dy;
    // Слайд → камера
    if(player.onSlide&&!player.onSlide.dead&&player.grounded) cameraX+=player.onSlide._dx;

    // Физика + коллизия через субшаги
    const MAX_STEP = 0.5;
    const steps = Math.min(Math.ceil(effectiveDt / MAX_STEP), 4);
    const subDt  = effectiveDt / steps;

    for(let step=0; step<steps; step++){
        // Гравитация и движение по Y
        player.vy += GRAVITY * subDt;
        player.y  += player.vy * subDt;

        // Коллизия с платформами
        const effSize = player.size * player.growScale;
        player.grounded=false; player.onLift=null; player.onSlide=null;

        // MegaGrow: бесконечный пол — ноги ровно на дне экрана
        if(player.megaGrow){
            const megaFloor = H * 1.05;
            if(player.y + effSize >= megaFloor){
                player.y = megaFloor - effSize;
                if(player.vy > 2) screenShake = Math.min(14, player.vy * 0.6); // сотрясение при падении
                player.vy = 0; player.grounded = true; player.jumpsLeft = 2;
                if(lcdActive) cancelLCD();
            }
            // Уничтожаем все платформы которые задеты фигурой
            const camOffset = (player.growScale - 1) * player.size * 0.6;
            const fLeft = player.x - camOffset;
            for(let p of platforms){
                if(p.dead) continue;
                const px = p.x - cameraX;
                if(fLeft + effSize > px && fLeft < px + p.w &&
                   player.y < p.y + p.h && player.y + effSize > p.y){
                    // Монеты lift/slide переносим в freeCoins перед уничтожением
                    for(let c of p.coinItems){
                        if(!c.collected) freeCoins.push({x: p.x+c.relX, y: p.y-28, collected:false});
                    }
                    _smashPlatform(p);
                    p.dead = true;
                }
            }
        } else {
            for(let p of platforms){
                if(p.dead) continue;
                const px=p.x-cameraX;
                // Нижний край фигуры пересёк верх платформы сверху вниз (vy >= 0)
                if(player.x+effSize>px && player.x<px+p.w &&
                   player.vy >= 0 &&
                   player.y+effSize >= p.y && player.y+effSize - player.vy*subDt <= p.y+8){
                    player.y=p.y-effSize; player.vy=0; player.grounded=true; player.jumpsLeft=2;
                    if(lcdActive) cancelLCD(); // приземлились — LCD больше не нужен
                    if(p.type==='lift')  player.onLift=p;
                    if(p.type==='slide') player.onSlide=p;
                    if(p.type==='spring'){
                        player.vy=BOUNCE_VY; player.grounded=false;
                        player.onLift=null; player.onSlide=null; player.jumpsLeft=2;
                        spawnParticles(player.x+effSize/2, player.y+effSize, '#ff5722', 12);
                        break;
                    }
                    if(p.type==='crumble'&&!p.crumbleFalling){ p.crumbleFalling=true; p.crumbleTimer=15; p.crumbleAlpha=1; }
                    break;
                }
            }
        }
    }

    // Движение камеры и счёт — один раз за весь кадр
    cameraX+=currentSpeed*effectiveDt; score+=currentSpeed*effectiveDt/3.8;

    // Ломающиеся
    for(let p of platforms){
        if(p.type==='crumble'&&p.crumbleFalling){
            p.crumbleTimer-=effectiveDt; p.crumbleAlpha=Math.max(0,p.crumbleTimer/15);
            if(p.crumbleTimer<=0) p.dead=true;
        }
    }

    // Вращение
    const effSize = player.size * player.growScale;
    if(player.grounded) player.rotation += currentSpeed * 0.092 * effectiveDt / player.growScale;

    // Визуальное смещение фигуры влево при росте (совпадает с render.js)
    const camOffset = player.megaGrow
        ? (player.growScale - 1) * player.size * 0.6
        : (player.growScale - 1) * player.size * 0.4;
    const figLeft = player.x - camOffset;

    // Мины — коллизия
    // growTimer>0 или growScale>1.05 — давим; shrinkGrace — просто неуязвимы (не давим)
    const growProtected = player.growTimer > 0 || player.growScale > 1.05;
    const mineImmune   = growProtected || player.shrinkGrace > 0 || player.shield;
    // Визуальный центр фигуры (совпадает с render.js: figCX, figCY)
    const figCX = figLeft + effSize/2;
    const figCY = player.y + effSize/2;
    // Радиус хитбокса — половина эффективного размера (от края до края)
    const figR  = effSize / 2;
    for(let i=hazards.length-1;i>=0;i--){
        const h=hazards[i];
        const hx=h.x-cameraX;
        const bob=Math.sin(performance.now()/500+h.bobPhase)*5;
        const dist=Math.hypot(hx+h.r - figCX, (h.y+bob) - figCY);
        if(dist < h.r + figR * 0.9){
            if(growProtected){
                _crushMine(h, hx);
                hazards.splice(i,1);
            } else if(!mineImmune){
                lastDeathCause = 'mine';
                triggerDeathAnim(figCX, figCY); return;
            }
        }
    }

    // Монеты лифтов и слайдов
    for(let p of platforms){
        if(p.dead||(p.type!=='lift'&&p.type!=='slide')) continue;
        for(let c of p.coinItems){
            if(c.collected) continue;
            const cx=p.x+c.relX-cameraX, cy=p.y-28;
            if(figLeft+effSize>cx-12&&figLeft<cx+12&&player.y<cy+12&&player.y+effSize>cy-12){
                c.collected=true; totalCoins++; allTimeCoins++;
                localStorage.setItem('cubeRunnerATC', allTimeCoins);
                spawnParticles(cx, cy, '#f1c40f', 7);
                updateCoinsHud();
            }
        }
    }

    // Бустеры
    for(let p of platforms){
        if(p.dead) continue;
        if(p.booster&&!p.booster.collected){
            const bx=p.x+p.booster.relX-cameraX, by=p.y-36;
            if(figLeft+effSize>bx-16&&figLeft<bx+16&&player.y<by+16&&player.y+effSize>by-16){
                p.booster.collected=true; applyBooster(p.booster.type, bx, by);
            }
        }
    }

    // Свободные монеты
    for(let c of freeCoins){
        if(c.collected) continue;
        const cx=c.x-cameraX, cy=c.y;
        if(figLeft+effSize>cx-12&&figLeft<cx+12&&player.y<cy+12&&player.y+effSize>cy-12){
            c.collected=true; totalCoins++; allTimeCoins++;
            localStorage.setItem('cubeRunnerATC', allTimeCoins);
            spawnParticles(cx, cy, '#f1c40f', 7);
            updateCoinsHud();
        }
    }
    freeCoins=freeCoins.filter(c=>!c.collected&&(c.x-cameraX)>-80);

    if(player.y>H+80){ lastDeathCause='fall'; triggerDeathAnim(player.x+player.size/2, H-50); return; }

    checkMedals();
    while(lastPlatformEnd-cameraX<W+700) generateNextPlatform();
    platforms=platforms.filter(p=>!p.dead&&(p.x+p.w-cameraX)>-150);
    hazards  =hazards.filter(h=>(h.x-cameraX)>-80);
    document.getElementById('score').textContent=`${Math.floor(score)} м`;

    // Ghost trail для супер-прыжка
    if(player.superJumpTimer>0){
        trailBuf.push({x:player.x, y:player.y, r:player.rotation});
        if(trailBuf.length>TRAIL_LEN) trailBuf.shift();
    } else {
        if(trailBuf.length>0) trailBuf.shift();
    }

    // Ghost trail ускорения
    if(player.speedBoostTimer>0){
        speedTrailBuf.push({x: player.x+cameraX, y: player.y, r: player.rotation});
        if(speedTrailBuf.length>TRAIL_LEN) speedTrailBuf.shift();
    } else {
        if(speedTrailBuf.length>0) speedTrailBuf.shift();
    }
}

// ── LOOP ───────────────────────────────
let _lastTime = 0;

function loop(timestamp){
    // dt нормирован на 60fps: при 60fps=1.0, при 90fps≈0.667, при 120fps=0.5
    const elapsed = _lastTime ? Math.min(timestamp - _lastTime, 50) : 16.667;
    _lastTime = timestamp;
    const dt = elapsed / 16.667;

    update(dt);
    draw();
    if(loopRunning) requestAnimationFrame(loop);
}

// ── INPUT ──────────────────────────────
window.addEventListener('keydown', e=>{
    if(e.key===' '){ e.preventDefault(); jump(); }
    if(e.key==='Escape' && gameRunning) togglePause();
});

// Перевод координат события в координаты canvas
function _eventToCanvas(e){
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
        x: (src.clientX - rect.left) * scaleX,
        y: (src.clientY - rect.top)  * scaleY
    };
}

canvas.addEventListener('mousedown', e=>{
    if(lcdActive){
        const p = _eventToCanvas(e);
        isDrawing  = true;
        drawPoints = [p];
    } else {
        jump();
    }
});
canvas.addEventListener('mousemove', e=>{
    if(!lcdActive || !isDrawing) return;
    drawPoints.push(_eventToCanvas(e));
});
canvas.addEventListener('mouseup', ()=>{
    if(lcdActive && isDrawing){
        isDrawing = false;
        // Часть 3: конвертация линии в платформу
    }
});

canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    if(lcdActive){
        const p = _eventToCanvas(e);
        isDrawing  = true;
        drawPoints = [p];
    } else {
        jump();
    }
}, {passive: false});
canvas.addEventListener('touchmove', e=>{
    e.preventDefault();
    if(!lcdActive || !isDrawing) return;
    drawPoints.push(_eventToCanvas(e));
}, {passive: false});
canvas.addEventListener('touchend', e=>{
    e.preventDefault();
    if(lcdActive && isDrawing){
        isDrawing = false;
        // Часть 3: конвертация линии в платформу
    }
}, {passive: false});