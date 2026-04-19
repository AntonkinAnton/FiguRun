// ═══════════════════════════════════════
//  boosters.js — логика бустеров
//  Загружается после player.js, ui.js
// ═══════════════════════════════════════

function applyBooster(type, x, y){
    if(type==='jump'){
        player.superJumpTimer = 300;
        spawnParticles(x, y, '#00e5ff', 12);
        showMedal('⚡ Супер-прыжок!');
    } else if(type==='speed'){
        player.speedBoostTimer = SPEED_BOOST_DUR;
        spawnParticles(x, y, '#ff9800', 12);
        showMedal('🚀 Ускорение!');
    } else if(type==='shield'){
        player.shield      = true;
        player.shieldTimer = 400;
        spawnParticles(x, y, '#8bc34a', 12);
        showMedal('🛡️ Щит!');
    } else if(type==='grow'){
        player.growTimer = GROW_DUR;
        spawnParticles(x, y, '#e74c3c', 16, {spd:1.4, size:8});
        showMedal('💪 Сила!');
    }
    ga('booster_collected', { booster_type: type, distance_m: Math.floor(score) });
}