# 📝 AI Class Game - 노션(Notion) 학생 데이터 연동 가이드

`AI Class Game` 관리자 페이지(`admin.html`)에서 학생 데이터를 **노션 데이터베이스(Notion Database)**에 연동하는 2가지 방법(API 연동 / CSV 파일 가져오기) 안내 문서입니다.

---

## 🚀 방법 1: Notion API 자동 동기화 (권장)

### 1단계: Notion API Key (Integration Token) 발급
1. [Notion Integrations 관리 페이지](https://www.notion.so/my-integrations) 접속 후 로그인합니다.
2. **`+ 새 통합 만들기` (+ New Integration)** 클릭
3. 통합 이름 (예: `AI Class Game Sync`) 설정 및 워크스페이스 선택 후 **`제출`**
4. 생성된 **`내부 통합 시크릿 (Internal Integration Secret)`** 키(`secret_...`)를 복사합니다.

### 2단계: 노션 데이터베이스 생성 및 연동 추가
1. 노션(Notion)에서 새 페이지 생성 ➔ **`/표 - 전체 페이지`** 선택하여 데이터베이스를 만듭니다.
2. 노션 표 우측 상단 `...` 버튼 클릭 ➔ **`연동 추가` (Add connections)** 클릭 ➔ 1단계에서 만든 Integration(`AI Class Game Sync`) 선택하여 연결 허용합니다.
3. 데이터베이스 표 헤더(속성) 이름을 아래와 같이 지정합니다:
   - **`이름`** (제목 / Title)
   - **`학번`** (텍스트 / Rich Text)
   - **`학교`** (선택 / Select 또는 텍스트)
   - **`아이디`** (텍스트 / Rich Text)
   - **`점수`** (숫자 / Number)
   - **`캐릭터명`** (텍스트 / Rich Text)
   - **`가입일`** (날짜 / Date)

### 3단계: Notion Database ID 확인
1. 노션 데이터베이스 페이지의 **웹 주소(URL)**를 확인합니다:
   ```text
   https://www.notion.so/myworkspace/1aa2bb3cc4dd5ee6ff7gg8hh9ii0jj1k?v=...
   ```
2. `https://www.notion.so/myworkspace/` 뒤부터 `?v=` 전까지의 **32자리 문자열** (`1aa2bb3cc4dd5ee6ff7gg8hh9ii0jj1k`)이 **Database ID**입니다.

### 4단계: 관리자 웹페이지(`admin.html`)에서 전송
1. `admin.html` 접속 ➔ **`📝 노션(Notion) 연동`** 버튼 클릭
2. API Key (`secret_...`) 및 Database ID 입력 후 **`💾 설정 저장`**
3. **`🚀 노션으로 데이터 일괄 전송`** 클릭 ➔ 전체 학생 데이터가 노션 데이터베이스에 자동 작성됩니다!

---

## 📥 방법 2: 노션 전용 CSV 일괄 가져오기 (가장 쉬운 1초 방법)

1. `admin.html`에서 **`📝 노션(Notion) 연동`** ➔ **`📥 노션 가져오기 전용 CSV 다운로드`** 클릭
2. 다운로드된 `노션_학생명단_YYYY-MM-DD.csv` 파일 획득
3. 노션 좌측 사이드바 하단 **`가져오기 (Import)`** ➔ **`CSV`** 클릭 후 해당 파일 선택
4. 노션 표 형태의 학생 명단이 1초 만에 완성됩니다!
