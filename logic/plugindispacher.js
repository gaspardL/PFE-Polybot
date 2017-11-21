const levenshtein = require("./levenshtein");

function help(){
    return "Help!"
}

plugin_help = {
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
    for (let pattern in plugin.patterns){
        let length = pattern.length;
        let maxDistance = length/4 + 1;
        if(levenshtein(message,pattern) <= maxDistance){
            return true;
        }
    }
    return false
}

module.exports.dispatch = function (message){
    message = message.toLowerCase();
    if(match(message,plugin_help)){
        return plugin_help.callback()
    }
    return false;
};