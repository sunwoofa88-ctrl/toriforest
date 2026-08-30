# source env.sh — 이 컨테이너에서 도토리숲 작업 전에 한 번 실행
export NODE_PATH=$(npm root -g)          # playwright/acorn 이 전역에 있다
export ANDROID_SDK_ROOT=/usr/lib/android-sdk
export PATH="$PATH:/usr/lib/android-sdk/build-tools/34.0.0"
