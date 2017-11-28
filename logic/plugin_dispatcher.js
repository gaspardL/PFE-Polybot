"use strict";

function deepcopy(object){
    return JSON.parse(JSON.stringify(object));
}

function deepequals(obj1,obj2){
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

require('dotenv').config();
const path = require("path");
const fs = require("fs");
const request = require('request');
const levenshtein = require("./levenshtein");
const compiler = require("./binding_compiler");



var bot_token = process.env.SLACK_BOT_TOKEN || '';

var binding_list = {};

function match(message,binding){
    for(let i in binding.expressions){
        let expression = binding.expressions[i];
        // console.log(expression);
        let result = expression.match(message);
        let params = {};
        if(result){
            for (let i in result){
                let paramName = result[i]._parameterType._name;
                params[paramName] = result[i].getValue(null);
            }
            return params;
        }
    }
    return false;
}

function dispatch(text,message,bindings){
    if(!bindings) bindings = binding_list;
    text = text.toLowerCase() // met en minuscule
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // enlève les accents
    for(let i in bindings){
        let binding = bindings[i];
        let params = match(text,binding);
        if(params){
            return binding.callback(params, message);
        }
    }

    return false;
}

// Charge un binding
function load_binding(binding,binding_list){
    compiler.compile(binding);
    binding_list[binding.name] = binding;
}

// Teste un plugin
function test_plugin(plugin_to_test){
    let errors = [];
    let binding_test_list = deepcopy(binding_list);
    let plugin = deepcopy(plugin_to_test);
    for(let i in binding_test_list){
        load_binding(binding_test_list[i],binding_test_list);
    }
    for(let i in plugin.bindings){
        load_binding(plugin.bindings[i],binding_test_list);
    }
    for(let i in binding_test_list){
        let binding = binding_test_list[i];
        binding.callback = function(params){
            return {name: binding.name, params: params};
        }
    }
    for(let i in binding_test_list){
        let binding = binding_test_list[i];
        for (let j in binding.tests){
            let test = binding.tests[j];
            let result = dispatch(test.input,null,binding_test_list);
            if(result.name !== binding.name){
                errors.push("La phrase "+test.input+" de la commande "+binding.name+" active la commande "+result.name);
                continue;
            }
            if(!deepequals(result.params,test.result)){
                errors.push("La phrase "+test.input+" de la commande "+binding.name+" resulte en des paramètres inattendus:\n"+
                    JSON.stringify(result.params,null,'\t')+"\n"+
                    "au lieu de:\n"+
                    JSON.stringify(test.result,null,'\t'))
            }
        }
    }
    return errors;
}

// Teste et charge un plugin
function load_plugin(plugin){
    console.log("Testing "+plugin.name);
    let errors = test_plugin(plugin);
    if(errors.length > 0){
        console.log("Tests failed");
        for (let i in errors){
            console.log("Erreurs lors du chargement du plugin");
            console.log(errors[i]);
        }
        return false;
    }else{
        for(let i in plugin.bindings){
            load_binding(plugin.bindings[i],binding_list)
        }
        console.log("Tests passed");
        return true;
    }
}

// Charge un plugin du dossier ./plugins
function load_plugin_file(file){
    console.log("Loading plugin:",file);
    let plugin = require("./plugins/" + file);
    load_plugin(plugin);
    console.log("Plugin:",file, "loaded");
}

// Charge les plugins se trouvant dans le dossier ./plugins
function load_plugins(){
    load_plugin(plugin_help);
    load_plugin(plugin_ajout_plugin);
    var normalizedPath = path.join(__dirname, "plugins");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        load_plugin_file(file);
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

var plugin_help = {
    name: "help",
    bindings : [{
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
    }]
};

var plugin_ajout_plugin = {
    name : "ajout plugin",
    bindings : [{
        name : "ajout plugin",
        description : "Permet d'ajouter des plugins",
        patterns : [
            "([ajouter])( )(le)( )(l')[plugin]",
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
    }]
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

        load_plugin_file(pluginname);
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
