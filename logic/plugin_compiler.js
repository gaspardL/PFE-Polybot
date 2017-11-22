"use strict";

const cucumber = require("cucumber-expressions");
const CucumberExpression = cucumber.CucumberExpression;
const RegularExpression = cucumber.RegularExpression;
const CucumberExpressionGenerator = cucumber.CucumberExpressionGenerator;
const ParameterTypeRegistry = cucumber.ParameterTypeRegistry;
const ParameterType = cucumber.ParameterType;

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

function compile(plugin){
    //On transforme les synonymes en leur équivalent en regex
    let synonyms = {};
    for (let i in plugin.synonyms){
        let regex = "(";
        for (let j in plugin.synonyms[i]){
            regex = regex.concat(plugin.synonyms[i][j],"|");
        }
        regex = regex.replace(/\|$/,")");
        synonyms[i] = regex;
    }
    console.log(synonyms);

    //On remplace les synonymes dans les patterns par leur équivalent en regex
    let patterns = [];
    for (let i in plugin.patterns){
        patterns[i] = plugin.patterns[i];
        let sub = plugin.patterns[i].match(/\[[a-zA-Z0-9]+\]/g);
        for(let j in sub){
            let synonymName = sub[j].substr(1,sub[j].length-2);
            if(synonyms[synonymName]){
                patterns[i] = patterns[i].replace(sub[j],synonyms[synonymName])
            }
            else{
                console.error(synonymName," is not a defined synonym!")
            }
        }
    }
    console.log(patterns);

    //On construit une liste de parametres selon ce qu'on trouve dans les patterns
    let paramList = {};
    for (let i in patterns){
        let params = plugin.patterns[i].match(/{[a-zA-Z0-9]+}/g);
        for (let j in params){
            let paramName = params[j].substr(1,params[j].length-2);
            paramList[paramName] = paramName;
        }
    }

    //On dfinit un type par parametre trouvé
    let registry = new ParameterTypeRegistry();
    for( let paramName in paramList){
        registry.defineParameterType(new ParameterType(
            paramName,           // name
            /(.*?)/, 			// regexp
            String,             // type
            s => s, 			// transformer
            false,             // useForSnippets
            true               // preferForRegexpMatch
        ))
    }

    //On construit les CucumberExpressions basés sur les patterns
    let expressions = [];
    for (let i in patterns){
        expressions[i] = new CucumberExpression(patterns[i],registry);
    }

    //On ajoute les expressions au plugin
    plugin.expressions = expressions;
}

compile(plugin_bureaux);
console.log(plugin_bureaux);