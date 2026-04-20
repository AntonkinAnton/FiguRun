// ═══════════════════════════════════════
//  main.js — update, loop, input
//  Загружается последним
// ═══════════════════════════════════════

// Уничтожение мины большой фигурой — случайная анимация из 5 типов, чёрные частицы
function _crushMine(h, hx){
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

    // Лифты и слайды используют performance.now() — независимы от dt
    const t=performance.now()/1000;
    for(let p of platforms){
        if(p.type==='lift'){
            const oldY=p.y;
            p.y=p.liftY0+Math.sin(t*p.liftSpeed*60+p.liftPhase)*p.liftAmp;
            p.y=Math.max(300,Math.min(800,p.y));
            p._dy=p.y-oldY;
        }
        if(p.type==='slide'){
            const oldX=p.x;
            p.x=p.slideX0+Math.sin(t*p.slideSpeed*60+p.slidePhase)*p.slideAmp;
            p._dx=p.x-oldX;
        }
    }
    for(let h of hazards){ h.phase+=0.04*dt; }

    if(!gameRunning||player.dead) return;

    // Скорость
    const natural=baseSpeed+(score/5000)*1.2;
    const boost  =player.speedBoostTimer>0?SPEED_BOOST_ADD:0;
    currentSpeed =natural+boost;

    if(player.shieldTimer>0)    player.shieldTimer-=dt;
    if(player.shieldTimer<=0)   player.shield=false;
    if(player.superJumpTimer>0) player.superJumpTimer-=dt;
    if(player.speedBoostTimer>0)player.speedBoostTimer-=dt;
    if(player.growTimer>0)      player.growTimer-=dt;

    // Плавный масштаб — якорим нижний край (ноги на платформе)
    {
        const target = player.growTimer > 0 ? GROW_SCALE : 1;
        const speed  = 1 - Math.pow(1 - 0.18, dt); // frame-rate независимый lerp
        const oldBottom = player.y + player.size * player.growScale;
        player.growScale += (target - player.growScale) * speed;
        if(Math.abs(player.growScale - target) < 0.01) player.growScale = target;
        player.y = oldBottom - player.size * player.growScale;
    }

    // Лифт → игрок (вертикально)
    if(player.onLift&&!player.onLift.dead&&player.grounded) player.y+=player.onLift._dy;
    // Слайд → камера
    if(player.onSlide&&!player.onSlide.dead&&player.grounded) cameraX+=player.onSlide._dx;

    // Физика + коллизия через субшаги — защита от туннелинга при фризах
    // Максимум 1 субшаг = 0.5 нормального кадра, не более 4 шагов
    const MAX_STEP = 0.5;
    const steps = Math.min(Math.ceil(dt / MAX_STEP), 4);
    const subDt  = dt / steps;

    for(let step=0; step<steps; step++){
        // Гравитация и движение по Y
        player.vy += GRAVITY * subDt;
        player.y  += player.vy * subDt;

        // Коллизия с платформами
        const effSize = player.size * player.growScale;
        player.grounded=false; player.onLift=null; player.onSlide=null;
        for(let p of platforms){
            if(p.dead) continue;
            const px=p.x-cameraX;
            // Нижний край фигуры пересёк верх платформы сверху вниз (vy >= 0)
            if(player.x+effSize>px && player.x<px+p.w &&
               player.vy >= 0 &&
               player.y+effSize >= p.y && player.y+effSize - player.vy*subDt <= p.y+8){
                player.y=p.y-effSize; player.vy=0; player.grounded=true; player.jumpsLeft=2;
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

    // Движение камеры и счёт — один раз за весь кадр
    cameraX+=currentSpeed*dt; score+=currentSpeed*dt/3.8;

    // Ломающиеся
    for(let p of platforms){
        if(p.type==='crumble'&&p.crumbleFalling){
            p.crumbleTimer-=dt; p.crumbleAlpha=Math.max(0,p.crumbleTimer/15);
            if(p.crumbleTimer<=0) p.dead=true;
        }
    }

    // Вращение
    const effSize = player.size * player.growScale;
    if(player.grounded) player.rotation += currentSpeed * 0.092 * dt / player.growScale;

    // Визуальное смещение фигуры влево при росте (совпадает с render.js)
    const camOffset = (player.growScale - 1) * player.size * 0.4;
    // Экранный левый край фигуры с учётом смещения
    const figLeft = player.x - camOffset;

    // Мины — коллизия
    // Щит защищает только в обычном состоянии; в режиме grow давим мины всегда
    for(let i=hazards.length-1;i>=0;i--){
        const h=hazards[i];
        const hx=h.x-cameraX;
        const bob=Math.sin(performance.now()/500+h.bobPhase)*5;
        const dist=Math.hypot(hx+h.r-(figLeft+effSize/2), (h.y+bob)-(player.y+effSize/2));
        if(dist < h.r+effSize*0.35){
            if(player.growTimer>0){
                // Большая фигура давит мину — щит не мешает
                _crushMine(h, hx);
                hazards.splice(i,1);
            } else if(!player.shield){
                lastDeathCause = 'mine';
                triggerDeathAnim(figLeft+effSize/2, player.y+effSize/2); return;
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
canvas.addEventListener('mousedown', ()=> jump());
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); jump(); });