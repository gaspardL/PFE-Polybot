function init(api){}

var ping = {
    name : "ping",
    description:"Simple ping/pong permettant des mesures de temps de réponse",
    patterns : [
        "ping {message}",
    ],
    synonyms :{},
    tests :[
        {
            input: "Ping 5",
            result: {message:"5"}
        }
    ],
    callback : function(reply, params){
        reply("pong "+params.message);
    }
};

module.exports.bindings = [ping];
module.exports.name = "ping";
module.exports.init = init;
