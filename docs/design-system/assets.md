# 20FIN 이미지 에셋 v1

내장 image_gen으로 생성한 18개 원본 PNG. 참조: 사용자 제공 홈 디자인 시안 및 20FIN 디자인 시스템.

## 사용

- 원본 위치: public/brand/20fin-v1/
- 앱 URL: /brand/20fin-v1/{name}.png
- 전체 미리보기: docs/design-system/assets.html
- 실제 픽셀 크기·투명도·용도·프롬프트: asset-manifest.json
- 피오: contain으로 40–160px. 가로세로 비율 고정, 자르지 않음.
- 이벤트·기능 아이콘: 48–96px, object-fit: contain. 24px 이하의 내비게이션은 기존 선형 SVG 사용.
- 주거 아이콘은 다른 아이콘보다 장식이 풍부하므로 64px 이상 권장.
- 배경: 텍스트·현재 마커·이벤트 노드는 실제 UI로 별도 구성. 가로 배경과 세로 배경을 구분해서 사용.
- 도시 배너 원본은 1774×887. 얇은 배너에서는 object-fit: cover; object-position: bottom으로 아래쪽 풍경을 유지.
- 장식 이미지 alt는 빈 문자열. 독립적인 의미를 가진 이미지는 한국어 대체 텍스트 제공.
- 기존 로고·내비게이션 SVG는 교체하지 않음. 생성 이미지는 아직 제품 화면에 적용하지 않음.

## 품질 확인

18개 파일 저장 및 크기 확인. 캐릭터 5종·아이콘 10종은 실제 알파 채널의 투명 픽셀 보유. 배경 3종은 불투명 RGB. 생성된 원본을 변경하지 않고 보존함. 생성 특성상 미세한 재질·장식 차이가 있으며, 작은 아이콘은 갤러리의 48px 보기에서 확인 가능.

## 목록

- `pio-default.png` — 기본 · 인사
- `pio-thinking.png` — 생각 · 답변 준비
- `pio-guide.png` — 안내 · 다음 행동
- `pio-celebrate.png` — 완료 · 축하
- `pio-support.png` — 응원 · 동반자
- `landscape-timeline-desktop.png` — 데스크톱 타임라인
- `event-education.png` — 입학 · 졸업
- `landscape-timeline-mobile.png` — 모바일 온보딩
- `landscape-city-banner.png` — 도시 응원 배너
- `event-student-loan.png` — 학자금 · 서류
- `event-housing.png` — 독립 · 주거
- `event-career.png` — 취업 · 인턴
- `event-savings.png` — 저축 · 자산형성
- `event-first-salary.png` — 첫 월급
- `utility-protection.png` — 보호 · 계약 점검
- `utility-opportunity.png` — 지원 · 기회
- `utility-deadline.png` — 일정 · 마감
- `event-goal.png` — 미래 목표
