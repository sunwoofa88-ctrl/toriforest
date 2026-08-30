#!/bin/bash
# 도토리숲 — 수정 후 반드시 통과해야 하는 검증 일괄 실행
# 사용법:  bash verify.sh          (전체)
#          bash verify.sh quick    (회귀 + NaN + 정적분석만)
set -u
cd "$(dirname "$0")"
export NODE_PATH=$(npm root -g)
FAIL=0
run(){ echo; echo "══ $1"; shift; "$@" 2>&1 | tail -"${TAIL:-14}"; }

echo "══ 빌드"; python3 build.py || { echo "!! 빌드 실패"; exit 1; }
cp -f tests/t_*.js /tmp/ 2>/dev/null

run "정적 분석 (구문·중복선언·도달불가)" node t_static.js
run "회귀 25종"        node t_regress.js
run "NaN·예외"         node t_nan.js
run "글꼴 오프라인"     node t_font.js
[ "${1:-all}" = quick ] && exit 0
run "갤럭시 9기종"      node t_galaxy.js
TAIL=6 run "몬스터 그림 240"  bash -c 'node tests/t_spec.js >/dev/null 2>&1; python3 audit_mon.py'
TAIL=8 run "무기 48종 기하 감사" node /tmp/t_audit3.js
echo
echo "※ 숫자가 통과해도 반드시 눈으로 본다:"
echo "   node /tmp/t_hold.js      → /tmp/hold48.png (무기 48종 파지)"
echo "   node /tmp/t_armhand.js   → 갑옷 6종 착용샷"
echo "   node /tmp/t_armgame.js   → 인게임"
