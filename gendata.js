/* ============================================================================
   대규모 콘텐츠 생성기 — 바이옴 10 · 챕터 100 · 종족 120 · 재료 72 · 능력 30
   모두 시드 기반 파라메트릭 생성 + 바이옴 규칙으로 큐레이션
   ========================================================================== */
function rngOf(seed){ return mulberry32(seed>>>0); }
function pick(r,arr){ return arr[(r()*arr.length)|0]; }

/* ---------- 10 바이옴 ---------- */
var BIOME=[
 {id:'meadow', n:'이슬 풀숲',   arche:'forest',  tree:'leafy',   sky:'#A9E9FF',
  pal:{grass:['#79CE5C','#5FAF46'],grass2:'#8FDC72',path:'#D2AE78',pathEdge:'#B98F58',tall:'#93D651',
       water:['#63C8F0','#2E92C4'],sand:'#F0DCA8',rock:'#A79A88',rockTop:'#C4B8A6',
       flower:['#FF9FC4','#FFE47A','#FFFFFF'],amb:'#FFF3B0'},
  tint:['#7ED45F','#4FA33C'], hues:[95,120,150], dark:0},
 {id:'night',  n:'반딧불 밤숲', arche:'forest',  tree:'conifer', sky:'#3D2F6B',
  pal:{grass:['#4A5C86','#38466A'],grass2:'#5A6E9C',path:'#6B5F8E',pathEdge:'#514678',tall:'#4E8F72',
       water:['#6A7FE0','#3B4BA8'],sand:'#7C7096',rock:'#5B5178',rockTop:'#7A6E9A',
       flower:['#C6FF8A','#9FE6FF','#E3D4FF'],amb:'#C6FF8A'},
  tint:['#8C7FD0','#5B4E9C'], hues:[250,280,200], dark:1},
 {id:'lake',   n:'윤슬 호숫가', arche:'lake',    tree:'leafy',   sky:'#9EE7FF',
  pal:{grass:['#7FD98F','#57B071'],grass2:'#9BE8A6',path:'#E4D4A2',pathEdge:'#C4AE79',tall:'#6ECF9B',
       water:['#5FD3F5','#2A9CD4'],sand:'#F6E6BC',rock:'#9FAFB4',rockTop:'#C2CFD2',
       flower:['#FFD6EC','#BFF3FF','#FFFBCF'],amb:'#DFF9FF'},
  tint:['#5FD3F5','#2A9CD4'], hues:[185,200,160], dark:0},
 {id:'canyon', n:'메아리 협곡', arche:'canyon',  tree:'dead',    sky:'#FFD9A8',
  pal:{grass:['#C9A06A','#A87F4A'],grass2:'#DCB47C',path:'#F0DCAE',pathEdge:'#C9A672',tall:'#B9903F',
       water:['#7FD0E8','#3E9AC0'],sand:'#F2DEAE',rock:'#8E6A46',rockTop:'#B08A5E',
       flower:['#FF9A5C','#FFD86B','#FFF0C4'],amb:'#FFE9B0'},
  tint:['#C98B4E','#8E5A28'], hues:[30,45,15], dark:0},
 {id:'volcano',n:'불꽃 골짜기', arche:'volcano', tree:'spire',   sky:'#FFB36B',
  pal:{grass:['#8E4526','#5F2C15'],grass2:'#A85C38',path:'#EFC38C',pathEdge:'#B8763F',tall:'#D07A32',
       water:['#FF9A52','#D9450F'],sand:'#F5D6A2',rock:'#4E2A19',rockTop:'#7A452C',
       flower:['#FFD34E','#FF8A3D','#FFF0A0'],amb:'#FFD07A'},
  tint:['#FF8A3D','#D9450F'], hues:[10,25,350], dark:0},
 {id:'frost',  n:'서리 언덕',   arche:'snow',    tree:'conifer', sky:'#BFE9FF',
  pal:{grass:['#CFE2EF','#A9C4D6'],grass2:'#E8F4FC',path:'#A6BECE',pathEdge:'#7F9AAE',tall:'#7FB6D2',
       water:['#8FE3FF','#3E92C4'],sand:'#DCE9F2',rock:'#5E7488',rockTop:'#88A0B2',
       flower:['#FFFFFF','#BFE9FF','#D9C4FF'],amb:'#DFF6FF'},
  tint:['#BFE9FF','#6FA8CC'], hues:[195,210,230], dark:0},
 {id:'desert', n:'모래알 사막', arche:'desert',  tree:'cactus',  sky:'#FFE9B0',
  pal:{grass:['#F0D89A','#D8B96E'],grass2:'#FAE7B4',path:'#E8C88A',pathEdge:'#C4A469',tall:'#C9BE6A',
       water:['#7FE0E8','#33A8BC'],sand:'#FBEDC4',rock:'#C49A62',rockTop:'#E0BC86',
       flower:['#FF8FA8','#FFD34E','#C79BFF'],amb:'#FFF0C0'},
  tint:['#5BA84E','#2E7A3C'], hues:[40,55,20], dark:0},
 {id:'swamp',  n:'몽글 늪지',   arche:'swamp',   tree:'leafy',   sky:'#9CBF8E',
  pal:{grass:['#6E8E5A','#4E6B3E'],grass2:'#84A66C',path:'#8E8256',pathEdge:'#6E6440',tall:'#5C8C4A',
       water:['#7CA05E','#4A6B38'],sand:'#A89C6E',rock:'#6E7A5E',rockTop:'#8E9A78',
       flower:['#C8FF9F','#FFE47A','#D9C4FF'],amb:'#CFE8A8'},
  tint:['#8FBF6A','#4E6B3E'], hues:[80,100,60], dark:0},
 {id:'sky',    n:'구름 위 섬',  arche:'sky',     tree:'leafy',   sky:'#C4EEFF',
  pal:{grass:['#A8E8C4','#7FC9A4'],grass2:'#C4F2D8',path:'#F2EAD2',pathEdge:'#D2C6A4',tall:'#8FDCB4',
       water:['#BFEFFF','#7FC9E8'],sand:'#FBF2DC',rock:'#C4D2E0',rockTop:'#E2ECF4',
       flower:['#FFD6EC','#FFFBCF','#D9EEFF'],amb:'#EFFAFF'},
  tint:['#8FE0C0','#3E8C6A'], hues:[168,192,300], dark:0},
 {id:'star',   n:'별빛 정원',   arche:'star',    tree:'conifer', sky:'#2E2154',
  pal:{grass:['#4E3F86','#372C63'],grass2:'#6250A6',path:'#8E76C4',pathEdge:'#6A54A0',tall:'#7A5FC4',
       water:['#A88FFF','#6B4FC4'],sand:'#9A86C8',rock:'#463A72',rockTop:'#6A5A9C',
       flower:['#FFE47A','#FF9FC4','#9FE6FF'],amb:'#FFE9A8'},
  tint:['#C79BFF','#7A4FC4'], hues:[275,300,45], dark:1}
];

