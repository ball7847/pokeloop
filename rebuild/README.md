# PokeLoop Rebuild — Foundation 01
Rejected Draft의 진행 흐름을 참고하되 신규 엔진을 독립적으로 구현하는 개발 영역입니다.
기존 루트 게임 파일은 수정하지 않습니다.

## 실행
```sh
cd rebuild
npm install
npm run dev
npm test
npm run build
```

## 완료된 1단계 범위
- 반응형 기본 레이아웃
- 게임 상태 전이(대기/진행/일시정지/완료)
- 게임 시작/일시정지/재개/초기화
- 상태 구독 및 UI 갱신
- 전투 결과 중복 카운트 방지용 encounterIndex 검증
- Node 내장 테스트 러너 기반 단위 테스트

## 아직 구현하지 않음
- Rejected Draft 층별 전투/적 등장 규칙의 정확한 이식
- 포켓몬/기술 데이터, 타입 상성, 동화도
- 자동 전투, 저장/불러오기, 배포

## 설계 원칙
게임 상태 변경은 `transition`으로만 처리하며 UI는 상태를 읽고 렌더링만 합니다.
한 적에 대한 승리 처리는 현재 `encounterIndex`와 동일할 때 한 번만 반영합니다.
2단계에서 층 진행과 적 데이터를 독립 모듈로 추가합니다.
