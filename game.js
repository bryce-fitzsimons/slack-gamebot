'use strict';

var Game = function(player_id_1, player_id_2) {
	this.player_id_1 = player_id_1;
	this.player_id_2 = player_id_2;
	this.turn = 1;
	
	this.board = [];
	for( var row=0; row<6; row++ ){
		this.board.push( [0,0,0,0,0,0,0] );
	}
}

Game.prototype.renderBoard = function() {
	var str = "";
	for( var row=0; row<6; row++ ){
		for( var col=0; col<7; col++ ){
			switch( this.board[row][col] ){
				case 0:
					str += ":white_large_square:";
					break;
				case 1:
					str += ":red_circle:";
					break;
				case 2:
					str += ":black_circle:";
					break;
			}
		}
		str += "\n";
	}
	return str;
}

Game.prototype.addPiece = function(player_id, col){
	var valid_move = 0;
	var player_no;
	if ( player_id == this.player_id_1 )
		player_no = 1;
	else if ( player_id == this.player_id_2 )
		player_no = 2;
	
	// Drop it like it's hot:
	for( var row=6; row>=1; row-- ){
		if( this.board[row-1][col-1] == 0 ){
			this.board[row-1][col-1] = player_no;
			valid_move = this.checkForWin(player_no, row, col);
			break;
		}
	}
	
	// Advance the turn:
	if( valid_move > 0 ){
		this.turn++;
		if( this.turn > 2 )
			this.turn = 1;
	}
	
	return valid_move;
}

Game.prototype.checkForWin = function(player_no, row, col){
	var result = 1;
	var count = 0;

	// check horizontal
	for(var c=0; c<7; c++) {
		if ( this.board[row-1][c]==player_no )
			count++;
		else
			count=0;
		if ( count>=4 )
			return 2;
	}
	count = 0;
	
	// check vertical
	for(var r=0; r<6; r++) {
		if ( this.board[r][col-1]==player_no )
			count++;
		else
			count=0;
		if ( count>=4 )
			return 2;
	}
	count = 0;
	
	// check diagonal down (\)    ...pretty cool algorithm I think
	r = 0;
	c = (row-1)-(col-1);
	for(var i=0; i<6; i++){
		if ( (r+i)>=0 && (r+i)<6 && (c+i)>=0 && (c+i)<7 ){
			if ( this.board[r+i][c+i]==player_no )
				count++;
			else
				count=0;
			if ( count>=4 )
				return 2;
		}
	}
	
	// check diagonal up (/)
	r = 0;
	c = (row-1)+(col-1);
	for(var i=0; i<6; i++){
		if ( (r+i)>=0 && (r+i)<6 && (c-i)>=0 && (c-i)<7 ){
			if ( this.board[r+i][c-i]==player_no )
				count++;
			else
				count=0;
			if ( count>=4 )
				return 2;
		}
	}
	
	return result;
}

Game.prototype.myTurn = function(player_id){
	if( this.turn == 1 && this.player_id_1 == player_id )
		return true;
	else if ( this.turn == 2 && this.player_id_2 == player_id )
		return true;
	else
		return false;
}

Game.prototype.getRivalId = function(player_id){
	if( this.player_id_1 == player_id )
		return this.player_id_2;
	else if( this.player_id_2 == player_id )
		return this.player_id_1;
	else
		return false;
}

module.exports = Game;