/* ---------- 색 유틸 : HSL → hex ---------- */
function hsl(h,s,l){
  h=((h%360)+360)%360; s/=100; l/=100;
  var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r,g,b;
  if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return rgb([(r+m)*255,(g+m)*255,(b+m)*255]);
}

/* ---------- 이름 조립 ---------- */
var PRE_ADJ=['반짝','뾰족','말랑','포근','꼬물','통통','새침','살랑','바스락','아장','토실','몽글','쫄깃','까칠','부스스','샐쭉','오독','폴짝','대롱','소복'];
var PRE_ELEM={
  meadow:['이슬','풀잎','새싹','들꽃','솔방울'], night:['반딧불','달빛','그믐','밤안개','부엉'],
  lake:['윤슬','물방울','조약돌','물풀','산호'], canyon:['모래바람','메아리','돌조각','협곡','흙먼지'],
  volcano:['불씨','용암','잿빛','화산','숯덩'], frost:['서리','눈송이','고드름','얼음','북풍'],
  desert:['모래알','신기루','선인장','태양','오아시스'], swamp:['안개','수렁','버섯','이끼','늪물'],
  sky:['구름','바람','깃털','무지개','천둥'], star:['별빛','은하','유성','달무리','우주']
};
var BODY_N=['벌레','젤리','버섯','다람쥐','토끼','고양이','부엉이','두더지','거북','여우','곰','새','박쥐','도마뱀','달팽이','고슴도치','수달','너구리','펭귄','올빼미','두꺼비','도롱뇽','나비','반딧불이','생쥐','햄스터','오소리','바다표범','알파카','판다'];
var TITLE=['왕','대왕','장군','수호자','여왕','대장'];

