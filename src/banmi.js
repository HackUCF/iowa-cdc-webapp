// banmi.js - 1.0
// (c) 2019 Charlton Trezevant
// MIT License

// Defaults: Max of 3 attempts within a 5 second window
var MAX_ATTEMPTS = 3;
var BAN_LENGTH = 5;

var bans = {};

function createNewBanRecord(user){
  bans[user] = {
    attempts: 0,
    firstFailTime: new Date()
  };
}

function banRecordExists(user){
  return bans[user];
}

function deleteBanRecord(user){
  delete bans[user];
}

function banTimeElapsed(user){
  if(!banRecordExists(user))
    return 0;
    
  currentTime = new Date();
  return Math.floor((currentTime - bans[user].firstFailTime) / 1000);
}

function numAttemptsRecorded(user){
  if(!banRecordExists(user))
    return 0;

  return bans[user].attempts;
}

function incrementAttempts(user){
  if(!banRecordExists(user))
    createNewBanRecord(user);
  
  bans[user].attempts++;
}

function isBanned(user){
  if(banTimeElapsed(user) >= BAN_LENGTH)
    deleteBanRecord(user);
  
  if(numAttemptsRecorded(user) >= MAX_ATTEMPTS)
    return true;
  
  return false;
}

function checkAttempt(user){
	incrementAttempts(user);
  return isBanned(user);
}

module.exports.max_attempts = MAX_ATTEMPTS;
module.exports.ban_length = BAN_LENGTH;
module.exports.isBanned = isBanned;
module.exports.checkAttempt = isBanned;
