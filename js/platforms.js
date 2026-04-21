// ═══════════════════════════════════════
//  platforms.js — платформы, мины, генерация, сброс
//  Загружается после boosters.js
// ═══════════════════════════════════════

// ── ПЛАТФОРМА — ФАБРИКА ────────────────
function createPlatform(x, y, w, type='normal'){
    const p = {
        x, y, w, h:32, type,
        coinItems:[], booster:null, dead:false,
        liftY0:y, liftAmp:0, liftSpeed:0, liftPhase:0, _dy:0,
        crumbleFalling:false, crumbleTimer:0, crumbleAlpha:1,
        slideX0:x, slideAmp:0, slideSpeed:0, slidePhase:0, _dx:0
    };
    if(type==='lift'){
        p.liftAmp   = 60+Math.random()*80;
        p.liftSpeed = 0.018+Math.random()*0.022;
        p.liftPhase = Math.random()*Math.PI*2;
    }
    if(type==='slide'){
        p.slideAmp   = 55+Math.random()*65;
        p.slideSpeed = 0.016+Math.random()*0.02;
        p.slidePhase = Math.random()*Math.PI*2;
    }
    return p;
}

// ── ДЕКОРАЦИЯ (монеты, бустеры) ─────────
function decoratePlatform(p){
    if(p.w < 80) return;
    const margin=28, usable=p.w-margin*2;
    if(usable < 20) return;

    const n = Math.floor(Math.random()*5);
    if(n > 0){
        const sp = usable/(n+1);
        for(let i=0;i<n;i++){
            const relX = margin+sp*(i+1);
            if(p.type==='lift' || p.type==='slide'){
                p.coinItems.push({relX, collected:false});
            } else {
                freeCoins.push({x:p.x+relX, y:p.y-28, collected:false});
            }
        }
    }

    if(p.type==='normal'){
        boosterState.platformsSinceLast++;
        if(boosterState.platformsSinceLast >= nextBoosterIn){
            const avail  = boosterTypes.filter(t=>t!==boosterState.lastType);
            const picked = avail[Math.floor(Math.random()*avail.length)];
            const myCoins = freeCoins.filter(c=>c.x>=p.x && c.x<=p.x+p.w);
            let rx, tries=0, safe=false;
            do {
                rx   = margin+Math.random()*usable;
                safe = myCoins.every(c=>Math.abs((p.x+rx)-c.x)>32);
                tries++;
            } while(!safe && tries<10);
            p.booster = {relX:rx, type:picked, collected:false};
            boosterState.lastType           = picked;
            boosterState.platformsSinceLast = 0;
            nextBoosterIn = boosterState.minInterval + Math.floor(Math.random()*(boosterState.maxInterval-boosterState.minInterval+1));
        }
    }
}

// ── МИНЫ ───────────────────────────────
function trySpawnHazardsInGap(x1End,x2Start,y1,y2,noMines=false){
    const gapW=x2Start-x1End;
    if(gapW<70) return;
    if(noMines) return;   // рядом со slide: вообще без мин
    const diff=Math.min(score/1500,1);
    // Во время бонуса роста — больше мин (весело давить)
    const growing = player.growTimer > 0;
    const chance  = growing ? 0.72 : 0.25+diff*0.35;
    if(Math.random()>chance) return;
    const count = growing ? (Math.random()<0.6?2:1) : (Math.random()<0.35?2:1);
    const midY=(y1+y2)/2;
    for(let i=0;i<count;i++){
        const hx=x1End+28+Math.random()*(gapW-56);
        const hy=midY-10+(Math.random()-0.5)*60;
        hazards.push({x:hx,y:hy,r:18,phase:Math.random()*Math.PI*2,bobPhase:Math.random()*Math.PI*2});
    }
}

