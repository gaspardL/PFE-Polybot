"use strict";

require('dotenv').config();
const git = require('simple-git/promise');
var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const dispatcher = require("./logic/plugin_dispatcher");


// git().clone("https://github.com/gaspardL/Polybot-Test-Plugin.git", "./logic/plugins/tmp")
// .then(() => dispatcher.load_plugins())
// .catch((err) => console.error('failed: ', err));



var token = process.env.SLACK_API_TOKEN || '';
var bot_token = process.env.SLACK_BOT_TOKEN || '';

var web = new WebClient(token);
var rtm = new RtmClient(bot_token);
rtm.start();
console.log("Server connected to slackbot ("+bot_token+")");

dispatcher.init(web);

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

function get_user_info(user_id,callback){
    web.users.info(user_id,function(err,res){
        if(err){
            console.log("Error in get_user_info:");
            console.log(err);
        }else{
            callback(res.user);
        }
    });
}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	let text = message.text;
	if(message.subtype === "file_share" && message.file.comments_count > 0){
		text = message.file.initial_comment.comment;
	}
	if(message.subtype === "message_changed"){
		text = message.message.text;
	}

	console.log(message);

    function reply(result){
        if(result){
            messages.push({message:result,channel:message.channel});
        }
    }

    get_user_info(message.user,function(user){
        let match = dispatcher.dispatch(text,user);
        match.binding.callback(reply,match.params,message,web);
    });


});
