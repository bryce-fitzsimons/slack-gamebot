var http =		require('http');
var request =	require('request');
var extend =	require('extend');
var WebSocket =	require('ws');
var Game =		require('./game');


// Fillable via custom bot token and name:
var bot_token =	"xoxb-YOUR_BOT'S_GENERATED_TOKEN";
var bot_name =	"gamebot";


// Hold an array of all active PvP games.
// Key: user_id, Value: game instance
// Each game instance will have 2 keys (2 players) pointing to the same game
var games = [];



function SlackBot(token, name) {
	this.token = token;
	this.name = name;
	
	// Message send counter
	this.message_no = 1;
	
	// Keep track of direct message channels
	this.dm_channels = [];
	
	// Once created, start connection
	this.connect();
}


// Connection authentication must be done by HTTP API.
SlackBot.prototype.connect = function() {
	var params = {name: this.name, token: this.token};
	var data = {
		url: 'https://slack.com/api/rtm.start',
		form: params
	};  
	request.post(data, (function postResponse(error, response, body){
		if(error){
			console.log("POST ERROR: "+error);
		}else{
			this.login(JSON.parse(body));
		}
	}).bind(this));
}

// Once authenticated, continue the login process.
SlackBot.prototype.login = function(data) {
	this.wsUrl = data.url;
	this.self = data.self;
	this.team = data.team;
	this.channels = data.channels;
	this.users = data.users;
	this.ims = data.ims;
	this.groups = data.groups;
	
	// Get the ID of the #general channel
	this.general_channel_id = this.channels.filter( function(obj){
		return obj.name == "general";
	})[0].id;
	
	(this.wsConnect.bind(this))();
}

