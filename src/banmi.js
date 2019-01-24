// banmi.js - 1.0
// (c) 2019 Charlton Trezevant
// MIT License

var bans = {};
var MAX_ATTEMPTS = 3;
var BAN_LENGTH = 3;

function newBan() {
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

function resetBan(user){
  bans[key(user)] = newBan();
}

function banAttempts(user){
  return bans[key(user)].attempts;
}

function incrementAttempts(user){
  bans[key(user)].attempts++;
}

module.exports.checkBan = function(user) {
  if(!getBan(user)) {
		bans[key(user)] = newBan();
    return true;
	}
  
  if (banAttempts(user) >= MAX_ATTEMPTS && getBanTimeElapsed(user) >= BAN_LENGTH){
    resetBan(user);
    return true;
  }
  
  if (banAttempts(user) >= MAX_ATTEMPTS && getBanTimeElapsed(user) < BAN_LENGTH){
    incrementAttempts(user);
		return false;
	}
  
	incrementAttempts(user);
};

module.exports.banlist = banlist;
module.exports.max_attempts = MAX_ATTEMPTS;
module.exports.ban_length = BAN_LENGTH;
