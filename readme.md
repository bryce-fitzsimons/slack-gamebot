# **GameBot** (Slack)
### A _Connect Four_ bot for **Slack** using the _RTM API_
By: Bryce Fitzsimons<br>
bryce1&lt;at&gt;gmail&lt;.&gt;com
___

## Synopsis

GameBot is a Slack Bot that allows users to challenge each other to a game of Connect Four. A player challenge an opponent by DM'ing GameBot with "play @Opponent".

GameBot is written in Node.js. It uses the Slack RTM API, which uses an active WebSocket connection. Thus, the GameBot Node app must be left running in order for it to function. If the Node app is closed, all ongoing games will be reset.

GameBot contains a custom, lightweight Slack RTM API wrapper. It does not use any third party Slack tools or API wrappers.


## Installation

1. Create a Slack bot account within your team.<br>
	➾ Go to https://YOUR\_DOMAIN.slack.com/apps/manage/custom-integrations<br>
	➾ Click “Bots”<br>
	➾ Click “Add Configuration”<br>
    ➾ Fill in the <b>bot name</b> and details as you like.<br>
    ➾ Obtain a <b>bot token</b><br>
<br>
2. Extract the project to a directory where you can run it with Node.js. The app should work fine locally or remotely, as long as Node is available.
<br><br>
3. Edit <u>index.js</u>. On lines 9-10, enter in your own <b>bot token</b> and <b>bot name</b>.
```javascript
// Fillable via custom bot token and name:
var bot_token =	"xoxb-YOUR_BOT'S_GENERATED_TOKEN";
var bot_name =  "gamebot";
```
4. Using the command line / terminal, run the <u>index.js</u> file with Node.
```
$ node index.js
```
5. If you would like GameBot to be able to notify your Slack team's _#general_ channel of Connect Four winners, you must manually add the _@gamebot_ user to the channel. Slackbots are not able to join channels automatically.


## Usage

### Starting a game
Challenge a Slack teammate to a game of Connect Four by DM'ing the _@gamebot_ user with the _play_ command. The "@" symbol is optional:
```
play @username
```

**Important:** A Slackbot cannot begin a new DM with your opponent. Therefore, your opponent must first DM _@gamebot_ by sending a message such as "hi".

If you would like your entire Slack team to see your game, play-by-play, then you can also enter the _play @username_ command in the _#general_ channel (instead of DM). Just make sure that _@gamebot_ has been added to that channel first.


### Making a move
If it's your turn, drop a Connect 4 piece by entering the column number, 1 ~ 7.

### Quitting
Just type _quit_ to stop playing.
