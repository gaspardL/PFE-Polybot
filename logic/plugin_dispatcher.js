"use strict";

const path = require("path");
const fs = require("fs");
const levenshtein = require("./levenshtein");
const compiler = require("./binding_compiler");

var binding_list = {};

function help(){
    return "Help!";
}

var binding_help = {
    name : "help",
    patterns : [
        "help",
        "help me",
        "aide",
        "aide moi",
        "à l'aide"
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
        let result = expression.match(message);
        let params = {};
        console.log("match");
        console.log(expression);
        console.log(message);
        console.log(binding.name);
        console.log(result);
        if(result){
            for (let i in result){
                let paramName = result[i]._parameterType._name;
                params[paramName] = result[i].getValue(null);
            }
            console.log(params);
            return params;
        }
    }
    return false;
}

function dispatch(message){

    message = message.toLowerCase();
    for(let i in binding_list){
        let binding = binding_list[i];
        let result = match(message,binding);
        console.log("dispatch");
        console.log(result);
        if(result){
            return binding.callback(result);
        }
    }

    return false;
}

function load_binding(binding){
    compiler.compile(binding);
    binding_list[binding.name] = binding;
}

function load_plugin(file){
    console.log("Loading plugin:",file);
    let plugin = require("./plugins/" + file);
    for(let i in plugin.bindings){
        load_binding(plugin.bindings[i])
    }
    console.log("Plugin:",file, "loaded");
}

function load_plugins(){
    load_binding(binding_help);
    var normalizedPath = path.join(__dirname, "plugins");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        load_plugin(file);
    });
}

module.exports.dispatch = dispatch;
module.exports.load_plugins = load_plugins;