/* ---------- 부품 테이블 ---------- */
var P_SHAPE=['round','egg','blob','tall'];
var P_EAR=['none','round','pointy','long','tuft','antenna'];
var P_HAT=['none','none','none','mushroom','leaf','horn','flame','ice','snow','spike','crown','crest','antler','shell'];
var P_EYE=['big','big','big','dot','angry','sleepy','sparkle'];
var P_MOUTH=['smile','smile','grumpy','fang','beak'];
var P_ARM=['stub','paw','wing','none'];
var P_TAIL=['none','none','small','bushy','fin'];

/* ---------- 종족 생성 : 바이옴당 12종 = 120종 ---------- */
var SPECIES={};      /* key -> spec */
var SPECIES_BY_BIOME=[];
function buildSpecies(){
  var used={}, key, bi, i;
  for(bi=0; bi<BIOME.length; bi++){
    var B=BIOME[bi], list=[];
    for(i=0;i<12;i++){
      var r=rngOf(7919*(bi+1)+131*(i+3));
      var rank = i<8 ? 0 : (i<11 ? 1 : 2);            /* 0 일반 1 정예 2 보스 */
      var hue = B.hues[(r()*B.hues.length)|0] + (r()-0.5)*46;
      var sat = rank===2? 62+r()*22 : 46+r()*34;
      var lig = B.dark? (rank===2?58:52)+r()*14 : (rank===2?60:64)+r()*14;
      var body=hsl(hue,sat,lig), body2=hsl(hue+(r()-0.5)*22, sat*0.92, lig-20);
      var belly=hsl(hue+(r()-0.5)*30, sat*0.42, Math.min(96,lig+26));
      var earC=hsl(hue+(r()-0.5)*26, sat*0.9, lig-8);
      var accH=hue+120+(r()-0.5)*90;
      var spec={
        shape:pick(r,P_SHAPE),
        body:body, body2:body2, belly:belly,
        ear:pick(r,P_EAR), earColor:earC,
        eye: rank? (r()<0.62?'angry':'sparkle') : pick(r,P_EYE),
        mouth: rank? (r()<0.6?'fang':'grumpy') : pick(r,P_MOUTH),
        cheek: r()<0.72? hsl(accH,72,76) : null,
        arms:pick(r,P_ARM), feet: r()<0.72?'round':'none',
        tail:pick(r,P_TAIL), tailColor:hsl(hue+(r()-0.5)*20,sat*0.8,lig+6),
        outline: hsl(hue, Math.min(60,sat*0.7), B.dark? 16 : 20),
        w:0.66+r()*0.26, h:0.66+r()*0.26,
        ox:0
      };
      if(spec.tail==='bushy') spec.ox=9;
      var hat=pick(r,P_HAT);
      if(rank===2) hat='crown';
      else if(rank===1 && hat==='none') hat=pick(r,['horn','crest','antler','spike']);
      if(hat!=='none'){ spec.hat=hat; spec.hatColor=hsl(accH,74,rank?62:66); }
      if(B.id==='night'||B.id==='star'||B.id==='swamp'){ if(r()<0.4) spec.glow=hsl(hue+40,90,74); }
      if(rank===2){ spec.w=0.92+r()*0.12; spec.h=0.90+r()*0.12; spec.glow=spec.glow||hsl(accH,88,72); }

      /* 이름 */
      var nm, guard=0;
      do{
        var a = r()<0.5? pick(r,PRE_ELEM[B.id]) : pick(r,PRE_ADJ);
        nm = a + ' ' + pick(r,BODY_N);
        if(rank===2) nm = pick(r,PRE_ELEM[B.id])+' '+pick(r,BODY_N)+pick(r,TITLE);
        else if(rank===1) nm = a+' '+pick(r,BODY_N);
        guard++;
      } while(used[nm] && guard<40);
      used[nm]=1;

      key = B.id+'_'+i;
      var tierMul = rank===2? 26 : (rank===1? 2.4 : 1);
      var base = 24 + bi*13;
      SPECIES[key]={
        n:nm, key:key, art:spec, biome:bi, rank:rank,
        hp: Math.round(base*tierMul*(0.8+r()*0.5)),
        atk: Math.round((5+bi*2.1)*(rank===2?1.5:(rank===1?1.2:1))*(0.85+r()*0.35)),
        spd: Math.round((22+r()*34)*(rank===2?0.8:1)),
        sz: Math.round((rank===2? 150 : (rank===1? 92 : 70+r()*22))),
        fly: (spec.arms==='wing' && r()<0.62)?1:0,
        tough: (rank===1 && r()<0.5)?1:0,
        boss: rank===2?1:0,
        xp: Math.round((4+bi*3.4)*(rank===2?18:(rank===1?3.2:1))),
        elem: bi,
        abil: null,
        drop: []
      };
      list.push(key);
    }
    SPECIES_BY_BIOME.push(list);
  }
}

