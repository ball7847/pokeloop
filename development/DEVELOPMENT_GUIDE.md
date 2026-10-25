# PokeLoop 개발 가이드

> 문서 최초 작성: 2026-10-26 | 코드 대조 기준: `main` 커밋 `d32cd151fe38876064dc7e7b82c07a21e3ced992`
> 이 문서는 프로젝트 규칙과 개요를 기술한다. 상세한 **현재 구현**은 [IMPLEMENTED_SYSTEMS.md](./IMPLEMENTED_SYSTEMS.md), **개발 예정**은 [PLANNED_SYSTEMS.md](./PLANNED_SYSTEMS.md) 참고.

## 1. 프로젝트

- 게임: **PokeLoop** — Pokémon 테마의 자동 전투·성장·재화 생산 기반 방치형 게임.
- 개발 저장소: https://github.com/ball7847/pokeloop
- 실행 주소: https://ball7847.github.io/pokeloop/
- 참고 원작: **Rejected Draft**, https://github.com/ball7847/pokeloop2 (실행: https://ball7847.github.io/pokeloop2/).
- 원작 저장소는 **읽기·분석·비교 용도만 허용**하며 수정·커밋·PR·병합 금지. 원작의 구조를 참고하되 PokeLoop의 확정된 포켓몬/밸런스 규칙을 임의 변경하지 않는다.

## 2. 기술 구성 / 실제 코드 위치

- Vite 7, React 19, Zustand 5, break_eternity.js 2.1; JavaScript ES Modules.
- React 진입점: `src/main.jsx` → `src/App.jsx`; 예전 `src/main.js`와 `src/ui/`는 제거됨.
- 상태 및 액션: `src/store/useGameStore.js`, `src/core/gameState.js`.
- 전투: `src/core/combatEngine.js`, `src/core/combatVisualEvents.js`, `src/components/CombatPanel.jsx`, `src/components/CombatBarAnimator.jsx`.
- 포켓몬/지역: `src/core/wildData.js`; 성장·표시: `src/core/dittoStats.js`.
- 타입 에너지·입자·행성 이동: `src/core/energySystem.js`; 강화·자동화: `src/core/shopSystem.js`.
- 저장: `src/core/saveSystem.js`; 시계: `src/components/GameClocks.jsx`.
- 화면: `src/pages/`, `src/components/`; CSS: `src/styles/`, `src/style.css`; 테스트: `tests/`.
- CI: `.github/workflows/verify.yml`; GitHub Pages: `.github/workflows/deploy.yml`.

## 3. 개발 작업 규칙

1. **현재 `main` 코드와 이 문서 3개를 먼저 확인**한다. 구현 여부는 코드가 최우선 근거다. 문서와 코드가 충돌하면 확인 후 문서를 정정하며, 문서에 맞춘다는 이유만으로 코드를 임의 수정하지 않는다.
2. 새로운 기능의 확정/예정/미확정을 분리한다. 과거 대화의 아이디어를 확인 없이 확정된 기능으로 승격하지 않는다.
3. 기능 수정은 `main`에서 분기한 별도 브랜치에서 수행하고 PR을 만든다. **`main` 직접 푸시 금지**. 작은 변경 단위, 최소 영향 범위, 회귀 테스트 우선.
4. `npm test` 및 `npm run build` 성공을 확인한 뒤 PR을 병합한다. 실패 시 원인을 해결하고 다시 검증한다. 통과하지 않은 작업을 완료로 보고하지 않는다.
5. 사용자가 변경을 **사전 검토**하도록 요청했다면 분석/보고만 하고 승인 전 수정하지 않는다. 명시적으로 진행을 승인하면 개발할 수 있다.
6. 전투 공식·보상·진행 규칙·세이브 호환성·UI 레이아웃에 대한 임의 변경을 피한다. 리팩터링은 기존 동작을 유지하는 것이 기본이다.
7. 검증 결과를 보고할 때는 **코드 변경 / 테스트 / 빌드 / PR / 병합 / 배포 / 실제 브라우저 검증**을 각각 구분한다. CI 통과가 브라우저 실사용 검증을 의미하지는 않는다.
8. 원작 분석 시 저장소에 있는 배포용 압축 코드는 원본 개발 소스와 다를 수 있다. 확인한 사실과 추정한 설계를 구분한다.

## 4. 문서 운영 규칙

- 기본은 **세 파일만 유지**. 필요할 때만 세분화한다.
- `개발 문서 읽어`: 본 문서 → IMPLEMENTED_SYSTEMS → PLANNED_SYSTEMS 순으로 읽고 `main`의 현재 상태와 대조한다.
- `개발 문서 최신화`: 세 문서를 읽고 최신 코드/새로 확정된 기획과 비교한 다음 **변경이 필요한 문서만** 브랜치+PR로 갱신한다.
- 기능 구현 완료 시 IMPLEMENTED_SYSTEMS를 갱신하고, 계획했던 기능이라면 PLANNED_SYSTEMS에도 완료/이관 상태를 남기거나 삭제 사유를 기록한다.
- 파일 내 **코드 대조 기준 커밋·검증일** 갱신. 단순 문서 변경으로 게임 시스템이 구현됐다고 서술하지 않는다.
- 문서 수준: 공식, 기본값, 보상, 해금 조건, 관련 파일, 알려진 미연결 사항을 명시. 코드가 아닌 대화 정보는 별도 출처/확정 상태를 표시한다.

## 5. 새 대화용 명령

`GitHub ball7847/pokeloop의 development/ 폴더에 있는 개발 문서 3개를 읽고 최신 main 코드와 대조한 뒤 현재 개발을 이어서 진행해. 원작 ball7847/pokeloop2는 읽기 전용이야.`

## 6. 현재 주의사항

- 로컬 저장 세이브는 유저 데이터이므로 저장 버전을 함부로 바꾸거나 마이그레이션을 제거하지 않는다.
- 원작 시스템 전체가 PokeLoop에 구현된 것은 아니다. 특히 동화도/보너스와 고정 피해 경로는 계획 문서의 상태를 먼저 확인한다.
- 일부 CSS 덮어쓰기 구조는 남아 있으며, 화면 회귀 확인 없이 광범위하게 삭제하지 않는다.
