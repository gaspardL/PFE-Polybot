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
    callback : function(params){
        return params.prof;
    }
};

module.exports.bindings = [binding_conflicting];
module.exports.name = "conflicting";
