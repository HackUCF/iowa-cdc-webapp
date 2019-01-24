// banmi.js - 1.0
// (c) 2019 Charlton Trezevant
// MIT License

var bans = {};
var MAX_ATTEMPTS = 3;
var BAN_LENGTH = 3;

function newBan(){
  return {
    attempts: 1,
    banTime: new Date()
  };
}

function getBanTimeElapsed(user){
  currentTime = new Date();
  return Math.floor((currentTime - bans[key(user)].firstFailTime) / 1000);
}

function getBan(user){
  return bans[key(user)];
}

function createResetBan(user){
  bans[key(user)] = newBan();
}

function banAttempts(user){
  return bans[key(user)].attempts;
}

function incrementAttempts(user){
  bans[key(user)].attempts++;
}

function isBanned(user){
  if(!getBan(user)) {
		createResetBan(user);
    return false;
	}
  
  if(banAttempts(user) >= MAX_ATTEMPTS && getBanTimeElapsed(user) >= BAN_LENGTH){
    createResetBan(user);
    return false;
  }
  
  if(banAttempts(user) >= MAX_ATTEMPTS && getBanTimeElapsed(user) < BAN_LENGTH){
    incrementAttempts(user);
		return true;
	}
  
	incrementAttempts(user);
}

module.exports.max_attempts = MAX_ATTEMPTS;
module.exports.ban_length = BAN_LENGTH;
module.exports.isBanned = isBanned;
