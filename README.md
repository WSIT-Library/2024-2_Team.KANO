# 자폐장애인 친화형 대화 챗봇

이 프로젝트는 자폐 스펙트럼 장애(ASD)를 가진 사용자들이 원활하게 소통할 수 있도록 돕는 챗봇입니다. 챗봇은 텍스트 입력과 음성 입력(Speech-to-Text, STT) 기능을 제공하여, 타이핑이 어려운 사용자도 쉽게 사용할 수 있습니다.

## 주요 기능

- **대화형 인터페이스**: 사용자 입력을 이해하고 적절한 응답을 제공하는 대화형 챗봇입니다.
- **음성 인식(Speech-to-Text, STT)**: 사용자가 음성 명령으로 챗봇과 상호작용할 수 있어 타이핑이 어려운 경우에도 사용이 가능합니다.
- **Expo 기반 프론트엔드**: [Expo](https://expo.dev/)를 사용한 모바일 친화적인 프론트엔드로, 여러 플랫폼에서 실행이 가능합니다.
- **Flask 기반 백엔드**: [Flask](https://flask.palletsprojects.com/)를 사용하여 백엔드 로직과 응답 생성을 처리합니다.
- **맞춤형 응답**: 사용자 요구에 맞게 챗봇의 응답을 맞춤 설정할 수 있습니다.

## 기술 스택

- **프론트엔드**: [React Native](https://reactnative.dev/) 및 [Expo](https://expo.dev/)
- **백엔드**: [Flask](https://flask.palletsprojects.com/)
- **음성 인식(Speech-to-Text)**: 음성 입력을 처리하는 STT 서비스 통합
- **배포**: 모바일 장치에서 실행 가능하며, 클라우드 플랫폼에 호스팅하여 확장성 있게 운영할 수 있습니다.

## 설치 방법

### 사전 요구 사항

다음 도구들이 설치되어 있어야 합니다:

- Node.js (버전 20 이상)
- Python (버전 3.12 이상)
- Expo CLI
- Flask

### 프론트엔드 설정

1. 리포지토리 클론:
    ```bash
    git clone https://github.com/Kashisland/chatbot_AntiBarrier.git
    cd chatbot_AntiBarrier
    ```

2. 의존성 설치:
    ```bash
    npm install
    ```

3. Expo 프로젝트 시작:
    ```bash
    npm start
    ```

4. Expo에서 생성된 QR 코드를 스캔하여 모바일 기기에서 앱을 실행하거나 에뮬레이터를 사용할 수 있습니다.

### 백엔드 설정

1. 백엔드 디렉터리로 이동:
    ```bash
    cd backend
    ```

2. 가상 환경 생성 및 활성화:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # Windows의 경우 `venv\Scripts\activate` 사용
    ```

3. 백엔드 의존성 설치:
    ```bash
    pip install -r requirements.txt
    ```

4. Flask 서버 시작:
    ```bash
    python3 app.py  # Windows의 경우 `python app.py` 사용
    ```

## 음성 인식(Speech-to-Text) 통합

STT 기능은 외부 API를 사용하여 음성을 텍스트로 변환합니다. 프론트엔드의 `.env` 파일에 API 키를 설정하여 STT 서비스를 구성할 수 있습니다.

## 기여 방법

프로젝트에 기여를 환영합니다! 개선 사항이나 버그가 있을 경우 이슈를 등록하거나 풀 리퀘스트를 제출해 주세요.

---

문의 사항이 있으면 이슈를 열거나 프로젝트 관리자에게 연락해 주세요.
