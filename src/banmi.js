// banmi.js - 1.0
// A simple module for rate-limited lockouts
// (c) 2019 Charlton Trezevant
// MIT License

var Banmi = {};

// Initial ban length, which is used to calculate the scaling ban length per
// the total number of failed attempts
Banmi.initialBanLength = 120;

// Maximum failure threshold that login attempts cannot exceed.
Banmi.maxFailThreshold = 2;

Banmi.bans = {};

Banmi.createBanRecord = function(user){
  this.bans[user] = {
    numFailuresRecorded: 0,
    initialBanTime: new Date(),
    lastFailTime: new Date(),
  };
};

Banmi.deleteBanRecord = function(user){
  delete this.bans[user];
};

Banmi.banRecordExists = function(user){
  return this.bans[user];
};

Banmi.numFailuresRecorded = function(user){
  if(!this.banRecordExists(user))
    return 0;

  return this.bans[user].numFailuresRecorded;
};

Banmi.banTimeRemaining = function(user){
  if(!this.banRecordExists(user))
    return 0;
    
  currentTime = new Date();
  return this.bans[user].expireTime - currentTime;
};

Banmi.recordFailure = function(user){
  if(!this.banRecordExists(user))
    this.createBanRecord(user);
  
  this.bans[user].lastFailTime = new Date();
  this.bans[user].numFailuresRecorded++;
  
  currentTime = new Date();
  this.bans[user].expireTime = currentTime.setSeconds(currentTime.getSeconds() +
    (Math.floor(this.bans[user].numFailuresRecorded / this.maxFailThreshold) * this.initialBanLength));
};

Banmi.isBanned = function(user){
  if(this.banTimeRemaining(user) <= 0)
    this.deleteBanRecord(user);
  
  if(this.numFailuresRecorded(user) >= this.maxFailThreshold)
    return true;
  
  return false;
};

module.exports = Banmi;