// Establish WebSocket connection. Listen to incoming events.
SlackBot.prototype.wsConnect = function() {
	this.ws = new WebSocket(this.wsUrl);
	
	// WS: OPEN
	this.ws.on('open', function(data) {
		console.log('WS open');
	}.bind(this));
	
	// WS: CLOSE
	this.ws.on('close', function(data) {
		console.log('WS close');
	}.bind(this));

	// WS: MESSAGE
	this.ws.on('message', function(data) {

		var message_obj = JSON.parse(data);
		
		// Received Slack event of type "message"
		if( message_obj.type == "message" ){
			var sender_obj = this.users.filter( function(obj){
				return obj.id == message_obj.user;
			})[0];
			
			// First, make sure to populate DM channels:
			this.dm_channels[sender_obj.id] = message_obj.channel;
			
			var message_text = message_obj.text;
			var message_parts = message_text.split(' ');
			
			
			// Command matching - case insensitive:
			// ====================================
			
			/***********************
			 ==== Command: PLAY ====
			 ***********************/
			if(message_parts[0].match(/play/i)){
				// Matches: "play username" | "Play @username"
				
				var player_id_1 = sender_obj.id;
				var player_id_2 = message_parts[1];
				
				// If you used "@name", slack will return "<@UID>". Process accordingly:
				if( player_id_2.slice(0,2) == "<@" && player_id_2.slice(-1) == ">" ){
					player_id_2 = player_id_2.slice(2,-1);
				}else
					player_id_2 = this.getUserIdByName(message_parts[1]);
				
				// Both player IDs are valid:
				if( player_id_1 !== false && player_id_2 !== false){
				
					var in_game = false;
				
					// Make sure both players aren't already in a game
					if( games.hasOwnProperty(player_id_1) ){
						this.send("You're already in a game!", message_obj.channel);
						in_game = true;
					}
					if( games.hasOwnProperty(player_id_2) ){
						this.send(message_parts[1]+" is already in a game!", message_obj.channel);
						in_game = true;
					}
					
					// Both players are not already in a game:
					if ( !in_game ){
						
						// Let the game begin!
					
						// Create a new game, push it to the global games list
						var game = new Game(player_id_1, player_id_2);
						
						// We want 2 keys (user_id) per game, for easy retrieval
						games[player_id_1] = game;
						games[player_id_2] = game;
						// (JS functions are passed by reference, so no duplicates are made) 
					
						var msg = game.renderBoard();
						msg += "Make your move. `choose a # between 1-7 to select a column`";
						this.send(msg, message_obj.channel);
						
						var player_2_channel = this.getChannelByUserId(player_id_2);
						if( !player_2_channel ){
							var msg = "Please tell @"+this.getUserNameById(player_id_2)+" to say \"hi\" to me, otherwise they won't be able to receive messages from me.";
							this.send(msg, message_obj.channel);
						}
						else
						{
							var msg = "@"+this.getUserNameById(player_id_1)+" has begun a game of Connect Four with you. Their move first...";
							this.send(msg, player_2_channel);
						}
					
					}
				}
				else
				{
					this.send("Invalid players", message_obj.channel);
				}
				
			}
			
			/***********************
			 ==== Command: MOVE ====
			 ***********************/
			else if ( message_parts.length == 1 && /^[1-7]$/.test(message_parts[0]) ) {
			
				if ( !games.hasOwnProperty(sender_obj.id) ){
					this.send("You're not in a game!", message_obj.channel);
				}
				else
				{
					var game = games[sender_obj.id];
					// Is it our turn?
					if( !game.myTurn(sender_obj.id) ){
						this.send("Wait your turn!", message_obj.channel);
					}
					else
					{
						var rival_id = game.getRivalId(sender_obj.id);
						var rival_name = this.getUserNameById(rival_id);
						var rival_channel = this.getChannelByUserId(rival_id);
							
						var result = game.addPiece(sender_obj.id, message_parts[0]);
						// Successful placement
						if ( result == 1 ){
							var msg = game.renderBoard();
							this.send(msg+"Thanks!", message_obj.channel);
							
							if( rival_channel ){
								this.send("@"+this.getUserNameById(sender_obj.id)+" has moved.\n"+msg+"Your move...", rival_channel);
							}
							else
							{
								var msg = "Please tell @"+this.getUserNameById(rival_id)+" to say \"hi\" to me, otherwise they won't be able to receive messages from me.";
								this.send(msg, message_obj.channel);
							}
						}
						// Winning move
						else if ( result == 2 ){
							var msg = game.renderBoard();
							this.send(msg+"YOU WIN!!!", message_obj.channel);
							
							if( rival_channel ){
								this.send("@"+this.getUserNameById(sender_obj.id)+" has moved.\n"+msg+"YOU LOSE.", rival_channel);
							}
							else
							{
								var msg = "Please tell @"+this.getUserNameById(rival_id)+" to say \"hi\" to me, otherwise they won't be able to receive messages from me.";
								this.send(msg, message_obj.channel);
							}
							
							// Post the game status to #general (if the bot has been added there already)
							// BOTS CAN NOT JOIN CHANNELS BY THEMSELVES. They need to be added manually.
							var msg = "@"+this.getUserNameById(sender_obj.id)+" has beaten @"+this.getUserNameById(rival_id)+" in a game of Connect Four";
							this.send(msg, this.general_channel_id);
							
							// end game
							if( games.hasOwnProperty(sender_obj.id) ){
								var game = games[sender_obj.id]
								delete games[sender_obj.id];
								delete games[rival_id];		// delete both pointers to same game
								delete game;				// make sure it's gone
							}
							
						}
						// Invalid move
						else
						{
							this.send("Invalid move. Try again.", message_obj.channel);
						}
					}
				}
			}
			
			/***********************
			 ==== Command: QUIT ====
			 ***********************/
			else if(message_parts[0].match(/quit/i)){
				if( games.hasOwnProperty(sender_obj.id) ){
					var game = games[sender_obj.id]
					var player_id_2 = game.player_id_2;
					
					delete games[sender_obj.id];
					delete games[player_id_2];
					delete game;
					
					this.send("Quitter...", message_obj.channel);
				}
				else
				{
					this.send("You're not in a game yet.", message_obj.channel);
				}
			}
			
		
		}
	}.bind(this));
};


/*******************
  Helper functions:
 *******************/

// Get a User name by id
SlackBot.prototype.getUserIdByName = function(name){
	var user = this.users.filter( function(obj){
		// Find matching name, ignore the leading '@' symbol.
		return obj.name == ( name.replace(/^@/, '') );
	})[0];
	if( user )
		return user.id;
	else
		return false;
}

// Get a User id by name
SlackBot.prototype.getUserNameById = function(id){
	var user = this.users.filter( function(obj){
		return obj.id == id;
	})[0];
	if( user )
		return user.name;
	else
		return false;
}

// Get a Direct Message channel id by User id
// Only works if the channel already exists; bots cannot initialize a DM
SlackBot.prototype.getChannelByUserId = function(id){
	if ( this.dm_channels.hasOwnProperty(id) )
		return this.dm_channels[id];
	else
		return false;
}

// Send a message via RTM API
SlackBot.prototype.send = function(message, channel){
	var json_message = {
		"id": this.message_no++,
		"type": "message",
		"channel": channel,
		"text": message
	};
	this.ws.send( JSON.stringify(json_message) );
}



/******************
  APP ENTRY POINT:
 ******************/

var bot = new SlackBot(bot_token, bot_name);


