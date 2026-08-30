
/* ============================================================================
   펫 뽑기 — 5등급 × 60종, 하루 5회, 천장(pity) 포함
   ========================================================================== */
var PET_GRADE=[
  {id:'N',  n:'노멀',       col:'#B9B1A4', rate:55.0, dps:0.35, glow:0},
  {id:'R',  n:'레어',       col:'#5FB8FF', rate:30.0, dps:0.55, glow:0},
  {id:'U',  n:'유니크',     col:'#B77BFF', rate:11.0, dps:0.85, glow:1},
  {id:'SU', n:'슈퍼유니크', col:'#FF7AB8', rate: 3.5, dps:1.30, glow:1},
  {id:'L',  n:'레전드',     col:'#FFC93C', rate: 0.5, dps:2.00, glow:2}
];
var PET_PERK=[
  null,
  {acorn:0.08, txt:'도토리 +8%'},
  {acorn:0.14, star:0.5,  txt:'도토리 +14% · 별조각 더 자주'},
  {acorn:0.20, crit:0.06, txt:'도토리 +20% · 크리티컬 +6%'},
  {acorn:0.28, crit:0.10, regen:0.010, txt:'도토리 +28% · 크리티컬 +10% · 체력 회복'}
];
var PET_ADJ=['포근','살랑','반짝','통통','꼬물','솜사탕','달콤','구름','무지개','씩씩','상냥','장난꾸러기','졸린','용감','부끄럼','재빠른','느긋한','따끈','시원','몽실'];
var PET_ANIMAL=['토끼','고양이','강아지','병아리','여우','다람쥐','판다','수달','펭귄','알파카','햄스터','고슴도치','올빼미','두더지','거북','사슴','너구리','물범','앵무','유니콘'];
var PET_HAT=['none','none','round','crown','crest','antler','flame','ice','star','leaf'];
var PETS={}, PET_IDS=[], PET_BY_GRADE=[[],[],[],[],[]];
function buildPets(){
  var used={};
  for(var g=0; g<5; g++){
    for(var i=0;i<12;i++){
      var idx=g*12+i, r=rngOf(4177+idx*263);
      var hue=(r()*360)|0;
      var sat=(g>=3? 62:48)+r()*32, lig=(g===0?70:74)+r()*12;
      var spec={
        shape:pick(r,['round','egg','blob']),
        body:hsl(hue,sat,lig), body2:hsl(hue+(r()-0.5)*20,sat*0.92,lig-20),
        belly:hsl(hue+(r()-0.5)*26,sat*0.34,Math.min(97,lig+20)),
        ear:pick(r,['round','pointy','long','tuft','none']), earColor:hsl(hue+(r()-0.5)*24,sat*0.9,lig-6),
        eye: g>=3? 'sparkle' : pick(r,['big','big','dot','sparkle']),
        mouth:'smile', cheek:hsl(hue+150,74,78),
        arms:pick(r,['stub','paw','wing']), feet:r()<0.7?'round':'none',
        tail:pick(r,['none','small','bushy']), tailColor:hsl(hue+(r()-0.5)*18,sat*0.8,lig+5),
        outline:hsl(hue,Math.min(52,sat*0.6),20),
        w:0.60+r()*0.20, h:0.60+r()*0.20, ox:0
      };
      if(spec.tail==='bushy') spec.ox=8;
      var hat=PET_HAT[(r()*PET_HAT.length)|0];
      if(g===4) hat='crown'; else if(g===3 && hat==='none') hat='crest';
      if(hat!=='none'){ spec.hat=hat; spec.hatColor= g>=3? PET_GRADE[g].col : hsl(hue+120,72,66); }
      if(PET_GRADE[g].glow) spec.glow=PET_GRADE[g].col;
      var nm,guard=0;
      do{ nm=pick(r,PET_ADJ)+' '+pick(r,PET_ANIMAL); guard++; } while(used[nm]&&guard<50);
      used[nm]=1;
      var id='p'+idx;
      PETS[id]={ id:id, n:nm, grade:g, art:spec, dps:PET_GRADE[g].dps, perk:PET_PERK[g] };
      PET_IDS.push(id); PET_BY_GRADE[g].push(id);
    }
  }
}
/* ---- 뽑기 ---- */
function todayKey(){
  try{ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  catch(e){ return 'x'; }
}
function gachaState(){
  if(!S.gacha) S.gacha={day:'',used:0,total:0,pity:0,pityL:0};
  var t=todayKey();
  if(S.gacha.day!==t){ S.gacha.day=t; S.gacha.used=0; }
  return S.gacha;
}
var GACHA_PER_DAY=5;
function gachaLeft(){ var g=gachaState(); return Math.max(0, GACHA_PER_DAY-g.used); }
function rollGrade(g){
  /* 천장: 20회마다 유니크 이상, 150회마다 레전드 확정 */
  if(g.pityL>=149) return 4;
  if(g.pity>=19) return 2+((Math.random()<0.22)?1:0);
  var r=Math.random()*100, acc=0;
  for(var i=0;i<PET_GRADE.length;i++){ acc+=PET_GRADE[i].rate; if(r<acc) return i; }
  return 0;
}
function doGacha(){
  var g=gachaState();
  if(gachaLeft()<=0) return null;
  g.used++; g.total++; g.pity++; g.pityL++;
  var gr=rollGrade(g);
  if(gr>=2) g.pity=0;
  if(gr===4) g.pityL=0;
  var pool=PET_BY_GRADE[gr];
  var id=pool[(Math.random()*pool.length)|0];
  if(!S.pets) S.pets={};
  var dup=!!S.pets[id];
  if(dup){ S.pets[id]=(S.pets[id]|0)+1; }
  else { S.pets[id]=1; if(!S.petSlot) S.petSlot=[]; if(S.petSlot.length<3) S.petSlot.push(id); }
  saveGame(); needSync=1;
  return { id:id, grade:gr, dup:dup, lv:S.pets[id] };
}
/* ---- 장착 펫 효과 ---- */
function petBonus(){
  var b={acorn:0, star:0, crit:0, regen:0};
  if(!S.petSlot) return b;
  for(var i=0;i<S.petSlot.length;i++){
    var id=S.petSlot[i], p=PETS[id]; if(!p||!S.pets[id]) continue;
    var k=p.perk; if(!k) continue;
    var lvF=1+((S.pets[id]|0)-1)*0.06;
    if(k.acorn) b.acorn+=k.acorn*lvF;
    if(k.star)  b.star +=k.star*lvF;
    if(k.crit)  b.crit +=k.crit*lvF;
    if(k.regen) b.regen+=k.regen*lvF;
  }
  return b;
}
