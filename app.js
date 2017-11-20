var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	if (message.text === "charge") {
		var channel = "D82METR8T"; //could also be a channel, group, DM, or user ID (C1234), or a username (@don)
		var nbErr = 0;
		for(var i =0; i < 1000; i++){
			try{
				rtm.sendMessage("hi", message.channel);
			}catch(e){nbErr++;}
		}
		console.log("Nombre d'erreurs : "+nbErr);
	}
});
