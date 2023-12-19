const PluginInterface = require('../../../src/pluginInterface');
const OpenAI = require('openai');

class AiPlugin extends PluginInterface {
  init() {
    this.__centralEventEmitter.on('messageReceived', this.onMessage.bind(this));
    this.__messageBuffer = {};
  }

  bufferMessage(channel, username, message, limit = 25) {
    if (!(channel in this.__messageBuffer)) {
      this.__messageBuffer[channel] = [];
    }

    if (this.__messageBuffer[channel].length >= limit) {
      this.__messageBuffer[channel].shift();
    }

    this.__messageBuffer[channel].push({'channel': channel, 'username': username, 'message': message});
  }

  // TODO: abstract checks for streamer/mods/etc
  async onMessage(msg) {
    // Ignore Discord messages for now
    if (msg.platform !== 'twitch') return;

    // Put all messages into the message buffer (bot short-term memory)
    this.bufferMessage(msg.channel, msg.username, msg.message);

    // Bot should ignore its own messages
    if (msg.username.toLowerCase() === process.env.TWITCH_USERNAME.toLowerCase()) {
      return;
    }
    const isAiEnabled = ((await this.__redis.HGET(`ebp:config:${msg.channel}`, 'ai-enabled')) === 'true');

    // Toggle AI
    if (msg.command === 'toggleai' && msg.username.toLowerCase() == msg.chanClean) {
      await this.__redis.HSET(`ebp:config:${msg.channel}`, 'ai-enabled', (isAiEnabled ? 'false' : 'true'));
      if (isAiEnabled) {
        msg.twitchClient.say(msg.channel, `Okay, AI has been disabled for this channel.`);
      } else {
        msg.twitchClient.say(msg.channel, `Okay, AI has been enabled for this channel.`);
      }
      return;
    }

    const aiTriggersKey = `ebp:config:${msg.channel}:ai-triggers`;

    // Add an AI trigger
    if (msg.command === 'addaitrigger' && msg.username.toLowerCase() == msg.chanClean) {
      const triggerConfig = {
        probability: (msg.args[0].match(/[0-9]+/)) ? Number(msg.args.shift()) : 100,
        pattern: msg.args.join(' '),
      };
      await this.__redis.RPUSH(aiTriggersKey, JSON.stringify(triggerConfig));
      msg.twitchClient.say(msg.channel, `Okay, '${triggerConfig.pattern}' has been added as an AI trigger for ${triggerConfig.probability}% of matching messages in this channel.`);
      return;
    }

    // Remove an AI trigger
    if (msg.command === 'removeaitrigger' && msg.username.toLowerCase() == msg.chanClean) {
      const aiTriggerToRemove = await this.__redis.LINDEX(aiTriggersKey, msg.args[0]);
      if (!aiTriggerToRemove) {
        msg.twitchClient.say(msg.channel, `There is no AI trigger #${msg.args[0]} for this channel.`);
        return;
      }
      await this.__redis.LREM(aiTriggersKey, 0, aiTriggerToRemove);
      msg.twitchClient.say(msg.channel, `Okay, AI trigger #${msg.args[0]} (${aiTriggerToRemove}) is no longer an AI trigger in this channel.`);
      return;
    }

    // List all AI triggers
    if (msg.command === 'aitriggers' && msg.username.toLowerCase() == msg.chanClean) {
    var aiTriggers = await this.__redis.LRANGE(aiTriggersKey, 0, -1);
      aiTriggers = aiTriggers.map((item, index) => `${index}. ${JSON.parse(item).pattern} (${JSON.parse(item).probability}%)`).join(', ');
      msg.twitchClient.say(msg.channel, `AI triggers for this channel: ${aiTriggers}`);
      return;
    }

    // Clear bot's short term memory
    if (msg.command === 'resetai' && msg.username.toLowerCase() == msg.chanClean) {
      if (!(msg.channel in this.__messageBuffer)) {
        msg.twitchClient.say(msg.channel, `I don't have any memory in your channel to forget, silly. :p`);
        return;
      }
      var historyLength = this.__messageBuffer[msg.channel].length;
      this.__messageBuffer[msg.channel] = [];
      msg.twitchClient.say(msg.channel, `Alright, I've forgotten ${historyLength} message(s) in ${msg.channel}.`);
      return;
    }

    // Stop here if AI is not enabled for this channel
    if (!isAiEnabled) {
      return;
    }

    // AI was not triggered, stop here
    if (!this.checkIfAiTriggered(msg)) {
      return;
    }

    //const configuration = {
    //  apiKey: process.env.OPENAI_API_KEY,
    //};
    //this.__openai = new OpenAI(configuration);

    var aiPrompt = await this.__redis.GET(`twitch-bot-prompt-${msg.chanClean}`);
    if (!aiPrompt) {
      aiPrompt = await this.__redis.GET(`twitch-bot-main-prompt`);
    }

    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    var botBrain = await this.__redis.get(`twitch-bot-${msg.channel}-brain`);
    botBrain = botBrain + '. Always respond on a single line (no line breaks). Respond with very short and brief messages. Ideally respond with one single short sentence, unless you are asked for something longer like a poem or song or story. Always keep responses under 50 completion_tokens. If asked about chat history or who has said what in chat or which chatters are active, provide an answer based on the chat history provided below. Do not refer to yourself as an AI or say things like "As an AI" or anything like that.';
    aiPrompt = aiPrompt.replace('{botbrain}', botBrain ? botBrain : '');
    aiPrompt = aiPrompt.replace('{currentchannel}', msg.chanClean);
    aiPrompt = aiPrompt.replace('{datetime}', timeString);
    aiPrompt = aiPrompt.replace('{sender}', msg.username);
    aiPrompt = aiPrompt.replace('{message}', msg.message);

    // Chat history memory
    const bufferKey = msg.channel;
    var chatHistory = '';
    if (!(bufferKey in this.__messageBuffer)) {
      this.__messageBuffer[bufferKey] = [];
    }
    for (var i=0; i<this.__messageBuffer[bufferKey].length; i++) {
      chatHistory = `${chatHistory}${this.__messageBuffer[bufferKey][i].username}: ${this.__messageBuffer[bufferKey][i].message}\n`;
    }
    aiPrompt = aiPrompt.replace('{chathistory}', chatHistory.trim());


    console.log('AI PROMPT:');
    console.log(aiPrompt);

    msg.twitchClient.say(msg.channel, `AI was triggered.`);


    return;

    var aiModel = await this.__redis.HGET(`ebp:config:${msg.channel}`, 'ai-model');
    if (!aiModel) {
      aiModel = process.env.DEFAULT_AI_MODEL;
    }

  }

  checkIfAiTriggered(msg) {
    // Check if the message matches the bot Twitch username
    if (msg.message.match(new RegExp(process.env.TWITCH_USERNAME, 'ig'))) {
      return true;
    }

    // Check if the message matches any of the AI triggers for this channel
    var aiTriggers    = await this.__redis.LRANGE(aiTriggersKey, 0, -1);
    for (var i=0; i<aiTriggers.length; i++) {
      var aiTrigger   = JSON.parse(aiTriggers[i]);
      var matches     = aiTrigger.pattern.match(/\/(.*?)\/([gimyus]*)/);
      var pattern     = matches ? matches[1] : aiTrigger.pattern;
      var flags       = matches ? matches[2] : 'ig';
      var regExp      = new RegExp(pattern, flags);
      var probability = Number(aiTrigger.probability);
      if (regExp.test(msg.message) && (Math.random() < probability / 100)) {
        return true;
      }
    }

    return false;
  }

  unload() {
    this.__centralEventEmitter.removeListener('messageReceived', this.onMessage);
  }
}

module.exports = AiPlugin;
