function init(api){}

var binding_conflicting = {
    name : "conflict_test",
    description:"Indique la salle des membre de l'administration de polytech",
    patterns : [
        "bureauu {prof}",
    ],
    synonyms :{},
    tests :[
        {
            input: "bureauu Papazian",
            result: {prof:"ppapazian"}
        }
    ],
    callback : function(send,params){
        reply(params.prof);
    }
};

module.exports.bindings = [binding_conflicting];
module.exports.name = "conflicting";
module.exports.init = init;
