###
Required nodejs 16 or higher https://nodejs.org/en/

### How to install
Copy .env.example to .env:<br>
Set value<br>
APP_NAME=YourAppName<br>
TELEGRAM_TOKEN=YourTelegramToken<br>
TELEGRAM_ID=YourTelegramId<br>

`yarn install`<br>


### How to run
`Run start.cmd`

### How to create telegram TELEGRAM_TOKEN and TELEGRAM_ID
1. Open telegram find [@BotFather](https://t.me/BotFather) (https://t.me/BotFather)
2. Type `/newbot`
3. After create your bot, you have to chat with him, Press start and chat some random messages and wait about one minute
4. Run `getchatid.cmd` to get ChatID and copy to .env file
5. Run `start.cmd` to start monitoring