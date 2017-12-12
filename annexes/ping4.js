var ping4 = {
    name : "ping",
    description:"Simple ping/pong permettant des mesures de temps de réponse",
    patterns : [
        "ping {message}",
    ],
    synonyms :{},
    tests :[
        {
            input: "ping 5",
            result: {message:"5"}
        }
    ],
    callback : function(reply,params){
        reply("pong "+params.message);
    }
};

module.exports.bindings = [ping4];
module.exports.name = "ping4";
module.exports.init = function(){};