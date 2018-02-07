var envibus = {
    name : "Prochain bus",
    description:"Permet de connaitre l'horaire du prochain bus qui va passer à un arrêt",
    patterns : [
        "prochain bus ligne {ligne} a {arret}",
    ],
    synonyms :{},
    tests :[
        {
            input: "prochain bus ligne 1 à templiers",
            result: {ligne: "1", arret: "templiers"}
        }
    ],
    callback : function(reply,params){
        reply("Le prochain bus de la ligne "+params.ligne+" arrive à l'arrêt "+params.arret+" dans 8 minutes");
    }
};

module.exports.bindings = [envibus];
module.exports.name = "envibus";
module.exports.init = function(){};
