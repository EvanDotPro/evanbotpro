const EventEmitter = require('events');

class CentralEventEmitter extends EventEmitter {}

module.exports = new CentralEventEmitter();
