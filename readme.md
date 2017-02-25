# Telegram group chat bot for "Dev Restricted Zone"

비공개 소규모 스터디 모임 '개발제한구역'의 텔레그램 그룹 체팅방을 보조하기 위해 만든 체팅 봇입니다.

체팅방에 매주 모임을 공지 할 때 예약한 화면을 스크린샷 찍어 보내주던 것을 불편하게 생각하여 이 화면의 글자들을 인식 시켜 일정 텍스트 및 구글 켈린더 링크와 ics파일을 만들어 보내주는 것을 1차 목표로 만들었습니다.

검색을 위해 제목만 영어로 작성합니다. 

## 설치 전 알아두면 좋은 정보. (Skip 가능)

이미지에 있는 글자를 인식하여 텍스트로 만드는 작업을 하는 프로그램이기 때문에 구글에서 만든 OCR 라이브러리인 tesseract를 js로 이식시킨 tesseract.js를 사용합니다.

tesseract는 영어 인식을 잘하는 편이지만 한국어 인식이 좋지 않습니다. 영어 + 한국어는 말할 것도 없습니다. 그래서 방법을 바꿔서 글자를 수동으로 잘라서 인식시키는 방법을 사용하기로 했습니다.

이미지를 다루는 툴인 graphicsmagick를 사용하여 그림을 자르고 각 이미지를 tesseract로 돌리는 방법으로 텍스트를 추출합니다.

## 인스톨 하는 방법

이 어플리케이션에서 사용중인 라이브러리 graphicsmagick를 쓰기 위해서는 각 컴퓨터이 미리 c++용 graphicsmagick와 imagemagick를 설치해야합니다.

### Mac
    brew install imagemagick graphicsmagick

### ubuntu ( tested by rasbian-jessie )
    sudo apt-get install imagemagick graphicsmagick

이후 아래의 절차로 설치하시면 됩니다.

    npm install

## 실행 시키는 방법

우선 텔래그램 botfather에게 받은 api 토큰 값을 적용시키기 위에 아래의 명령어를 입력한 후 `config/index.sample.js`에 token값을 입력합니다.

    sudo mv config/index.sample.js config/index.js

그 다음 아래의 명령어를 통해 프로그램이 실행 됩니다.

    npm start
    
혹시 node.js의 실행 명령어가 `nodejs`인 경우 package.json의 명령어를 바꾸거나, `nodejs server` 혹은 `nodejs server.js`로 실행하면 된다.
    
### (optional) pm2를 사용하는 유저들 중 node.js 실행 명령어가 nodejs인 경우.
다음 명령어로 실행하면 된다. pm2의 ecosystem을 검색하여 찾아봐도 된다.

    pm2 start ecosystem.config.js 
 
