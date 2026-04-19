// ═══════════════════════════════════════
//  player.js — логика игрока, частицы, анимации смерти
//  Загружается после state.js, ui.js
// ═══════════════════════════════════════

// ── ЧАСТИЦЫ ────────────────────────────
function spawnParticles(x,y,color,count=8,opts={}){
    for(let i=0;i<count;i++){
        const a = (Math.PI*2/count)*i + Math.random()*0.5;
        const spd = opts.spd || 1;
        particles.push({
            x, y,
            vx: Math.cos(a)*(2+Math.random()*3)*spd,
            vy: Math.sin(a)*(2+Math.random()*3)*spd-2,
            life: 1,
            decay: opts.decay || (0.04+Math.random()*0.04),
            size:  opts.size  || (4+Math.random()*5),
            color, shape: opts.shape || 'circle'
        });
    }
}

// ── АНИМАЦИИ СМЕРТИ ────────────────────
function triggerDeathAnim(x,y){
    const type = DEATH_TYPES[Math.floor(Math.random()*DEATH_TYPES.length)];
    player.dead = true;
    score = Math.floor(score);
    player.deathAnim = {type, t:0, x, y, done:false};

    const c = currentPlayerColor;
    if(type==='explode'){
        for(let i=0;i<28;i++){
            const a=Math.random()*Math.PI*2, spd=4+Math.random()*8;
            particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-3,life:1,decay:0.025+Math.random()*0.02,size:3+Math.random()*9,color:c,shape:'square'});
        }
        for(let i=0;i<12;i++){
            const a=Math.random()*Math.PI*2;
            particles.push({x,y,vx:Math.cos(a)*2,vy:Math.sin(a)*2,life:1,decay:0.08,size:12+Math.random()*8,color:'#ffeb3b',shape:'circle'});
        }
    } else if(type==='dissolve'){
        for(let i=0;i<40;i++){
            const a=Math.random()*Math.PI*2, r=Math.random()*24;
            particles.push({x:x+Math.cos(a)*r*0.3,y:y+Math.sin(a)*r*0.3,vx:(Math.cos(a)+Math.random()-0.5)*2.5,vy:(Math.sin(a)-1.5)*1.8,life:1,decay:0.018+Math.random()*0.015,size:2+Math.random()*6,color:c,shape:'circle'});
        }
    } else if(type==='pop'){
        player.deathAnim.ring = {r:5, maxR:80, alpha:1};
        for(let i=0;i<16;i++){
            const a=(Math.PI*2/16)*i;
            particles.push({x,y,vx:Math.cos(a)*6,vy:Math.sin(a)*6-1,life:1,decay:0.04,size:4+Math.random()*5,color:c,shape:'circle'});
        }
    } else if(type==='melt'){
        for(let i=0;i<30;i++){
            const ox=(Math.random()-0.5)*40;
            particles.push({x:x+ox,y,vx:(Math.random()-0.5)*1.5,vy:2+Math.random()*4,life:1,decay:0.012+Math.random()*0.01,size:6+Math.random()*8,color:c,shape:'drop'});
        }
    } else if(type==='unravel'){
        for(let i=0;i<36;i++){
            const a=(Math.PI*2/36)*i, r=5+i*0.6;
            particles.push({x:x+Math.cos(a)*r*0.3,y:y+Math.sin(a)*r*0.3,vx:Math.cos(a+Math.PI/2)*2.5*(1+i*0.04),vy:Math.sin(a+Math.PI/2)*2.5*(1+i*0.04)-1,life:1,decay:0.02,size:3,color:c,shape:'circle'});
        }
    }

    showGameOver();
}

// ── ПРЫЖОК ─────────────────────────────
function jump(){
    if(!gameRunning || player.dead || paused) return;
    if(player.jumpsLeft > 0){
        player.vy = player.superJumpTimer > 0 ? SUPER_JUMP : JUMP;
        player.grounded = false;
        player.onLift   = null;
        player.onSlide  = null;
        player.jumpsLeft--;
        spawnParticles(player.x+player.size/2, player.y+player.size, currentPlayerColor, 6);
    }
}
