var plugin_bureaux = {
    name : "bureaux",
    description:"Indique la salle des membre de l'administration de polytech",
    patterns : [
        "(où se trouve)? [salle] (de|du)? [titre]?{prof}",
        "dans quelle [salle] se trouve [titre]?{prof}"
    ],
    synonyms :{
        salle : ["(la )?salle","(le )?bureau"],
        titre: ["M.","Mme.","Monsieur","Madame","Professeur","Prof"]
    },
    tests :[
        {
            input: "Où se trouve la salle de M. Papazian",
            result: {prof:"papazian"}
        }
    ],
    callback : function(params){
        return params.prof
    }
};

