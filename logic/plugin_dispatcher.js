"use strict";

const levenshtein = require("./levenshtein");

function help(){
    return "Help!";
}

var plugin_help = {
    name : "help",
    patterns : [
        "help",
        "help me",
        "aide",
        "aide moi",
        "à l'aide"
    ],
    callback : help
};


function match(message,plugin){
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
    return false;
}

module.exports.dispatch = function (message){
    message = message.toLowerCase();
    if(match(message,plugin_help)){
        return plugin_help.callback();
    }
    return false;
};
