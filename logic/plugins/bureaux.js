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
        "(ou se trouve)( )(la/le)( )[salle]( )(de/du)( )([titre]) {prof}( )(?)",
        "(dans quelle)( )[salle]( )(se trouve)( )([titre]) {prof}( )(?)"
    ],
    synonyms :{
        salle : ["salle","bureau"],
        titre: ["M","Mme","Monsieur","Madame","Professeur","Prof"]
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