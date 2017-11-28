"use strict";

function deepcopy(object){
    return JSON.parse(JSON.stringify(object));
}

function deepequals(obj1,obj2){
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

const path = require("path");
const fs = require("fs");
const levenshtein = require("./levenshtein");
const compiler = require("./binding_compiler");

var binding_list = {};

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

function match(message,binding){
    for(let i in binding.expressions){
        let expression = binding.expressions[i];
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

function dispatch(message,bindings){
    if(!bindings) bindings = binding_list;
    message = message.toLowerCase() // met en minuscule
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // enlève les accents
    for(let i in bindings){
        let binding = bindings[i];
        let result = match(message,binding);
        if(result){
            return binding.callback(result);
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
            let result = dispatch(test.input,binding_test_list);
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
    var normalizedPath = path.join(__dirname, "plugins");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        load_plugin_file(file);
    });
}

module.exports.dispatch = dispatch;
module.exports.load_plugins = load_plugins;
