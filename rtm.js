require('dotenv').config();
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const dispatcher = require("./logic/plugin_dispatcher");

dispatcher.load_plugins();

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);
rtm.start();
console.log("Server connected to slackbot ("+bot_token+")");

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    console.log("<=== "+message.user+" : "+ message.text);
	let result = dispatcher.dispatch(message.text);
	if(result){
		rtm.sendMessage(result, message.channel);
        console.log("===> ("+message.user+") : "+ result);
	}
});