// ── ГЕНЕРАЦИЯ СЛЕДУЮЩЕЙ ПЛАТФОРМЫ ──────
function generateNextPlatform(){
    const last=platforms[platforms.length-1];
    const diff=Math.min(score/3000,3);
    const gap=65+Math.random()*110+diff*35;
    const width=110+Math.random()*160;
    let newY=last.y+(Math.random()-0.5)*160;
    newY=Math.max(420,Math.min(780,newY));
    const newX=last.x+last.w+gap;

    const liftC  =Math.min(score/2000,0.24);
    const crumbleC=Math.min(score/1200,0.16);
    const springC =Math.min(score/800, 0.12);
    const slideC  =Math.min(score/1000,0.18);
    const rnd=Math.random();
    let type='normal';
    if(rnd<liftC)                              type='lift';
    else if(rnd<liftC+crumbleC)               type='crumble';
    else if(rnd<liftC+crumbleC+springC)       type='spring';
    else if(rnd<liftC+crumbleC+springC+slideC) type='slide';

    const p=createPlatform(newX,newY,width,type);
    decoratePlatform(p);
    platforms.push(p);
    // #4: slide-зона без мин
    trySpawnHazardsInGap(last.x+last.w,newX,last.y,newY, type==='slide'||last.type==='slide');
    lastPlatformEnd=newX+width;

    // ── #3: Страховочная пара для slide ──────────────────────
    // Появляется с шансом 65% после 800м
    if(type==='slide' && score>800 && Math.random()<0.65){
        const floorDiff = 190 + Math.random()*100; // разница Y ≥190px
        const goUp      = newY > 600;               // если основная низко — страховка выше
        const safetyY   = goUp
            ? Math.max(300, newY - floorDiff)
            : Math.min(800, newY + floorDiff);

        const safetyW = 110 + Math.random()*70;
        // Страховочная платформа начинается чуть правее основной
        const safetyX = newX + width*0.2 + Math.random()*width*0.3;

        // Проверка: не пересекаемся с другими платформами
        const overlaps = platforms.some(q =>
            !q.dead &&
            safetyX < q.x+q.w+30 && safetyX+safetyW > q.x-30 &&
            Math.abs(safetyY - q.y) < 55
        );

        if(!overlaps && safetyY > 280 && safetyY < 830){
            const safety = createPlatform(safetyX, safetyY, safetyW, 'slide');
            decoratePlatform(safety);
            platforms.push(safety);
            if(safetyX+safetyW > lastPlatformEnd) lastPlatformEnd = safetyX+safetyW;

            // ── Промежуточная «мостовая» платформа ───────────
            // Ставим нормальную платформу между двумя slide по Y,
            // чтобы игрок мог выбраться со страховочной обратно
            const midY2   = (newY + safetyY) / 2;
            const midX    = safetyX + safetyW + 60 + Math.random()*80;
            const midW    = 100 + Math.random()*60;
            const midOverlaps = platforms.some(q =>
                !q.dead &&
                midX < q.x+q.w+25 && midX+midW > q.x-25 &&
                Math.abs(midY2 - q.y) < 50
            );
            if(!midOverlaps && midY2 > 300 && midY2 < 820){
                const bridge = createPlatform(midX, midY2, midW, 'normal');
                decoratePlatform(bridge);
                platforms.push(bridge);
                if(midX+midW > lastPlatformEnd) lastPlatformEnd = midX+midW;
            }
        }
    }
}

// ── СБРОС ИГРЫ ─────────────────────────
function resetGame(){
    currentShape       = shapes[Math.floor(Math.random()*shapes.length)];
    currentPlayerColor = playerColors[Math.floor(Math.random()*playerColors.length)];
    currentTheme       = themes[Math.floor(Math.random()*themes.length)];

    Object.assign(player, {
        x:110, y:620, vy:0, rotation:0, grounded:true, jumpsLeft:2,
        shield:false, shieldTimer:0, superJumpTimer:0, speedBoostTimer:0,
        growTimer:0, growScale:1, shrinkGrace:0,
        onLift:null, prevLiftY:0, onSlide:null, dead:false, deathAnim:null
    });

    cameraX=0; score=0; totalCoins=0;
    currentSpeed=baseSpeed; lastPlatformEnd=720;
    particles=[]; hazards=[]; freeCoins=[];
    trailBuf=[]; speedTrailBuf=[];
    MEDALS = buildMedals();
    boosterState = {lastType:null, platformsSinceLast:0, minInterval:4, maxInterval:9};
    nextBoosterIn = 5;

    platforms = [
        createPlatform(0,   720, 900),
        createPlatform(1010,650, 160),
        createPlatform(1250,740, 190),
        createPlatform(1530,580, 140),
    ];
    for(let i=1;i<platforms.length;i++) decoratePlatform(platforms[i]);
    for(let i=0;i<14;i++) generateNextPlatform();

    updateCoinsHud();
    drawCoinIcon();
    document.getElementById('score').textContent = '0 м';
}