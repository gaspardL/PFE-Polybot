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
const levenshtein = require("./levenshtein");
const compiler = require("./binding_compiler");
const loggers = require("./logger");
const nlp = require("./nlp");

var rights = null;

var bot_token = process.env.SLACK_BOT_TOKEN || '';

var plugin_list = {};
var binding_list = {};

function match(message,binding){
    let method = binding.method;
    if(!method){
        message = message.toLowerCase() // met en minuscule
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // enlève les accents
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
    }
    else if (method === "NLP"){
        message = message.normalize('NFD');
        let keywords = nlp(message);
        console.log(keywords);

        for(let i in binding.antiwords){
            let baw = binding.antiwords[i];
            for(let j in baw){
                if(keywords.indexOf(baw[j]) > -1){
                    return false;
                }
            }
        }

        // On check que les keywords extraits de la phrase matchent ceux du binding
        for(let i in binding.keywords){
            let bkw = binding.keywords[i];
            let found = false;
            for(let j in bkw){
                if(keywords.indexOf(bkw[j]) > -1){
                    found = true;
                    break;
                }
            }
            if(!found){
                return false;
            }
        }

        // On extrait les parametres
        let params = {};
        for(let i in binding.parameters){
            console.log(message);
            params[i] = message.match(new RegExp(binding.parameters[i][0],binding.parameters[i][1]));
        }
        return params;
    }
    return false;
}

function dispatch(text,user,bindings){
    if(!bindings) bindings = binding_list;

    for(let i in bindings){
        let binding = bindings[i];
        if(binding.restricted){
            if(!rights.has_rights(user,binding.name)){
                continue;
            }
        }
        let params = match(text,binding);
        if(params){
            return {params:params, binding:binding};
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
    for(let i in plugin.bindings){
        let binding_name = plugin.bindings[i].name;
        if(binding_test_list[binding_name]){
            errors.push("La commande "+binding_name+" existe déjà")
        }
    }
    for(let i in binding_test_list){
        load_binding(binding_test_list[i],binding_test_list);
    }
    for(let i in plugin.bindings){
        load_binding(plugin.bindings[i],binding_test_list);
    }
    let test_user = {id: "test",is_admin: true, is_owner: true, is_primary_owner: true};
    for(let i in binding_test_list){
        let binding = binding_test_list[i];
        for (let j in binding.tests){
            let test = binding.tests[j];
            let result = dispatch(test.input,test_user,binding_test_list);
            if(!result){
                errors.push("La phrase \""+test.input+"\" de la commande \""+binding.name+"\" n'active aucune commande");
                continue;
            }
            if(result.binding.name !== binding.name){
                errors.push("La phrase \""+test.input+"\" de la commande \""+binding.name+"\" active la commande \""+result.binding.name+"\"");
                continue;
            }
            if(!deepequals(result.params,test.result)){
                errors.push("La phrase \""+test.input+"\" de la commande \""+binding.name+"\" resulte en des paramètres inattendus:\n"+
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
    // console.log("Testing "+plugin.name);
    let errors = test_plugin(plugin);
    if(errors.length > 0){
        // console.log("Tests failed");
        console.log("Erreurs lors du chargement du plugin "+plugin.name);
        for (let i in errors){
            console.log(" - "+errors[i]);
        }
        return errors;
    }else{
		plugin_list[plugin.name] = { bindings: [] };
        // console.log("Tests passed");
        // console.log("Loading plugin \""+plugin.name+"\"");
        for(let i in plugin.bindings){
			plugin_list[plugin.name].bindings.push(plugin.bindings[i].name);
            load_binding(plugin.bindings[i],binding_list)
        }
        console.log("Plugin \""+plugin.name+"\" loaded");
        return false;
    }
}

// Charge un plugin du dossier ./plugins
function load_plugin_file(file){
    let plugin = require(path.join(__dirname, "plugins", file));
    var res = load_plugin(plugin);
	if(!res){
		plugin_list[plugin.name].dirname = file;
        plugin.init();
	}
	return res;
}

// Charge les plugins se trouvant dans le dossier ./plugins
function load_user_plugins(){
    // load_plugin(plugin_help);
    // load_plugin(plugin_manager);
    var normalizedPath = path.join(__dirname, "plugins");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        load_plugin_file(file);
    });
}

function load_core_plugins(web){
    rights = require(path.join(__dirname, "core_plugins", "user_rights"));
    rights.init(web,loggers.new_logger("rights"),binding_list);
    load_plugin(rights);

	const help_plugin = require(path.join(__dirname, "core_plugins", "help"));
	help_plugin.init(binding_list);
	load_plugin(help_plugin);

    const plugin_manager = require(path.join(__dirname, "core_plugins", "plugin_manager"));
    plugin_manager.init(plugin_list, binding_list, bot_token, load_plugin_file);
	load_plugin(plugin_manager);
}


function init(web){
    load_core_plugins(web);
    load_user_plugins();
}

module.exports.dispatch = dispatch;
module.exports.init = init;
