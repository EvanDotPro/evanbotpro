# Evan's Bot (aka evanbotpro)

**Authors:** Evan Coury, GPT-4

So, this is just a bot I built for myself and some Twitch friends. A lot of people ask me for the code, so yeah, here it is.


----

### Installation

- Install node.js.
- Install and start redis.
- Clone this repository.
- Copy `.env-default` to `.env` and set the appropriate values.
- Run `node ./app.js`

### Environment Variables (.env)

- **PLUGIN_PATHS** - List of paths to load plugins from, separated by semi-colons, relative to the path you run `app.js` from. E.g. `PLUGIN_PATHS="./plugins/default;./plugins/custom"`.
- **TWITCH_TOKEN** - Twitch access token for your bot.
- **TWITCH_USERNAME** - Twitch username of your bot.
- **TWITCH_ADMIN** - Twitch username who can add/remove bot from others' channels.

### Joining / Leaving Twitch Channels

When you first run the bot, it will only join its own Twitch chat. Each user that wants the bot in their own channel must go into the bot's chat and type `!join`.

If you no longer want the bot in your channel, go into the bot's chat and type `!leave`.

The Twitch user you set as `TWITCH_ADMIN` in `.env` may specify a channel name (i.e. `!join somechannel` or `!leave somechannel`).

### Creating a Plugin

See the examples in the `./plugins` directory.

### Reloading Plugins

If you're working on a plugin and want a change to take effect without restarting the bot, the bot MUST be in your Twitch channel, and you must be logged in as your Twitch user. If you've done that, you should just be able to type `!reloadplugins` in your own chat and you'll see the plugins reload in the console.

More to come on this soon. Plan to make it so each person can control which plugins are enabled for their channel and some other stuff.

### Project Status

I'm currently in the process of porting over all of the existing evanbotpro functionality to this new plugin system. This is basically just a foundation currently.

### Warnings

- **The plugin API is subject to change.**
- **Currently values are reloaded from the `.env` file every time a message is received by the bot. This means if you save your `.env` file with bad values or syntax, you can crash the bot.**

### License

My bot is available under the MIT license. Basically, you can use this code for fun, profit, or whatever you want as long as you retain the original license + copyright notice in the [LICENSE](./LICENSE) file and don't try to pass it off as your own or hide that the code came from here.
