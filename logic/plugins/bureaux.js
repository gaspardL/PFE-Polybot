"use strict";

var bureaux = {
    papazian:{
        nom:"M. Christophe Papazian",
        bureau:"O+310"
    },
    mosser: {
        nom:"M. Sébastien Mosser",
        bureau:"O+444"
    }

};

var binding_bureaux = {
    name : "bureaux",
    description:"Indique la salle des membre de l'administration de polytech",
    patterns : [
        "(ou se trouve)( )(la/le)( )[bureau]( )(de/du)( )([monsieur]) {prof}( )(?)",
        "(quelle/quel)( )(est)( )(la/le)( )[bureau]( )(de/du)( )([monsieur]) {prof}( )(?)",
        "(dans)( )(quelle/quel)( )[bureau]( )(se trouve)( )([monsieur]) {prof}( )(?)"
    ],
    synonyms :{
        bureau : ["salle","bureau"],
        monsieur: ["m","mme","monsieur","madame","professeur","prof"]
    },
    tests :[
        {
            input: "Où se trouve la salle de M Papazian",
            result: {prof:"papazian"}
        }
    ],
    callback : function(params){
        let noms = params.prof.split(" ");
        for (let i in noms){
            let bureau = bureaux[noms[i]];
            if(bureau){
                return "Le bureau de "+bureau.nom+" est en "+bureau.bureau
            }
        }
        return "Je n'ai pas trouvé de membre de Polytech' répondant au nom de \""+params.prof+"\"";
    }
};

module.exports.bindings = [binding_bureaux];
module.exports.name = "bureaux";