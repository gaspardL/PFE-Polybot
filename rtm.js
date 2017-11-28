"use strict";

require('dotenv').config();
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const dispatcher = require("./logic/plugin_dispatcher");

dispatcher.load_plugins();

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);
rtm.start();
console.log("Server connected to slackbot ("+bot_token+")");

var messages = [];

var message_sending_timeout = null;

function start_sending_messages(){
    if(!message_sending_timeout)
        message_sending_timeout = setInterval(send_message,100);
}

start_sending_messages();

function send_message(){
	if(messages.length >= 1){
		let request = messages.shift();
		console.log("Send: "+request.message);
        rtm.sendMessage(request.message, request.channel,function(error,m){
            if(error){
                console.log("Error:");
                console.log(error);
                clearInterval(message_sending_timeout);
                message_sending_timeout = null;
                messages.unshift(request);
                setTimeout(start_sending_messages,1000)
            }
		});
	}
}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    console.log(" --- Message received:");
    console.log(message);
    console.log(" --- ");
    // console.log("<=== "+message.user+" : "+ message.text);
	let result = dispatcher.dispatch(message.text);
	if(result){
		messages.push({message:result,channel:message.channel});
		// rtm.sendMessage(result, message.channel);
        // console.log("===> ("+message.user+") : "+ result);
	}
});
