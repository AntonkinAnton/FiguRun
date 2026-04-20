// ═══════════════════════════════════════
//  config.js — константы и визуальные данные
// ═══════════════════════════════════════

const W = 540, H = 960;

const GRAVITY         = 0.95;
const JUMP            = -19.5;
const SUPER_JUMP      = -27;
const BOUNCE_VY       = -28;
const SPEED_BOOST_ADD = 3.5;
const SPEED_BOOST_DUR = 120;
const GROW_SCALE      = 3.5;    // во сколько раз увеличивается фигура
const GROW_DUR        = 480;  // кадров действия бонуса

const TRAIL_LEN = 8;

const shapes       = ['square','circle','triangle','diamond'];
const playerColors = ['#e74c3c','#3498db','#2ecc71','#f1c40f','#9b59b6','#e67e22','#1abc9c','#ff6b5e'];
const themes = [
    {skyTop:'#4a9eff',skyBot:'#b0e0ff',plat:'#3d250f',stroke:'#2a1808',grass:'#27ae60'},
    {skyTop:'#6a4cff',skyBot:'#a0a0ff',plat:'#2c3e50',stroke:'#1c2a38',grass:'#1abc9c'},
    {skyTop:'#ff9e4a',skyBot:'#ffd04a',plat:'#8d5524',stroke:'#5e3a1a',grass:'#f1c40f'},
    {skyTop:'#2ecc71',skyBot:'#27ae60',plat:'#27ae60',stroke:'#1e8449',grass:'#f39c12'},
    {skyTop:'#ff5e9e',skyBot:'#ffb3e6',plat:'#8e44ad',stroke:'#5e2a7a',grass:'#e67e22'},
];
const clouds = [{x:80,y:140,s:1.1},{x:320,y:210,s:0.85},{x:480,y:110,s:1.3},{x:720,y:250,s:0.9}];

const boosterTypes = ['jump','speed','shield','grow'];

const DEATH_TYPES  = ['explode','dissolve','pop','melt','unravel'];
const DEATH_TITLES = {
    explode:'💥 ВЗРЫВ!', dissolve:'✨ РАСПАЛСЯ!',
    pop:'🫧 ЛОП!', melt:'💧 РАСПЛАВИЛСЯ!', unravel:'🧵 РАСПУСТИЛСЯ!'
};

function buildMedals(){
    const f=[
        {dist:500,label:'🥉 500 м!'},{dist:2000,label:'🥈 2000 м!'},
        {dist:4000,label:'🥇 4000 м!'},{dist:7000,label:'🏅 7000 м!'},
        {dist:10000,label:'🏆 10000 м!'},{dist:15000,label:'💎 15000 м!'},
        {dist:20000,label:'🌟 20000 м!'},
    ];
    for(let d=30000;d<=200000;d+=10000) f.push({dist:d,label:`🔥 ${d} м!`});
    return f.map(m=>({...m,shown:false}));
}
