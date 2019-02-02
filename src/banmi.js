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
  logger.info("Banmi: Creating new ban record for " + user);
  this.bans[user] = {
    numFailuresRecorded: 0,
    initialBanTime: new Date(),
    lastFailTime: new Date()
  };
};

Banmi.deleteBanRecord = function(user){
  logger.info("Banmi: deleting ban record for " + user);
  delete this.bans[user];
};

Banmi.banRecordExists = function(user){
  if(this.bans[user]){
    logger.info("Banmi: recordExists: Found a ban on file for " + user);
    return true;
  } else {
    logger.info("Banmi: recordExists: No bans on file for " + user);
    return null;
  }
};

Banmi.numFailuresRecorded = function(user){
  if(!this.banRecordExists(user))
    return 0;

  logger.info("Banmi: numFailuresRecorded: " + this.bans[user].numFailuresRecorded + " failures recorded for user " + user);
  return this.bans[user].numFailuresRecorded;
};

Banmi.banTimeRemaining = function(user){
  if(!this.banRecordExists(user))
    return 0;
    
  currentTime = new Date();
  logger.info("Banmi: banTimeRemaining: Time remaining for user " + user + " is " + (this.bans[user].expireTime - currentTime));
  return this.bans[user].expireTime - currentTime;
};

Banmi.recordFailure = function(user){
  if(!this.banRecordExists(user))
    this.createBanRecord(user);
  
  currentTime = new Date();
  
  this.bans[user].lastFailTime = new Date();
  this.bans[user].numFailuresRecorded++;
  
  scaledBanLength = this.initialBanLength;
  if(this.numFailuresRecorded(user) >= this.maxFailThreshold)
    scaledBanLength = (Math.floor(this.bans[user].numFailuresRecorded / this.maxFailThreshold) * this.initialBanLength);
  
  this.bans[user].expireTime = currentTime.setSeconds(currentTime.getSeconds() + scaledBanLength);
    
  logger.info("Banmi: recordFailure: Ban state updated for " + user + ": " + JSON.stringify(this.bans[user]));
};

Banmi.isBanned = function(user){
  if(!this.banRecordExists(user))
    return false;
  
  if(this.banTimeRemaining(user) < 0){
    logger.info("Banmi: banTimeRemaining: Ban time for user " + user + " has completed, will now garbage collect: " + this.banTimeRemaining(user));
    this.deleteBanRecord(user);
    return false;
  }
  
  logger.info("Banmi: banTimeRemaining: Time remaining for user " + user + " is " + this.banTimeRemaining(user) + ", and ban state is: "+ this.numFailuresRecorded(user) >= this.maxFailThreshold);
  return this.numFailuresRecorded(user) >= this.maxFailThreshold;
};

module.exports = Banmi;
