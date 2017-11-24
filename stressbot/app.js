require('dotenv').config();

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var bot_tokens = [];
bot_tokens.push(process.env.STRESS_BOT_1_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_2_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_3_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_4_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_5_TOKEN || '');

var rtm = [];
for(var i in bot_tokens){
	var client = new RtmClient(bot_tokens[i]);
	client.start();
	rtm.push(client);
}

rtm[0].on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	if (message.text === "charge") {
		destroyEverything2(message.channel, 862, 100);
	}
});

// function destroyEverything(channel){
// 	for(var cli in rtm){
// 		for(var i =0; i < 25; i++){
// 			rtm[cli].sendMessage("Où se trouve la salle de M. Papazian", channel);
// 		}
// 	}
// }

function destroyEverything2(channel, interval, nbRequest){
	if(nbRequest <= 0) return;

	rtm[nbRequest%rtm.length].sendMessage("Où se trouve la salle de M. Papazian", channel);

	setTimeout(destroyEverything2, interval, channel, interval, nbRequest-1);

}

//
// function pause(millis)
// {
// 	var date = new Date();
// 	var curDate = null;
//
// 	do { curDate = new Date(); }
// 	while(curDate-date < millis);
// }
