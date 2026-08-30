/* 정적 정밀 분석 : 구문트리로 훑는다 (눈으로 안 보고) */
const fs=require('fs'), acorn=require('acorn'), walk=require('acorn-walk');
const src=fs.readFileSync('/root/toriforest/game.html','utf8');
const m=src.match(/<script[^>]*>([\s\S]*)<\/script>/);
const code=m[1];
const off=src.indexOf(code);
function lineOf(pos){ return src.slice(0,off+pos).split('\n').length; }
let ast;
try{ ast=acorn.parse(code,{ecmaVersion:2020,locations:true}); }
catch(e){ console.log('❌ 구문오류: '+e.message); process.exit(1); }
console.log('✅ 구문 정상 ('+code.split('\n').length+'줄)');

/* ── 1) 최상위 var / function 중복 선언 (FXS 충돌 유형) ── */
const topVars={}, topFns={};
for(const n of ast.body){
  if(n.type==='VariableDeclaration'){
    for(const d of n.declarations){
      if(d.id.type!=='Identifier') continue;
      (topVars[d.id.name]=topVars[d.id.name]||[]).push({line:lineOf(d.start), init:!!d.init});
    }
  } else if(n.type==='FunctionDeclaration' && n.id){
    (topFns[n.id.name]=topFns[n.id.name]||[]).push(lineOf(n.start));
  }
}
const dupVar=Object.entries(topVars).filter(([k,v])=>v.filter(x=>x.init).length>1);
const dupFn =Object.entries(topFns).filter(([k,v])=>v.length>1);
console.log('\n── 최상위 중복 선언 ──');
if(!dupVar.length) console.log('  ✅ 값을 넣는 var 중복 없음');
else dupVar.forEach(([k,v])=>console.log(`  ❌ var ${k} — ${v.filter(x=>x.init).map(x=>x.line+'줄').join(', ')} 에서 각각 값 대입 (나중 것이 이긴다)`));
if(!dupFn.length) console.log('  ✅ function 중복 정의 없음');
else dupFn.forEach(([k,v])=>console.log(`  ❌ function ${k} — ${v.join('줄, ')}줄 (나중 것이 앞의 것을 덮는다)`));

/* ── 2) 선언되지 않은 식별자 참조 ── */
const declared=new Set([...Object.keys(topVars),...Object.keys(topFns)]);
const BUILTIN=new Set(('window document navigator console Math JSON Date Array Object String Number Boolean '+
 'Error TypeError RangeError Promise Set Map WeakMap Symbol Infinity NaN undefined null true false '+
 'parseInt parseFloat isNaN isFinite setTimeout clearTimeout setInterval clearInterval '+
 'requestAnimationFrame cancelAnimationFrame performance localStorage sessionStorage '+
 'Float32Array Int32Array Uint8Array Uint8ClampedArray Uint16Array Int16Array Uint32Array '+
 'CanvasRenderingContext2D Image Audio AudioContext webkitAudioContext OffscreenCanvas '+
 'Touch TouchEvent PointerEvent MouseEvent KeyboardEvent CustomEvent Event screen history '+
 'location fetch URL Blob FileReader devicePixelRatio innerWidth innerHeight arguments this '+
 'globalThis Reflect Proxy Intl RegExp Function eval encodeURIComponent decodeURIComponent '+
 'btoa atob structuredClone queueMicrotask matchMedia getComputedStyle alert').split(' '));
const scopes=[new Set()];
const unknown=new Map();
function addScope(){ scopes.push(new Set()); }
function popScope(){ scopes.pop(); }
function declare(name){ scopes[scopes.length-1].add(name); }
function known(name){
  if(declared.has(name)||BUILTIN.has(name)) return true;
  for(const s of scopes) if(s.has(name)) return true;
  return false;
}
function declPattern(p){
  if(!p) return;
  if(p.type==='Identifier') declare(p.name);
  else if(p.type==='ObjectPattern') p.properties.forEach(pr=>declPattern(pr.value||pr.argument));
  else if(p.type==='ArrayPattern') p.elements.forEach(e=>declPattern(e));
  else if(p.type==='AssignmentPattern') declPattern(p.left);
  else if(p.type==='RestElement') declPattern(p.argument);
}
function hoist(body){
  walk.recursive({type:'Program',body},null,{
    Function(){}, // 중첩 함수 내부는 그 함수 스코프에서 처리
    VariableDeclaration(n,st,c){ n.declarations.forEach(d=>declPattern(d.id)); },
    FunctionDeclaration(n){ if(n.id) declare(n.id.name); }
  });
}
function doFn(n,c){
  addScope();
  (n.params||[]).forEach(declPattern);
  if(n.id) declare(n.id.name);
  const body = n.body.type==='BlockStatement'? n.body.body : [n.body];
  hoist(body);
  body.forEach(b=>c(b,null));
  popScope();
}
walk.recursive(ast,null,{
  Program(n,st,c){ hoist(n.body); n.body.forEach(b=>c(b,null)); },
  FunctionDeclaration:doFn, FunctionExpression:doFn, ArrowFunctionExpression:doFn,
  CatchClause(n,st,c){ addScope(); declPattern(n.param); n.body.body.forEach(b=>c(b,null)); popScope(); },
  MemberExpression(n,st,c){ c(n.object,null); if(n.computed) c(n.property,null); },
  Property(n,st,c){ if(n.computed) c(n.key,null); c(n.value,null); },
  LabeledStatement(n,st,c){ c(n.body,null); },
  BreakStatement(){}, ContinueStatement(){},
  Identifier(n){ if(!known(n.name)){ const L=lineOf(n.start); if(!unknown.has(n.name)) unknown.set(n.name,L); } }
});
console.log('\n── 선언 없이 쓰는 식별자 ──');
if(!unknown.size) console.log('  ✅ 없음');
else for(const [k,v] of unknown) console.log(`  ⚠ ${k}  (${v}줄 최초)`);

/* ── 3) 도달 불가 코드 (return/break 뒤) ── */
let dead=[];
walk.simple(ast,{BlockStatement(n){
  for(let i=0;i<n.body.length-1;i++){
    const t=n.body[i].type;
    if(t==='ReturnStatement'||t==='BreakStatement'||t==='ContinueStatement'||t==='ThrowStatement'){
      const nx=n.body[i+1];
      if(nx.type!=='FunctionDeclaration') dead.push(lineOf(nx.start));
    }
  }
}});
console.log('\n── 도달 불가 코드 ──');
console.log(dead.length? '  ❌ '+dead.length+'곳: '+dead.slice(0,10).join(', ')+'줄' : '  ✅ 없음');

/* ── 4) 항상 참/거짓인 조건, 자기대입 ── */
let sus=[];
walk.simple(ast,{
  AssignmentExpression(n){
    if(n.operator==='=' && n.left.type==='Identifier' && n.right.type==='Identifier'
       && n.left.name===n.right.name) sus.push(`자기대입 ${n.left.name} (${lineOf(n.start)}줄)`);
  },
  BinaryExpression(n){
    if((n.operator==='==='||n.operator==='!==') && n.left.type==='Identifier' && n.right.type==='Identifier'
       && n.left.name===n.right.name) sus.push(`자기비교 ${n.left.name} (${lineOf(n.start)}줄)`);
  }
});
console.log('\n── 의심 표현식 ──');
console.log(sus.length? '  ❌ '+sus.join('\n     ') : '  ✅ 없음');
