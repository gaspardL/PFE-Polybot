"use strict";

const normalize = require("../../string_normalize");

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

var webapi = null;

function init(api){
	webapi = api;
}

function find_bureau(nom){
    let noms = nom.split(" ");
    for (let i in noms){
        let bureau = bureaux[noms[i]];
        if(bureau){
            return bureau;
        }
    }
    return false;
}

var binding_bureaux = {
    name : "bureaux",
    description:"Indique la salle des membre de l'administration de polytech",
    patterns : [
        "(ou se trouve)( )(la/le)( )[bureau]( )(de/du)( )([monsieur]) {prof}( )(?)",
        "(ou est)( )(la/le)( )[bureau]( )(de/du)( )([monsieur]) {prof}( )(?)",
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
    callback : function(reply,params){
        let bureau = find_bureau(params.prof);
        if(bureau){
            reply("Le bureau de "+bureau.nom+" est en "+bureau.bureau);
        }else{
            reply("Je n'ai pas trouvé de bureaux attribué à \""+params.prof+"\"");
        }
    }
};

var binding_mon_bureaux = {
    name : "mon_bureau",
    description:"Indique le bureau de l'utilisateur",
    patterns : [
        "(ou se trouve)( )mon/ma( )[bureau]( )(?)",
        "(ou est)( )mon/ma( )[bureau]( )(?)",
        "(quelle/quel)( )(est)( )mon/ma( )[bureau]( )(?)",
    ],
    synonyms :{
        bureau : ["salle","bureau"],
    },
    tests :[
        {
            input: "Où se trouve mon bureau",
            result: {}
        },
        {
            input: "Où est mon bureau",
            result: {}
        },
    ],
    callback : function(reply, params, message){
        webapi.get_user_info(message.user, function(err,res){
            if(err){
                reply("Erreur: "+err);
            }else{
                let nom = normalize(res.profile.real_name);
                let bureau = find_bureau(nom);
                if(bureau){
                    reply("Votre bureau est en "+bureau.bureau);
                }
                else{
                    reply("Je n'ai pas trouvé de bureaux attribué à \""+nom+"\"");
                }
            }
        })
    }
};

module.exports.bindings = [binding_bureaux,binding_mon_bureaux];
module.exports.name = "bureaux";
module.exports.init = init;
