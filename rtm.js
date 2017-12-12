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

/*
function download(urll,callback){
    let url = new URL(urll);
    let options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: {
            Authorization: 'Bearer '+bot_token
        }
    };
    https.get(options, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            callback(null,data);
        });

    }).on("error", (err) => {
        console.log("Error in download:");
        console.log(err);
        callback(err,null);
    });
}*/

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    let promises = [];

	let text = message.text;
	if(message.subtype === "file_share" && message.file.comments_count > 0){
		text = message.file.initial_comment.comment;
		/*
		download(message.file.url_private_download,function (err, data) {
            console.log("--- Data");
		    console.log(data);
		    console.log("---");
		    let book = XLSX.readFile("./annexes/bureaux.xlsx");
		    let sheet = book.Sheets[book.SheetNames[0]];
            let obj = XLSX.utils.sheet_to_json(sheet);
            console.log(obj);
        });*/
		/*
        console.log(message.file.url_private_download);
        let pth = fs.mkdtempSync(path.join(".","tmp","file_share_"));
		let filepath = path.join(pth,message.file.name);
		console.log(filepath);
		download(message.file.url_private_download,filepath,function (err) {
            let book = XLSX.readFile(filepath);
            let sheet = book.Sheets[book.SheetNames[0]];
            let obj = XLSX.utils.sheet_to_json(sheet);
            console.log(obj);
        })*/
		promises.push(new Promise(function(resolve,reject){
            downloadTemp(message.file.url_private_download,message.file.name,function(err,filepath){
                if(err) {
                    reject(err);
                    return;
                }
                resolve(filepath);
                setTimeout(function () {
                    rimraf(path.dirname(filepath),function (err) {
                        if(err) console.log(err);
                    });
                },60000)
                /*
                let book = XLSX.readFile(filepath);
                let sheet = book.Sheets[book.SheetNames[0]];
                let obj = XLSX.utils.sheet_to_json(sheet);
                console.log(obj);*/
            });
        }))

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