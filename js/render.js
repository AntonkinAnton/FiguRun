// ═══════════════════════════════════════
//  render.js — вся отрисовка
//  Загружается после state.js
// ═══════════════════════════════════════

function drawParticle(pt) {
    ctx.save(); ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color;
    if (pt.shape === 'square') { ctx.fillRect(pt.x - pt.size * pt.life / 2, pt.y - pt.size * pt.life / 2, pt.size * pt.life, pt.size * pt.life); }
    else if (pt.shape === 'drop') { ctx.beginPath(); ctx.ellipse(pt.x, pt.y, pt.size * pt.life * 0.5, pt.size * pt.life, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    // Сотрясение экрана (megaGrow приземление)
    if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake * 2;
        const sy = (Math.random() - 0.5) * screenShake * 2;
        ctx.save();
        ctx.translate(sx, sy);
    }

    // Небо
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, currentTheme.skyTop || '#4a9eff'); grad.addColorStop(1, currentTheme.skyBot || '#b0e0ff');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Облака
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    const cloudPeriod = W + 500;
    for (let c of clouds) {
        const raw = c.x - cameraX * 0.25;
        const cx = ((raw % cloudPeriod) + cloudPeriod) % cloudPeriod - 150;
        ctx.save(); ctx.translate(cx, c.y); ctx.scale(c.s, c.s);
        ctx.beginPath(); ctx.ellipse(0, 0, 95, 38, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(50, -18, 55, 32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // ── ПЛАТФОРМЫ ───────────────────────────────────────────
    for (let p of platforms) {
        if (p.dead) continue;
        const sx = p.x - cameraX;
        if (sx > W + 150 || sx + p.w < -150) continue;
        ctx.save();
        ctx.globalAlpha = (p.type === 'crumble' && p.crumbleFalling) ? p.crumbleAlpha : 1;
        if (p.type === 'crumble' && p.crumbleFalling && p.crumbleTimer < 12)
            ctx.translate((Math.random() - 0.5) * (12 - p.crumbleTimer) * 0.6, 0);

        if (p.type === 'lift') { ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 14; ctx.fillStyle = '#006080'; ctx.strokeStyle = '#00e5ff'; }
        else if (p.type === 'crumble') { ctx.fillStyle = '#7d3c00'; ctx.strokeStyle = '#5a2800'; }
        else if (p.type === 'spring') { ctx.fillStyle = '#1b4332'; ctx.strokeStyle = '#52b788'; }
        else if (p.type === 'slide') { ctx.shadowColor = '#f39c12'; ctx.shadowBlur = 10; ctx.fillStyle = '#7d4e00'; ctx.strokeStyle = '#f39c12'; }
        else if (p.type === 'lcd') { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10; ctx.fillStyle = 'rgba(200,230,255,0.55)'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; }
        else { ctx.fillStyle = currentTheme.plat; ctx.strokeStyle = currentTheme.stroke; }
        ctx.lineWidth = 7; ctx.fillRect(sx, p.y, p.w, p.h); ctx.strokeRect(sx, p.y, p.w, p.h); ctx.shadowBlur = 0;

        if (p.type === 'lift') ctx.fillStyle = '#00b8d4';
        else if (p.type === 'crumble') ctx.fillStyle = '#c0392b';
        else if (p.type === 'spring') ctx.fillStyle = '#52b788';
        else if (p.type === 'slide') ctx.fillStyle = '#f39c12';
        else if (p.type === 'lcd') ctx.fillStyle = 'rgb(255, 255, 255)';
        else ctx.fillStyle = currentTheme.grass;
        ctx.fillRect(sx, p.y - 10, p.w, 14);

        if (p.type === 'lift') { ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↕', sx + p.w / 2, p.y + 22); }
        if (p.type === 'slide') { ctx.fillStyle = '#f39c12'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('←→', sx + p.w / 2, p.y + 22); }
        if (p.type === 'crumble') { ctx.strokeStyle = 'rgba(255,160,0,0.85)'; ctx.lineWidth = 2;[0.2, 0.45, 0.7, 0.88].forEach(f => { ctx.beginPath(); ctx.moveTo(sx + p.w * f, p.y); ctx.lineTo(sx + p.w * f + 8, p.y + p.h); ctx.stroke(); }); }

        // Батут
        if (p.type === 'spring') {
            const postH = 22, postW = 8, margin2 = 14, n = 3;
            ctx.fillStyle = '#74c69d';
            ctx.fillRect(sx + margin2 - postW / 2, p.y - postH, postW, postH);
            ctx.fillRect(sx + p.w - margin2 - postW / 2, p.y - postH, postW, postH);
            const onSp = !player.dead && player.grounded && player.y + player.size >= p.y - 2 && player.x + player.size > sx && player.x < sx + p.w;
            const sag = onSp ? 8 : 2;
            const lx = sx + margin2, rx = sx + p.w - margin2, ty = p.y - postH;
            ctx.beginPath(); ctx.moveTo(lx, ty); ctx.quadraticCurveTo((lx + rx) / 2, ty + sag, rx, ty); ctx.strokeStyle = '#b7e4c7'; ctx.lineWidth = 5; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lx, ty); ctx.quadraticCurveTo((lx + rx) / 2, ty + sag, rx, ty); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = '#52b788'; ctx.lineWidth = 2;
            for (let i = 0; i < n; i++) { const fx = (i + 1) / (n + 1); const bx2 = lx + (rx - lx) * fx; const bezY = ty + 2 * sag * fx * (1 - fx) + sag * fx * fx; ctx.beginPath(); ctx.moveTo(bx2, p.y); ctx.lineTo(bx2, bezY); ctx.stroke(); }
        }

        // Монеты лифта и слайда
        if (p.type === 'lift' || p.type === 'slide') {
            for (let c of p.coinItems) {
                if (c.collected) continue;
                const cx2 = sx + c.relX, cy2 = p.y - 28;
                const bounce = Math.sin(gameTime / 18 + c.relX) * 4;
                ctx.save(); ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 8; ctx.fillStyle = '#f1c40f'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(cx2, cy2 + bounce, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(cx2 - 3, cy2 + bounce - 3, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
        }

        ctx.restore();
    }

    // ── Свободные монеты (под бустерами) ────────────────────
    for (let c of freeCoins) {
        if (c.collected) continue;
        const cx2 = c.x - cameraX, cy2 = c.y;
        if (cx2 < -20 || cx2 > W + 20) continue;
        const bounce = Math.sin(gameTime / 18 + c.x) * 4;
        ctx.save();
        ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#f1c40f'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx2, cy2 + bounce, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(cx2 - 3, cy2 + bounce - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // ── Бустеры (поверх монет) ───────────────────────────────
    for (let p of platforms) {
        if (p.dead) continue;
        const sx = p.x - cameraX;
        if (sx > W + 150 || sx + p.w < -150) continue;
        if (!p.booster || p.booster.collected) continue;
        const bx = sx + p.booster.relX, by = p.y - 36, pulse = 0.85 + Math.sin(gameTime / 12) * 0.15;
        let bgColor, icon;
        if (p.booster.type === 'jump') { bgColor = '#00bcd4'; icon = '⚡'; }
        else if (p.booster.type === 'speed') { bgColor = '#ff9800'; icon = '🚀'; }
        else if (p.booster.type === 'grow') { bgColor = '#e74c3c'; icon = '💪'; }
        else { bgColor = '#8bc34a'; icon = '🛡️'; }
        ctx.save(); ctx.translate(bx, by); ctx.scale(pulse, pulse); ctx.shadowColor = bgColor; ctx.shadowBlur = 14; ctx.fillStyle = bgColor;
        ctx.beginPath(); ctx.roundRect(-16, -16, 32, 32, 8); ctx.fill();
        ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, 0, 1); ctx.restore();
    }

    // ── МИНЫ ─────────────────────────────────────────────────
    for (let h of hazards) {
        const hx = h.x - cameraX;
        if (hx + h.r * 2 < -60 || hx - h.r > W + 60) continue;
        const bob = Math.sin(gameTime / 30 + h.bobPhase) * 5;
        const cx = hx + h.r, cy = h.y + bob;
        ctx.save(); ctx.translate(cx, cy);
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, h.r * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(h.phase);
        const sc = 12, r = h.r, r2 = r + 8;
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < sc; i++) {
            const a = (Math.PI * 2 / sc) * i;
            ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        }
        ctx.stroke();
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        for (let i = 0; i < sc; i++) {
            const a = (Math.PI * 2 / sc) * i;
            const ix = Math.cos(a), iy = Math.sin(a);
            ctx.moveTo(ix * r2 + iy * 2.5, iy * r2 - ix * 2.5);
            ctx.lineTo(ix * r2 - iy * 2.5, iy * r2 + ix * 2.5);
            ctx.lineTo(ix * (r2 + 6), iy * (r2 + 6));
        }
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(0, 0, h.r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // ── ЧАСТИЦЫ ─────────────────────────────────────────────
    for (let pt of particles) drawParticle(pt);

    // pop кольцо
    if (player.dead && player.deathAnim?.type === 'pop' && player.deathAnim?.ring) {
        const rng = player.deathAnim.ring;
        ctx.save(); ctx.globalAlpha = rng.alpha; ctx.strokeStyle = currentPlayerColor; ctx.lineWidth = 4; ctx.shadowColor = currentPlayerColor; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(player.deathAnim.x, player.deathAnim.y, rng.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }

    // ── ФИГУРА ──────────────────────────────────────────────
    if (!player.dead) {
        const s = player.size;
        const gs = player.growScale;           // текущий масштаб (1..4)
        const es = s * gs;                     // эффективный размер

        // Смещение при росте — фигура остаётся у левого края.
        // При megaGrow прячем часть фигуры за левый край экрана.
        const camOffset = player.megaGrow
            ? (gs - 1) * s * 0.6
            : (gs - 1) * s * 0.4;

        // Оранжевый ghost-trail ускорения
        if (speedTrailBuf.length > 0) {
            for (let i = 0; i < speedTrailBuf.length; i++) {
                const age = (i + 1) / speedTrailBuf.length;
                ctx.save();
                ctx.globalAlpha = age * 0.42;
                const tf = speedTrailBuf[i];
                ctx.translate(tf.x - cameraX + s / 2, tf.y + s / 2);
                ctx.rotate(tf.r);
                ctx.fillStyle = '#ff9800';
                const tgs = s * (0.55 + age * 0.3);
                if (currentShape === 'square') { ctx.fillRect(-tgs / 2, -tgs / 2, tgs, tgs); }
                else if (currentShape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, tgs / 2, 0, Math.PI * 2); ctx.fill(); }
                else if (currentShape === 'triangle') { ctx.beginPath(); ctx.moveTo(0, -tgs / 2); ctx.lineTo(tgs / 2, tgs / 2); ctx.lineTo(-tgs / 2, tgs / 2); ctx.closePath(); ctx.fill(); }
                else if (currentShape === 'diamond') { ctx.beginPath(); ctx.moveTo(0, -tgs / 2); ctx.lineTo(tgs / 2, 0); ctx.lineTo(0, tgs / 2); ctx.lineTo(-tgs / 2, 0); ctx.closePath(); ctx.fill(); }
                ctx.restore();
            }
        }

        // Аура супер-прыжка (показывается всегда, в т.ч. во время grow)
        if (player.superJumpTimer > 0) {
            const pulse = 0.06 + Math.sin(performance.now() / 120) * 0.03;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(player.x + s / 2, player.y + s / 2, s * 0.58, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Голубой ghost-trail супер-прыжка
        if (trailBuf.length > 0) {
            for (let i = 0; i < trailBuf.length; i++) {
                const tf = trailBuf[i];
                const age = i / trailBuf.length;
                ctx.save();
                ctx.globalAlpha = age * 0.45;
                ctx.translate(tf.x + s / 2, tf.y + s / 2);
                ctx.rotate(tf.r);
                ctx.fillStyle = '#00e5ff';
                const tgs = s * (0.55 + age * 0.3);
                if (currentShape === 'square') { ctx.fillRect(-tgs / 2, -tgs / 2, tgs, tgs); }
                else if (currentShape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, tgs / 2, 0, Math.PI * 2); ctx.fill(); }
                else if (currentShape === 'triangle') { ctx.beginPath(); ctx.moveTo(0, -tgs / 2); ctx.lineTo(tgs / 2, tgs / 2); ctx.lineTo(-tgs / 2, tgs / 2); ctx.closePath(); ctx.fill(); }
                else if (currentShape === 'diamond') { ctx.beginPath(); ctx.moveTo(0, -tgs / 2); ctx.lineTo(tgs / 2, 0); ctx.lineTo(0, tgs / 2); ctx.lineTo(-tgs / 2, 0); ctx.closePath(); ctx.fill(); }
                ctx.restore();
            }
        }

        // Центр фигуры с учётом growScale и смещения
        const figCX = player.x + es / 2 - camOffset;
        const figCY = player.y + es / 2;

        // Мигание перед окончанием grow (последние 90 кадров) и во время grace-периода
        let figAlpha = 1;

        if (player.growTimer > 0 && player.growTimer < 90) {
            const period = 600; // полный цикл (мс)
            const wave = Math.sin(performance.now() * (2 * Math.PI / period));
            figAlpha = wave > 0 ? 1 : 0.25;

        } else if (player.shrinkGrace > 0) {
            const period = 600;
            const wave = Math.sin(performance.now() * (2 * Math.PI / period));
            figAlpha = wave > 0 ? 0.9 : 0.2;
        }

        ctx.save();
        ctx.globalAlpha = figAlpha;
        ctx.translate(figCX, figCY);
        ctx.rotate(player.rotation);
        ctx.scale(gs, gs);

        // Щит
        if (player.shield) {
            const pulse = 0.45 + Math.sin(performance.now() / 140) * 0.15;
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#8bc34a';
            ctx.beginPath(); ctx.arc(0, 0, s * 0.70, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 5;
            ctx.shadowColor = '#8bc34a'; ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(0, 0, s * 0.80, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        // Свечение супер-прыжка (работает и во время grow)
        if (player.superJumpTimer > 0) {
            ctx.save();
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 14;
        }

        // Тело фигуры
        ctx.fillStyle = currentPlayerColor;
        if (currentShape === 'square') { ctx.fillRect(-s / 2, -s / 2, s, s); }
        else if (currentShape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (currentShape === 'triangle') { ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.lineTo(-s / 2, s / 2); ctx.closePath(); ctx.fill(); }
        else if (currentShape === 'diamond') { ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, 0); ctx.lineTo(0, s / 2); ctx.lineTo(-s / 2, 0); ctx.closePath(); ctx.fill(); }

        // Закрываем save для shadowBlur супер-прыжка (если был открыт)
        if (player.superJumpTimer > 0) { ctx.restore(); }

        // Лицо
        if (player.megaGrow) {
            // Пафосное лицо: полуприкрытые глаза + уголки рта вниз
            // Белки глаз
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.18, s * 0.11, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.18, s * 0.11, 0, Math.PI * 2); ctx.fill();
            // Зрачки — смотрят чуть вниз (усталый взгляд)
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.14, s * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.14, s * 0.05, 0, Math.PI * 2); ctx.fill();
            // Веки — полуприкрытые (прямая линия по верхней половине глаза)
            ctx.fillStyle = currentPlayerColor;
            ctx.beginPath(); ctx.rect(-s * 0.33, -s * 0.30, s * 0.22, s * 0.12); ctx.fill();
            ctx.beginPath(); ctx.rect(s * 0.11, -s * 0.30, s * 0.22, s * 0.12); ctx.fill();
            // Рот — уголки вниз (перевёрнутая дуга)
            ctx.strokeStyle = '#222'; ctx.lineWidth = s * 0.05;
            ctx.beginPath(); ctx.arc(0, s * 0.22, s * 0.16, Math.PI + 0.35, -0.35); ctx.stroke();
        } else {
            // Обычное лицо
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.18, s * 0.11, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.18, s * 0.11, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.18, s * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.18, s * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = s * 0.05;
            ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.19, 0.25, Math.PI - 0.25); ctx.stroke();
        }

        // Хмурые брови при grow
        if (player.growTimer > 0 || player.growScale > 1.1) {
            ctx.strokeStyle = '#111'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
            // левая бровь — наклонена вниз к центру
            ctx.beginPath(); ctx.moveTo(-s * 0.33, -s * 0.31); ctx.lineTo(-s * 0.11, -s * 0.26); ctx.stroke();
            // правая бровь — наклонена вниз к центру
            ctx.beginPath(); ctx.moveTo(s * 0.33, -s * 0.31); ctx.lineTo(s * 0.11, -s * 0.26); ctx.stroke();
        }

        // Внешнее свечение супер-прыжка (работает и во время grow)
        if (player.superJumpTimer > 0) {
            const pulse = 0.5 + Math.sin(performance.now() / 120) * 0.2;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3;
            ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 14;
            if (currentShape === 'square') { ctx.strokeRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4); }
            else if (currentShape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2 + 3, 0, Math.PI * 2); ctx.stroke(); }
            else if (currentShape === 'triangle') { ctx.beginPath(); ctx.moveTo(0, -s / 2 - 3); ctx.lineTo(s / 2 + 3, s / 2 + 3); ctx.lineTo(-s / 2 - 3, s / 2 + 3); ctx.closePath(); ctx.stroke(); }
            else if (currentShape === 'diamond') { ctx.beginPath(); ctx.moveTo(0, -s / 2 - 3); ctx.lineTo(s / 2 + 3, 0); ctx.lineTo(0, s / 2 + 3); ctx.lineTo(-s / 2 - 3, 0); ctx.closePath(); ctx.stroke(); }
            ctx.restore();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── HUD: бустеры ────────────────────────────────────────
    let hudY = 70;
    if (player.speedBoostTimer > 0) {
        const f = player.speedBoostTimer / SPEED_BOOST_DUR;
        ctx.fillStyle = '#ff9800'; ctx.fillRect(16, hudY, 120 * f, 8); ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 2; ctx.strokeRect(16, hudY, 120, 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('🚀', 16, hudY + 20); hudY += 30;
    }
    if (player.superJumpTimer > 0) {
        const f = player.superJumpTimer / 300;
        ctx.fillStyle = '#00bcd4'; ctx.fillRect(16, hudY, 120 * f, 8); ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 2; ctx.strokeRect(16, hudY, 120, 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('⚡', 16, hudY + 20); hudY += 30;
    }
    if (player.shield) {
        const f = player.shieldTimer / 400;
        ctx.fillStyle = '#8bc34a'; ctx.fillRect(16, hudY, 120 * f, 8); ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 2; ctx.strokeRect(16, hudY, 120, 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('🛡️', 16, hudY + 20); hudY += 30;
    }
    if (player.growTimer > 0) {
        const f = player.growTimer / GROW_DUR;
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(16, hudY, 120 * f, 8); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.strokeRect(16, hudY, 120, 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('💪', 16, hudY + 20);
    }

    // Затемнение при паузе
    if (paused) {
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    // ── LCD UI OVERLAY ────────────────────────────────────────
    if (lcdActive) {

        const text = 'РИСУЙ ПЛАТФОРМУ!';

        const t = performance.now() / 1000;
        const scale = 1 + Math.sin(t * 6) * 0.12;
        const alpha = 0.85 + Math.sin(t * 4) * 0.15;

        ctx.save();

        const baseX = W - 24;
        const baseY = 72;

        const fontSize = Math.round(Math.max(22, Math.min(W * 0.096, 32)));
        ctx.font = `bold ${fontSize}px sans-serif`;

        // 👉 вычисляем ширину текста
        const textWidth = ctx.measureText(text).width;

        // 👉 центр текста (учитывая align right)
        const centerX = baseX - textWidth / 2;
        const centerY = baseY;

        // 👉 перенос в центр
        ctx.translate(centerX, centerY);

        // наклон
        ctx.rotate(0.18);

        // масштаб от центра
        ctx.scale(scale, scale);

        ctx.globalAlpha = alpha;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // glow
        ctx.shadowColor = '#ff2600';
        ctx.shadowBlur = 16;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 0, 0);

        ctx.restore();


        // ─────────────────────────
        // 🔘 КНОПКА
        // ─────────────────────────

        const btnX = 16, btnY = 72, btnW = 170, btnH = 42, btnR = 12;

        // лёгкий pulse
        const btnPulse = 1 + Math.sin(t * 5) * 0.05;

        ctx.save();

        ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
        ctx.scale(btnPulse, btnPulse);
        ctx.translate(-btnW / 2, -btnH / 2);

        // фон (градиент)
        const btnGrad = ctx.createLinearGradient(0, 0, btnW, btnH);
        btnGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        btnGrad.addColorStop(1, 'rgba(0,0,0,0.3)');

        ctx.fillStyle = btnGrad;

        ctx.strokeStyle = 'rgba(0,200,255,0.8)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(0, 0, btnW, btnH, btnR);
        ctx.fill();
        ctx.stroke();

        // glow
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;

        // текст
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('ПРОПУСТИТЬ', btnW / 2, btnH / 2);

        ctx.restore();
    }
    if (lcdActive || timeScale < 0.98) {
        const intensity = Math.max(0, 1 - timeScale); // 0=норма, 1=макс замедление

        // Лёгкий холодно-белый tint на весь экран
        ctx.save();
        ctx.globalAlpha = intensity * 0.12;
        ctx.fillStyle = '#e8f4ff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Виньетка по краям — радиальный градиент от прозрачного к голубоватому
        ctx.save();
        const vgn = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78);
        vgn.addColorStop(0, 'rgba(180,220,255,0)');
        vgn.addColorStop(1, `rgba(120,180,255,${(intensity * 0.28).toFixed(2)})`);
        ctx.fillStyle = vgn;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // ── РИСУЕМАЯ ЛИНИЯ (LCD) ─────────────────────────────────
    if (lcdActive && drawPoints.length >= 2) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 28;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
        for (let i = 1; i < drawPoints.length; i++)
            ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
        ctx.stroke();

        // Внутренняя яркая линия
        ctx.lineWidth = 24;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.shadowColor = '#a0d8ff';
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
        for (let i = 1; i < drawPoints.length; i++)
            ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
        ctx.stroke();
        ctx.restore();
    }

    // Закрываем сотрясение экрана
    if (screenShake > 0) ctx.restore();
}