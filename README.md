# PokeLoop — New Development

신규 제작 저장소: `ball7847/pokeloop`
참고 전용 저장소: `ball7847/pokeloop2` (Rejected Draft 웹 빌드)

이 저장소는 2026-10-18에 기존 콘텐츠를 백업 브랜치 `backup/pre-rebuild-20261018`에 보존한 뒤, 루트부터 새로 구성했습니다.
원작 참조 저장소 `pokeloop2`는 변경하지 않습니다.

## 실행
```sh
npm install
npm run dev
npm test
npm run build
```

## 1단계
- Vite 기반 최소 실행 구조
- 반응형 기초 화면
- 상태 전이: 준비 / 진행 / 일시정지 / 완료
- 상태 기반 렌더링 및 승리 중복 이벤트 차단

## 향후 단계
- `pokeloop2`의 UI 및 게임 진행 규칙 분석
- 층/적 등장/전투 로직을 독립적으로 재구현
- 포켓몬 데이터/기술/상성/동화도 연동

**주의**: 참조 저장소에는 압축된 배포 파일만 있으므로 원본 개발 소스처럼 복사하지 않습니다.
