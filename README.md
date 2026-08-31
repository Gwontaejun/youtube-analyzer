# YouTube Analyzer

YouTube 채널 또는 영상 URL을 받아 대상 유형을 판별하고 공개 메타데이터를 조회하는 MVP입니다.

현재 구현 범위: Phase 0~2

- Next.js + TypeScript 프런트엔드 기본 화면
- FastAPI 백엔드 및 `GET /health`
- YouTube URL(Channel/Video) 판별
- YouTube Data API v3 기반 채널·영상 정보 조회
- 영상 댓글 수집 및 채널 최근 영상 댓글 누적 수집 (최대 1,000개)

## 빠른 시작

### 짧은 개발 명령어

프로젝트 최상단에서 아래 명령을 사용합니다. `npm run dev`는 첫 실행 때 backend 가상환경과 Python 패키지를 자동으로 설치합니다.

```powershell
npm run dev       # FastAPI 백엔드 실행
npm run frontend  # Next.js 프런트엔드 실행 (별도 터미널)
```

검증 명령어:

```powershell
npm run test:backend
npm run lint
npm run build
```

프런트엔드는 `http://localhost:3000`에서 실행됩니다. `frontend/.env.local.example`을 복사해 백엔드 URL을 바꿀 수 있으며, API 키는 프런트엔드 환경 변수에 넣지 않습니다.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# .env에 YOUTUBE_API_KEY를 설정
uvicorn app.main:app --reload
```

API 문서: `http://127.0.0.1:8000/docs`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## API

`POST /api/youtube/resolve`

```json
{ "url": "https://youtu.be/dQw4w9WgXcQ" }
```

API 키는 백엔드 환경 변수에서만 사용합니다. `.env` 파일은 절대 커밋하지 않습니다.

### 댓글 수집 API (Phase 3)

`POST /api/youtube/comments`

```json
{ "url": "https://youtu.be/dQw4w9WgXcQ", "maxComments": 100 }
```

영상은 해당 영상의 댓글을, 채널은 최신 영상부터 댓글 수가 `maxComments`에 도달할 때까지 수집합니다. 채널 분석에서는 한 영상당 최대 200개의 일반 시청자 댓글만 반영합니다. 댓글이 비활성화된 영상은 채널 수집에서 건너뜁니다. 업로더(채널 주인)가 작성한 댓글은 수집 결과와 분석 대상에서 제외합니다.

`maxComments`는 최종적으로 분석할 일반 시청자 댓글 수입니다. 채널 주인 댓글은 한 번에 가져온 댓글 페이지에서 제외한 뒤, 다음 일반 댓글로 자동 보충합니다.

### 댓글 전처리 및 배치 API (Phase 4)

`POST /api/youtube/comments/prepare`는 댓글을 수집한 뒤 빈 값과 중복을 제거하고 공백을 정리합니다. 응답의 `batches`는 Gemini에 전달할 `{ id, text }` 객체를 기본 200개씩 나눈 목록입니다.

### Gemini 댓글 분석 API (Phase 5)

`.env`에 `GEMINI_API_KEY`를 설정한 뒤 `POST /api/youtube/comments/analyze`를 호출합니다. 전처리된 댓글을 200개씩 Gemini에 보내고, 각 댓글에 대해 `category`, `topic`, `sentiment`을 반환합니다. Gemini 응답은 구조화된 JSON과 Pydantic 검증을 모두 통과해야 반환됩니다.

장난스러운 과장, 밈, 친근한 놀림, 웃음 표현은 명확한 불만이나 공격 의도가 없는 한 `complaint` 또는 `toxic`으로 분류하지 않도록 프롬프트 기준을 적용합니다.

토픽은 댓글에 명시된 내용만 근거로 정규화합니다. 예를 들어 광고 불만을 자막·편집 문제처럼 추론하지 않도록 제한합니다.

### 분류 품질 점검 (Phase 12)

대표적인 웃음·콘텐츠 요청·광고 불만·악성 표현·질문·장난스러운 반응을 실제 Gemini 호출로 점검했습니다. 프롬프트는 장난스러운 비판을 불만으로 과대 분류하지 않고, 토픽을 댓글에 명시된 내용에서만 뽑도록 보강했습니다.

### 분석 집계 (Phase 6)

`/api/youtube/comments/analyze`는 댓글별 분석 결과와 함께 Python에서 계산한 `categories`(모든 카테고리별 개수) 및 `topics`(빈도순 주제 목록)를 반환합니다. 숫자 집계는 Gemini에 맡기지 않습니다.

### 최종 인사이트 (Phase 7)

`/api/youtube/comments/analyze`는 집계 데이터만 다시 Gemini에 전달해 한국어 `insight`를 생성합니다. `summary`, `topRequests`, `topComplaints`, `contentIdeas`를 구조화된 JSON으로 반환하며, 개별 댓글 원문은 최종 인사이트 호출에 다시 보내지 않습니다. 각 `topics`와 `contentIdeas`에는 최대 3개의 `evidenceComments`를 붙여, 어떤 실제 댓글이 근거가 되었는지 확인할 수 있습니다.

### 최종 분석 API (Phase 8)

앱에서는 `POST /api/analyze`만 사용합니다.

```json
{ "url": "https://youtube.com/watch?v=...", "maxComments": 1000 }
```

채널과 영상 URL을 자동 판별하고, 댓글 수집부터 최종 인사이트까지 처리합니다. 개발·검증용 `/api/youtube/...` 엔드포인트는 계속 사용할 수 있습니다.

### 분석 중 UI (Phase 10)

분석이 진행되는 동안 프런트엔드는 실제 수치가 아닌 단계형 안내 문구를 표시합니다. 현재는 Queue, Redis, SSE를 사용하지 않으므로 실제 댓글 수나 영상 수 진행률은 표시하지 않습니다.

### 결과 대시보드 (Phase 11)

분석이 완료되면 입력 화면은 반응형 대시보드로 전환됩니다. 영상·채널별 헤더, 카테고리 분포, 콘텐츠 요청, 불만, AI 요약, 콘텐츠 아이디어 및 근거 댓글을 표시합니다.

UI는 외부 이미지 의존성 없이 CSS 기반의 픽셀 아케이드 스타일을 사용하며, 작은 화면에서도 주요 정보와 입력 요소를 유지합니다.

## 검증

```powershell
cd backend
pytest
```

Video URL analysis responses include the official public YouTube metric `likeCount` in `target`. Public dislike counts are not provided by the YouTube API and are intentionally not shown.