/* ---------- 재료 72종 : 12계열 × 6형태 ---------- */
var MAT_FAM=[
 {id:'leafy', n:'풀잎', hue:110, t:1}, {id:'stone', n:'조약', hue:34,  t:1},
 {id:'jelly', n:'말랑', hue:330, t:1}, {id:'pollenf',n:'꽃',  hue:52,  t:1},
 {id:'honey', n:'꿀',   hue:38,  t:2}, {id:'glowf', n:'반딧불',hue:82, t:2},
 {id:'frostf',n:'서리', hue:196, t:2}, {id:'emberf',n:'불씨', hue:18,  t:2},
 {id:'windf', n:'바람', hue:170, t:3}, {id:'crystalf',n:'수정',hue:186,t:3},
 {id:'shadef',n:'그믐', hue:268, t:3}, {id:'starf', n:'별빛', hue:46,  t:4}
];
var MAT_FORM=[
 {id:'shard',n:'조각', sh:'shard'}, {id:'drop', n:'방울', sh:'drop'},
 {id:'dust', n:'가루', sh:'pollen'},{id:'seed', n:'씨앗', sh:'pebble'},
 {id:'stone',n:'돌',   sh:'jelly'}, {id:'gem',  n:'결정', sh:'gem'}
];
var MAT={}, MAT_IDS=[], TIER_POOL={1:[],2:[],3:[],4:[]};
function buildMats(){
  for(var f=0;f<MAT_FAM.length;f++){
    var F=MAT_FAM[f];
    for(var s=0;s<MAT_FORM.length;s++){
      var M=MAT_FORM[s], id=F.id+'_'+M.id;
      var r=rngOf(f*911+s*37);
      MAT[id]={ n:F.n+' '+M.n, t:F.t, c:hsl(F.hue+(r()-0.5)*22, 62+r()*26, 58+r()*16), sh:M.sh, fam:f };
      MAT_IDS.push(id); TIER_POOL[F.t].push(id);
    }
  }
}

