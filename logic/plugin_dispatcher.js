"use strict";

require('dotenv').config();
const path = require("path");
const fs = require("fs");
const request = require('request');
const levenshtein = require("./levenshtein");
const compiler = require("./binding_compiler");

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var binding_list = {};

function match(message,binding){
    /*
    for (let i in plugin.patterns){
        let pattern = plugin.patterns[i];
        let length = pattern.length;
        let maxDistance = length/4 + 1;
        let distance = levenshtein(message,pattern);
        console.log("Matching",message,pattern,distance);
        if(distance <= maxDistance){
            return true;
        }
    }
    */
    for(let i in binding.expressions){
        let expression = binding.expressions[i];
        // console.log(expression);
        let result = expression.match(message);
        let params = {};
        // console.log("match");
        // console.log(expression);
        // console.log(message);
        // console.log(binding.name);
        // console.log(result);
        if(result){
            for (let i in result){
                let paramName = result[i]._parameterType._name;
                params[paramName] = result[i].getValue(null);
            }
            // console.log(params);
            return params;
        }
    }
    return false;
}

function dispatch(message){

    var messagetext = message.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    for(let i in binding_list){
        let binding = binding_list[i];
        let params = match(messagetext,binding);
        // console.log("dispatch");
        // console.log(result);
        if(params){
            return binding.callback(params, message);
        }
    }

    return false;
}

function load_binding(binding){
    compiler.compile(binding);
    binding_list[binding.name] = binding;
}

function load_plugin(file){
    let plugin = require("./plugins/" + file);
    for(let i in plugin.bindings){
        load_binding(plugin.bindings[i])
    }
    console.log("Plugin:",file, "loaded");
}

function load_plugins(){
    load_binding(binding_help);
    load_binding(binding_ajout_plugin);
    var normalizedPath = path.join(__dirname, "plugins");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        load_plugin(file);
    });
}

module.exports.dispatch = dispatch;
module.exports.load_plugins = load_plugins;

/*
 * PLUGINS MAITRES
 */

function get_help(binding){
    let help = "*"+binding.name+"*\n";
    help += binding.description+"\n";
    help += "_Patterns:_\n";
    for (let i in binding.patterns){
        help+=">"+binding.patterns[i]+"\n";
    }
    help += "_Exemples:_\n";
    for (let i in binding.tests){
        help += ">"+binding.tests[i].input+"\n";
    }
    return help;
}

function help(){
    let response = "Voici les différentes commandes disponibles:\n\n";
    for (let i in binding_list){
        response += get_help(binding_list[i]) + "\n";
    }
    return response;
}

var binding_help = {
    name : "help",
    description : "Affiche les différentes commandes disponibles",
    patterns : [
        "help",
        "aide",
        "commandes",
        "commands"
    ],
    synonyms :{},
    tests :[
        {
            input: "help",
            result: {}
        }
    ],
    callback : help
};

var binding_ajout_plugin = {
    name : "ajout plugin",
    description : "Permet d'ajouter des plugins",
    patterns : [
        "([ajouter])( )(le)( )(l')[plugin] {name}",
    ],
    synonyms :{
        ajouter: ["ajoute", "ajouter", "add"],
        plugin: ["plugin", "extension"]
    },
    tests :[
        {
            input: "ajoute plugin",
            result: {}
        }
    ],
    callback : ajout_plugin
};

function ajout_plugin(params, message){
    if(message.subtype != "file_share"){
        return "Veuillez uploader les sources de votre plugin et écrire cette commande en commentaire";
    }
    var pluginname = (params.name != "")? params.name : message.file.name;
    var index = pluginname.lastIndexOf('.js');
    if(index != -1){
        pluginname = pluginname.substr(0, index);
    }
    download(message.file.url_private_download, path.join(__dirname, "plugins", pluginname+".js"), (err) => {
        if (err) {
            console.error(err);
            return;
        }

        load_plugin(pluginname);
    });

    return "Plugin "+pluginname+" ajouté sur polybot";
}

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
