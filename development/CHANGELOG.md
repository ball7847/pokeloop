# 변경 이력 및 보존 원문

현행 규칙이 아닌 역사 자료. 2026-11-26 PR #202 병합 당시의 원문을 Git 커밋에 영구 보존했다. 아래 링크에서 과거 기획·폐기 규칙·구 테스트 원문을 확인할 수 있다.

- [development/DEVELOPMENT_GUIDE.md 이전 원문](https://github.com/ball7847/pokeloop/blob/aec9a73ee7b6c5a606d77e215a34fd665183ffd4/development/DEVELOPMENT_GUIDE.md)
- [development/IMPLEMENTED_SYSTEMS.md 이전 원문](https://github.com/ball7847/pokeloop/blob/aec9a73ee7b6c5a606d77e215a34fd665183ffd4/development/IMPLEMENTED_SYSTEMS.md)
- [development/PLANNED_SYSTEMS.md 이전 원문](https://github.com/ball7847/pokeloop/blob/aec9a73ee7b6c5a606d77e215a34fd665183ffd4/development/PLANNED_SYSTEMS.md)
- [development/VIRTUAL_PLAY_RULES.md 이전 원문](https://github.com/ball7847/pokeloop/blob/aec9a73ee7b6c5a606d77e215a34fd665183ffd4/development/VIRTUAL_PLAY_RULES.md)
- [tests/virtualPlaythrough.test.js 이전 원문](https://github.com/ball7847/pokeloop/blob/aec9a73ee7b6c5a606d77e215a34fd665183ffd4/tests/virtualPlaythrough.test.js)

## 주요 변경
- #188~191: 행성별 추가 추첨, 2계층 비교 보고서, 이정표 개편.
- #194~199: 노말 중심 에너지, 계층 승리 해금과 승계, 보상/특성/강화 재조정, 피카츄 보너스, 가상플레이 정책 변경. 과거 확정 등장, v17, 타입별 동일 보상, 이전 가격 등 폐기.
- #200: 사망 이후 연타 중단, hybrid 및 전체 JSON 아티팩트.
- #201: 실제/추정 전투 정산 공통화.
- #202: 지역·진화 등록 구조 일반화.
- 이번 정리: 현행 문서 교체, 역사 원문 링크 보존, 과거 경제 의존 skip 3건을 현재 규칙의 합성 fixture 회귀 테스트로 대체.

- 전체 점검 8번: v18 형식 유지, 저장 정합성 복구 및 역사적 예외 진단, 등장 컨테이너 검증 보완.

- 테스트 경량화: 일반 회귀와 최신/과거 가상플레이 실행 분리, 핵심 제어 전투 및 RNG 회귀 유지, CSS 역사적 체크섬 제거.

- 가상플레이 정확도 개선: 기본 exact 이벤트 경계, 출현/진화/전투 RNG 분리, 시간·원장·도전 기록, 갱신된 등장 목록, 보수적 반복 판단, 보고서 v3. 게임 밸런스 유지.

- 2026-11-26: 승인된 1·2지역 전체 기본 에너지 보상 하향, 슬로스타트 노말 0.5/s, HP/공격 증가 비용 배율 1.4. 이정표·3지역·능력치 보상 유지. 가상플레이 대기 계산은 실제 생산 상수 참조.

- 2026-11-26: 베리숲 보상 재조정: 테일로20, 푸푸린22, 니드런 암수29, 덩쿠리35, 비버니40 유지, 비구술59, 트로피우스200.
