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

function find_bureau(noms){
    for (let i in noms){
        let bureau = bureaux[noms[i].toLowerCase()];
        if(bureau){
            return bureau;
        }
    }
    return false;
}

var binding_bureaux = {
    name : "bureaux",
    method:"NLP",
    description:"Indique la salle des membre de l'administration de polytech",
    keywords:{
        question:["quel","quelle","où"],
        bureau:["bureau","salle"]
    },
    antiwords:{
        mon:["mon"]
    },
    parameters:{
        prof: ["[A-Z][a-z]+","g"]
    },
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
            input: "Où se trouve le bureau de Mme Dupont?",
            result: {prof:["Ou","Mme","Dupont"]}
        },
        {
            input: "Quel est le bureau de Mme Dupont ?",
            result: {prof:["Quel","Mme","Dupont"]}
        },
        {
            input: "Quel est le numéro de salle de Dupont ?",
            result: {prof:["Quel","Dupont"]}
        },
    ],
    callback : function(reply,params){
		if(params.prof == null){
            reply("Professeur non reconnu. Vous devez commencer le nom propre par une majuscule.");
            return;
        }
        let bureau;
        if(typeof params.prof === "string"){
           bureau = find_bureau(params.prof.split(" "));
        }
        else if(typeof params.prof === "object"){
            bureau = find_bureau(params.prof);
        }
        else{
            console.log("Error in command 'bureaux': parameter prof is not a correct type:");
            console.log(params.prof);
        }
        if(bureau){
            reply("Le bureau de "+bureau.nom+" est en "+bureau.bureau);
        }else{
            if(typeof params.prof === "string"){
                reply("Je n'ai pas trouvé de bureaux attribué à \""+params.prof+"\"");
            }
            else if(typeof params.prof === "object"){
                let profs = params.prof.join('" ou "');
                reply("Je n'ai pas trouvé de bureaux attribué à \""+profs+"\"");
            }

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
                let bureau = find_bureau(nom.split(" "));
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