/* ---------- 능력 30종 × 3단계 = 90형태 ---------- */
var ELEM=[
 {id:'acorn', n:'도토리', hue:'#C9995E', pre:['','큰','황금']},
 {id:'fire',  n:'불꽃',   hue:'#FF8A3D', pre:['','화산','드래곤']},
 {id:'ice',   n:'서리',   hue:'#8FE3FF', pre:['','눈보라','오로라']},
 {id:'leaf',  n:'잎사귀', hue:'#8CF07A', pre:['','회오리','수정']},
 {id:'wind',  n:'바람',   hue:'#BFF3FF', pre:['','돌풍','태풍']},
 {id:'stone', n:'바위',   hue:'#C0A98A', pre:['','거석','운석']},
 {id:'water', n:'물빛',   hue:'#63C8F0', pre:['','파도','해일']},
 {id:'light', n:'햇살',   hue:'#FFE47A', pre:['','섬광','천상']},
 {id:'shade', n:'그믐',   hue:'#A67BE8', pre:['','심연','칠흑']},
 {id:'star',  n:'별빛',   hue:'#FFD34E', pre:['','유성','은하']}
];
var ARCHE=[
 {id:'blade', n:'검',   kinds:['melee','melee','spin'],  dmg:1.00, cd:0.27, rng:150, arc:1.35},
 {id:'cast',  n:'지팡이',kinds:['proj','beam','nova'],   dmg:0.86, cd:0.30, rng:380, arc:0.60},
 {id:'heavy', n:'망치', kinds:['melee','lob','trap'],    dmg:1.55, cd:0.58, rng:132, arc:1.75}
];
var ABIL={}, ABIL_IDS=[];
function buildAbils(){
  var kindCycle=['melee','beam','proj','spin','lob','nova','chain','orbit','laser','trap','summon'];
  for(var e=0;e<ELEM.length;e++){
    for(var a=0;a<ARCHE.length;a++){
      var E=ELEM[e], A=ARCHE[a], id=E.id+'_'+A.id;
      var idx=e*3+a;
      var KP=[ ['melee','spin','orbit','laser','chain'],
               ['proj','beam','nova','chain','laser','summon'],
               ['lob','trap','nova','melee','summon'] ][a];
      var kind = KP[e % KP.length];
      var r=rngOf(idx*577+13);
      var KR={melee:152,spin:330,orbit:126,laser:760,chain:300,proj:430,beam:200,nova:196,lob:360,trap:158,summon:150};
      var KC={melee:0.27,spin:0.40,orbit:2.60,laser:0.62,chain:0.42,proj:0.34,beam:0.10,nova:0.66,lob:0.58,trap:2.20,summon:5.00};
      var KD={melee:1.00,spin:0.86,orbit:0.55,laser:1.90,chain:0.78,proj:1.00,beam:0.30,nova:1.35,lob:1.50,trap:0.90,summon:1.70};
      var KH={melee:1.6,spin:1.4,orbit:5.0,laser:2.2,chain:3.0,proj:1.0,beam:1.0,nova:3.2,lob:2.4,trap:4.0,summon:8.0};
      var kRng=KR[kind]*(1+a*0.06), kCd=KC[kind]*(a===2?1.12:(a===1?1.0:0.96)), kArc=A.arc;
      var archeF=(a===0?1.00:(a===1?0.94:1.12));
      var targetDps=(26+idx*7.2)*archeF;
      baseDmg = targetDps*kCd/KH[kind];
      ABIL[id]={
        key:id, kind:kind, hue:E.hue, elem:e, arche:a,
        names:[E.n+' '+A.n, E.pre[1]+' '+E.n+' '+A.n, E.pre[2]+' '+E.n+' '+A.n],
        desc:ABIL_DESC(kind),
        dmg:[baseDmg, baseDmg*1.62, baseDmg*2.55],
        cd:[kCd, kCd*0.92, kCd*0.84],
        range:[kRng, kRng*1.16, kRng*1.34],
        arc:[kArc, kArc*1.12, kArc*1.24],
        evo:[{cards:3, mat:pickMats(idx,1,2)},{cards:6, mat:pickMats(idx,3,2)}]
      };
      ABIL_IDS.push(id);
    }
  }
}
function ABIL_DESC(k){
  var D={
    melee:['앞을 크게 베어요','더 크고 더 아프게!','빛의 칼날이 뚫고 지나가요'],
    beam :['앞으로 쭉 뿜어요','뿜는 범위가 넓어져요','오래 붙어서 계속 아파요'],
    proj :['앞으로 날아가요','더 빠르고 더 아파요','몬스터를 뚫고 지나가요'],
    spin :['부메랑처럼 돌아와요','두 개가 같이 날아가요','몬스터를 뚫고 지나가요'],
    lob  :['던져서 펑! 터져요','두 번 터져요','폭발이 아주 넓어요'],
    nova :['내 주변으로 확 퍼져요','더 넓게 퍼져요','두 번 연달아 퍼져요'],
    chain:['몬스터 사이를 톡톡 튀어요','더 많이 튀어요','튈 때마다 더 아파요'],
    orbit:['내 주위를 빙글빙글 돌아요','도는 개수가 늘어요','더 크게 돌아요'],
    laser:['일직선으로 쭉 뚫어요','더 길고 굵어져요','한 번에 여러 줄!'],
    trap :['바닥에 장판을 깔아요','장판이 더 오래가요','장판이 아주 넓어요'],
    summon:['작은 친구를 불러요','친구가 둘이 돼요','친구가 아주 세져요']
  };
  return D[k]||D.melee;
}
function pickMats(idx,tier,cnt){
  var r=rngOf(idx*313+tier*97), out={}, pool=TIER_POOL[tier];
  for(var i=0;i<cnt;i++){
    var m=pool[(r()*pool.length)|0];
    out[m]=(out[m]||0) + (tier>=3? 2 : 6);
  }
  if(tier>=3) out[TIER_POOL[4][(r()*TIER_POOL[4].length)|0]]=1;
  return out;
}

