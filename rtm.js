"use strict";

require('dotenv').config();
const git = require('simple-git/promise');
const WebClient = require('@slack/client').WebClient;
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const dispatcher = require("./logic/plugin_dispatcher");
const api = require("./logic/api");
const https = require('https');
const { URL } = require('url');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const request = require('request');
const rimraf = require('rimraf');

var token = process.env.SLACK_API_TOKEN || '';
var bot_token = process.env.SLACK_BOT_TOKEN || '';

var web = new WebClient(token);
var rtm = new RtmClient(bot_token);
rtm.start();
console.log("Server connected to slackbot ("+bot_token+")");

api.init(web, rtm);
dispatcher.init();

api.log();

function download(url, dest, cb) {
    // on créé un stream d'écriture qui nous permettra
    // d'écrire au fur et à mesure que les données sont téléchargées
    const file = fs.createWriteStream(dest);

    // on lance le téléchargement
    const sendReq = request.get(url, {
        'auth': {
            'bearer': bot_token
        }
    });

    // on vérifie la validité du code de réponse HTTP
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
    });

    // au cas où request rencontre une erreur
    // on efface le fichier partiellement écrit
    // puis on passe l'erreur au callback
    sendReq.on('error', (err) => {
        fs.unlink(dest);
        cb(err.message);
    });

    // écrit directement le fichier téléchargé
    sendReq.pipe(file);

    // lorsque le téléchargement est terminé
    // on appelle le callback
    file.on('finish', () => {
        // close étant asynchrone,
        // le cb est appelé lorsque close a terminé
        file.close(cb);
    });

    // si on rencontre une erreur lors de l'écriture du fichier
    // on efface le fichier puis on passe l'erreur au callback
    file.on('error', (err) => {
        // on efface le fichier sans attendre son effacement
        // on ne vérifie pas non plus les erreur pour l'effacement
        fs.unlink(dest);
        cb(err.message);
    });
}

function downloadTemp(url,filename,callback){
    fs.mkdtemp(path.join(".","tmp","tmp_"),(err, folder) => {
        if (err) callback(err);
        let filepath = path.join(folder,filename);
        download(url,filepath,function (err) {
            if (err) callback(err);
            callback(null,filepath);
        })
    });
}

rtm.on(RTM_EVENTS.MESSAGE, (message) => {
	let text = message.text;
	if(message.subtype === "file_share" && message.file.comments_count > 0){
		text = message.file.initial_comment.comment;
	}
	if(message.subtype === "message_changed"){
		text = message.message.text;
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

    promises.push(new Promise(function(resolve,reject){
        api.get_user_info(message.user,function(err, user){
            if(err){
                reply("Error while accessing your informations");
                reject(err);
                return;
            }
            resolve(user);
        });
    }));

    Promise.all(promises).then(values => {
        let user = values[values.length - 1];
        let filepath = values[values.length - 2];
        let match = dispatcher.dispatch(text,user);
        if(match){
            match.binding.callback(reply, match.params, message,filepath);
        }
        else{
            reply("Je n'ai pas compris votre commande. Pour savoir ce que je peux faire, dites \"help\".");
        }
    });


});

rimraf("tmp",function(err){
    if(err) console.log(err);
    fs.mkdirSync("tmp");
});


console.log("Bot ready");