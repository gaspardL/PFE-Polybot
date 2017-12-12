var ping2 = {
    name : "ping2",
    description:"Simple ping/pong permettant des mesures de temps de réponse",
    patterns : [
        "ping2 {message}",
    ],
    synonyms :{},
    tests :[
        {
            input: "ping2 5",
            result: {message:"5"}
        }
    ],
    callback : function(reply,params){
        reply("pong2 "+params.message);
    }
};

module.exports.bindings = [ping2];
module.exports.name = "ping2";