/* ---------- 종족 드랍/능력 연결 ---------- */
function linkSpecies(){
  var keys=Object.keys(SPECIES);
  for(var i=0;i<keys.length;i++){
    var sp=SPECIES[keys[i]], bi=sp.biome, r=rngOf(i*751+29);
    /* 드랍 : 자기 바이옴 계열 위주 + 가끔 상위 */
    var famBase=(bi*1.2)|0, drops=[];
    for(var d=0;d<3;d++){
      var fam=Math.min(MAT_FAM.length-1, Math.max(0, famBase + ((r()*3)|0) - 1));
      if(sp.rank>=1 && d===2) fam=Math.min(MAT_FAM.length-1, fam+4);
      var form=(r()*MAT_FORM.length)|0;
      drops.push(MAT_FAM[fam].id+'_'+MAT_FORM[form].id);
    }
    sp.drop=drops;
    /* 능력 : 일부 종만 보유 (흡입 대상) */
    if(sp.rank<=1 && r()<0.55){
      var e=Math.min(ELEM.length-1, Math.floor(bi*0.95 + (r()<0.5?0:1)));
      var a=(r()*ARCHE.length)|0;
      sp.abil = ELEM[e].id+'_'+ARCHE[a].id;
    }
    if(sp.rank===2) sp.abil = ELEM[Math.min(ELEM.length-1,bi)].id+'_'+ARCHE[(i%3)].id;
  }
}

/* ---------- 챕터 100 ---------- */
var CHAPTERS=100;
function chapBiome(c){ return Math.min(BIOME.length-1, Math.floor(c/10)); }
function chapIsBoss(c){ return (c%10)===9; }
function chapMul(c){ return 1 + c*0.40 + Math.pow(c,2.0)*0.0080; }
function chapName(c){ return (c+1)+'장 · '+BIOME[chapBiome(c)].n; }
function chapKillNeed(c){ return 12 + (c%10)*2 + Math.floor(c/10)*3; }
function chapMobs(c){
  var bi=chapBiome(c), sub=c%10, list=SPECIES_BY_BIOME[bi];
  var out=[];
  var n = sub<3? 3 : (sub<6? 4 : 5);
  for(var i=0;i<n;i++) out.push(list[(sub+i*2)%8]);
  if(sub>=4) out.push(list[8+(sub%3)]);        /* 정예 */
  return out;
}
function chapBoss(c){
  var bi=chapBiome(c);
  return SPECIES_BY_BIOME[bi][11];
}
function buildAll(){ buildMats(); buildSpecies(); buildAbils(); linkSpecies(); }
