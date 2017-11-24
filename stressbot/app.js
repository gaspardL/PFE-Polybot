require('dotenv').config();

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var bot_tokens = [];
bot_tokens.push(process.env.STRESS_BOT_1_TOKEN || '');
bot_tokens.push(process.env.STRESS_BOT_2_TOKEN || '');
bot_tokens.push(process.env.STRESS_BOT_3_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_4_TOKEN || '');
// bot_tokens.push(process.env.STRESS_BOT_5_TOKEN || '');

var rtm = [];
for(var i in bot_tokens){
	var client = new RtmClient(bot_tokens[i]);
	client.start();
	rtm.push(client);
}

var NB_REQUEST = 150;
var INTERVAL = 300;

var request_time = [];
var mean_time = 0;

rtm[0].on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	if (message.text === "charge") {
		destroyEverything2(message.channel, INTERVAL, NB_REQUEST);
	}
	var tab = message.text.split(" ");
	if(tab[0] === "pong"){
		var nbrequest = parseInt(tab[1]);
		var sent = request_time[nbrequest];
		var time = new Date()-sent;
		mean_time = (mean_time*(nbrequest) + time)/ (nbrequest+1);
		console.log("pong received in "+time+" ms (average : "+mean_time+" ms)");
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

	rtm[nbRequest%rtm.length].sendMessage("ping "+(NB_REQUEST-nbRequest), channel);
	request_time.push(new Date());

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
