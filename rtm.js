"use strict";

require('dotenv').config();
const git = require('simple-git/promise');
const WebClient = require('@slack/client').WebClient;
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const dispatcher = require("./logic/plugin_dispatcher");
const api = require("./logic/api");


var token = process.env.SLACK_API_TOKEN || '';
var bot_token = process.env.SLACK_BOT_TOKEN || '';

var web = new WebClient(token);
var rtm = new RtmClient(bot_token);
rtm.start();
console.log("Server connected to slackbot ("+bot_token+")");

api.init(web, rtm);
dispatcher.init();

web.im.list(function (err, res) {
    if(err){
        console.log(err);
    }
    else{
        console.log(res);
    }
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	if(message.subtype === "file_share" && message.file.comments_count > 0){
		message.text = message.file.initial_comment.comment;
	}
	if(message.subtype === "message_changed"){
		message.text = message.message.text;
		message.user = message.message.user;
	}

	console.log("--- Received:");
	console.log(message);
	console.log("---");

    function reply(result){
        console.log("--- Sent:");
        console.log(result);
        console.log("---");
        if(result){
			api.send_message(result, message.channel);
        }
    }

    api.get_user_info(message.user,function(err, user){
		if(err){
			reply("Error while accessing your informations");
			return;
		}
        let match = dispatcher.dispatch(message.text,user);
        if(match){
            match.binding.callback(reply, match.params, message);
        }
        else{
            reply("Je n'ai pas compris votre commande. Pour savoir ce que je peux faire, dites \"help\".");
        }
    });

});
