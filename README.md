# PokeLoop — Rebuild

- 개발 대상: https://github.com/ball7847/pokeloop
- Rejected Draft 참고용 (수정하지 않음): https://github.com/ball7847/pokeloop2
- 구버전 백업: `backup/pre-rebuild-20261018`

## 실행

```sh
npm install
npm run dev
npm test
npm run build
```

## GitHub Pages 배포

- GitHub Pages를 **Deploy from a branch**로 설정한 경우: `main` 루트의 `index.html`이 직접 게시됩니다. 상대 경로로 JS/CSS를 불러오므로 별도 빌드 없이 기본 UI를 표시할 수 있습니다.
- GitHub Pages를 **GitHub Actions**로 설정한 경우: `.github/workflows/deploy.yml`이 `main`의 변경을 빌드·테스트하고 `dist/`를 게시합니다.
- Actions 모드로 전환하려면 저장소 Settings → Pages → Build and deployment → Source 에서 **GitHub Actions**를 선택합니다.
- 두 모드 모두 프로젝트 URL은 `https://ball7847.github.io/pokeloop/` 입니다.

## UI 구성

상단 메타몽 요약 / 좌측 메타몽·야생·도감·설정 탭 / 중앙 탭 콘텐츠 / 우측 로그.
메타몽 상세 정보, 전투, 도감, 해금 시스템은 아직 구현하지 않았습니다.
