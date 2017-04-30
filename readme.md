# Telegram group chat bot for "Dev Restricted Zone"

비공개 소규모 스터디 모임 '개발제한구역'의 텔레그램 그룹 체팅방을 보조하기 위해 만든 체팅 봇입니다.

체팅방에 매주 모임을 공지 할 때 예약한 화면을 스크린샷 찍어 보내주던 것을 불편하게 생각하여 이 화면의 글자들을 인식 시켜 일정 텍스트 및 구글 켈린더 링크와 ics파일을 만들어 보내주는 것을 1차 목표로 만들었습니다.

검색을 위해 제목만 영어로 작성합니다. 

## 설치 전 알아두면 좋은 정보. (Skip 가능)

#### Preview

이미지에 있는 글자를 인식하여 텍스트로 만드는 작업을 하는 프로그램이기 때문에 구글에서 만든 OCR 라이브러리인 tesseract를 js로 이식시킨 tesseract.js를 사용합니다.

tesseract는 영어 인식을 잘하는 편이지만 한국어 인식이 좋지 않습니다. 트레이닝 셋을 만들어서 사용중 입니다.

이미지를 다루는 툴인 graphicsmagick를 사용하여 그림을 자르고 각 이미지를 tesseract로 돌리는 방법으로 텍스트를 추출합니다.


#### Bot 생성하기

이 프로그램을 실행 해보기전에 Telegram 내의 @botfather를 이용하여 봇을 생성해야합니다.

- 탤레그램을 실행시키고 검색창에 `@botfather`라고 검색하면 봇파더를 찾을 수 있습니다. 

- 봇파더를 이용하여 봇을 생성하고 Token을 기억해 둡니다.

- @<봇이름> 으로 봇을 활성화 시키고 아무 메시지나 입력해 봅니다.

- 그룹 채팅방에 봇을 초대하여 아무 메시지나 입력해 봅니다.

위 세가지를 안하면 다음 단계로 진행이 되지 않습니다. 

``https://api.telegram.org/bot<token>/<API>[&<Data>]``


#### telegram BOT API

| Description | API |  
|:---:|:---:|  
|봇에 대한 정보 | getMe |  
| 봇의 최근 활동 | getUpdates |  
| 메시지 전송 | sendMessage |

`getUpdate` API를 호출하면 채팅을 한 ID가 표시가 됩니다.

[Telegram Bot API](//core.telegram.org/bots)

## 인스톨 하는 방법

이 어플리케이션에서 사용중인 라이브러리 graphicsmagick를 쓰기 위해서는 각 컴퓨터이 미리 c++용 graphicsmagick와 imagemagick를 설치해야합니다.

### Mac
    brew install imagemagick graphicsmagick

### ubuntu ( tested by rasbian-jessie )
    sudo apt-get install imagemagick graphicsmagick

이후 아래의 절차로 설치하시면 됩니다.

    npm install

## 실행 시키는 방법

우선 `config/index.js`를 만들기 위해 아래의 명령어를 입력합니다.

    cp config/index.sample.js config/index.js

아래의 명령어를 입력한 후 `config/index.js`에서 `token`, `adminAccountID`, `groupChatID`의 값을 입력합니다.
각각, 텔래그램 botfather에게 받은 api 토큰 값과 봇을 관리할 사람의 chat id(숫자), 봇이 투입될 그룹방의 chat id(숫자)입니다. 각각의 chat id를 얻는 방법은 [링크(stackoverflow)](http://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id-ruby-gem-telegram-bot)에서 확인하시면 됩니다.

트레이닝 셋을 적용 시키시 위해서 아래의 명령어를 입력합니다.

    cp custom.traineddata.backup custom.traineddata

그 다음 아래의 명령어를 통해 프로그램이 실행 됩니다.

    npm start
    
혹시 node.js의 실행 명령어가 `nodejs`인 경우 package.json의 명령어를 바꾸거나, `nodejs server` 혹은 `nodejs server.js`로 실행하면 된다.

### Ubuntu에서 node 명령어가 동작하지 않는 경우

```
sudo apt install nodejs-legacy
``` 
