# PokeLoop 개발 가이드

> 2026-11-26 현행 코드 기준: PR #202 병합 `aec9a73ee7b6c5a606d77e215a34fd665183ffd4`. 다음 변경 시 최신 main 재확인. 과거 문서는 [CHANGELOG.md](./CHANGELOG.md) 참조.

## 프로젝트
- PokeLoop: 포켓몬 테마 자동 전투·성장·재화 생산 방치형 게임.
- 개발: https://github.com/ball7847/pokeloop ; 실행: https://ball7847.github.io/pokeloop/
- 원작 Rejected Draft는 사용자 요청 시에만 https://github.com/ball7847/rejected-draft-reference 의 `steam/source/` 또는 `web/` 실제 코드로 분석. 읽기 전용, 수정/PR/병합 금지. `pokeloop2`는 배포용 별도 저장소이며 원작 분석 근거로 사용하지 않는다.

## 문서 역할
- 본 문서: 개발 절차와 파일 위치.
- [IMPLEMENTED_SYSTEMS.md](./IMPLEMENTED_SYSTEMS.md): 현행 규칙과 값.
- [PLANNED_SYSTEMS.md](./PLANNED_SYSTEMS.md): 미구현/미확정 계획.
- [VIRTUAL_PLAY_RULES.md](./VIRTUAL_PLAY_RULES.md): 현행 시뮬레이션 정책.
- [CHANGELOG.md](./CHANGELOG.md): 역사 기록 및 이전 문서 원문 링크. 현행 규칙의 근거로 사용 금지.
- 변경 시 기존 현행 항목을 갱신하고 폐기 규칙은 변경 이력에 기록한다. 코드와 충돌하면 확인 후 문서를 바로잡되 문서에 맞추기 위해 코드 무단 변경 금지. 문서 기준 SHA/날짜 갱신.

## 기술 및 위치
Vite 7, React 19, Zustand 5, break_eternity.js 2.1, JavaScript ES modules.
- `src/main.jsx`, `src/App.jsx`, `src/pages/`, `src/components/`, `src/styles/` UI.
- `src/store/useGameStore.js`, `src/core/gameState.js`, `GameClocks.jsx` 상태/시계.
- `src/core/combatEngine.js`, `combatVisualEvents.js`, `dittoStats.js` 전투/정산/능력치.
- `src/core/wildCatalog.js`, `wildRegistry.js`, `wildData.js`, `raritySystem.js`, `planetEncounterBonuses.js`, `planetTransition.js` 지역/진화/등장/이동.
- `src/core/energySystem.js`, `shopSystem.js`, `stellarUpgrades.js`, `abilityAutomation.js`, `bigNumber.js` 경제/강화.
- `src/core/saveCodec.js`, `saveSystem.js`, `encounterSave.js`, `saveValidation.js` 저장(v18). `itemSystem.js` 도구 기반.
- `tests/`, `tests/helpers/virtualPlaySimulator.js`, `expectedCombat.js`, `fastBattleSettlement.js`, `seededRandom.js` 회귀/시뮬레이션.
- `.github/workflows/verify.yml`, `deploy.yml` CI/배포.

## 작업 규칙
1. 최신 main SHA와 위 4개 현행 문서를 읽고 코드 우선 대조한다.
2. 사용자 승인 범위를 지킨다. 사전 검토 요청이면 수정 전에 설명한다. 승인 후 추가 승인 없이 진행.
3. main에서 별도 브랜치와 PR. main 직접 푸시 금지. 기능/수치 무단 변경 금지.
4. npm test 및 npm run build 성공 확인 후 병합. 실패 원인을 수정하고 재검증. CI 진행 중에는 병합 완료로 보고하지 않는다.
5. 코드/테스트/빌드/병합/배포/실제 브라우저 확인을 구분한다. CI 회귀 실행은 사용자 요청 가상플레이 분석과 별개다.
6. 새 가상플레이는 사용자 명시 요청에만 실행. 저장 형식 변경, CSS 광범위 정리, 새로운 밸런스는 별도 승인.
7. 전체 점검 8번: 저장 데이터 정합성 보완. 이후 콘텐츠 개발은 사용자 지정; CSS/실기기 검증은 별도 승인.

## 새 대화 인수인계
GitHub ball7847/pokeloop의 development/DEVELOPMENT_GUIDE.md, IMPLEMENTED_SYSTEMS.md, PLANNED_SYSTEMS.md, VIRTUAL_PLAY_RULES.md를 읽고 최신 main 코드와 대조한다. 기존 1~3지역 55종과 밸런스를 유지하고, 승인 범위에서 브랜치·PR·CI 성공 확인·병합까지 수행한다. 원작은 별도 읽기 전용 저장소에서 요청 시 분석한다.
