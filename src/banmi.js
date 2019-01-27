// banmi.js - 1.0
// A simple module for rate-limited lockouts
// (c) 2019 Charlton Trezevant
// MIT License

var Banmi = {};

// Defaults: Max of 3 attempts, with a 5 second cool-down period
Banmi.maxAttempts = 3;
Banmi.banLength = 5;

Banmi.bans = {};

Banmi.createBanRecord = function(user){
  this.bans[user] = {
    attempts: 0,
    lastFailTime: new Date()
  };
};

Banmi.deleteBanRecord = function(user){
  delete this.bans[user];
};

Banmi.banRecordExists = function(user){
  return this.bans[user];
};

Banmi.numAttemptsRecorded = function(user){
  if(!this.banRecordExists(user))
    return 0;

  return this.bans[user].attempts;
};

Banmi.banTimeElapsed = function(user){
  if(!this.banRecordExists(user))
    return 0;
    
  currentTime = new Date();
  return Math.floor((currentTime - this.bans[user].lastFailTime) / 1000);
};

Banmi.recordFailure = function(user){
  if(!this.banRecordExists(user))
    this.createBanRecord(user);
  
  this.bans[user].lastFailTime = new Date();
  this.bans[user].attempts++;
};

Banmi.isBanned = function(user){
  if(this.banTimeElapsed(user) >= this.banLength)
    this.deleteBanRecord(user);
  
  if(this.numAttemptsRecorded(user) >= this.maxAttempts)
    return true;
  
  return false;
};

module.exports = Banmi;
