var binding_bureaux = {
    name : "bureaux",
    description:"Indique la salle des membre de l'administration de polytech",
    patterns : [
        "(où se trouve)( )(la/le)( )[salle]( )(de/du)( )([titre])(./ ){prof}",
        "(dans quelle)( )[salle]( )(se trouve)( )([titre])(./ ){prof}"
    ],
    synonyms :{
        salle : ["salle","bureau"],
        titre: ["Monsieur","Madame","Professeur","Prof"]
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

module.exports.bindings = [binding_bureaux];