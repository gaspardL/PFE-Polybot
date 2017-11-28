// "use strict";

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
        rtm.sendMessage(request.message, request.channel,function(error,m){
            if(error){
                console.log("Error:");
                console.log(error);
                clearInterval(message_sending_timeout);
                message_sending_timeout = null;
                messages.unshift(request);
                setTimeout(start_sending_messages,1000);
            }
		});
	}
}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	// console.log(message);
	if(message.subtype == "file_share" && message.file.comments_count > 0){
		message.text = message.file.initial_comment.comment;
	}

	let result = dispatcher.dispatch(message);
	if(result){
		messages.push({message:result,channel:message.channel});
	}
});
