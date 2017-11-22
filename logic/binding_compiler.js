"use strict";

const cucumber = require("cucumber-expressions");
const CucumberExpression = cucumber.CucumberExpression;
const RegularExpression = cucumber.RegularExpression;
const CucumberExpressionGenerator = cucumber.CucumberExpressionGenerator;
const ParameterTypeRegistry = cucumber.ParameterTypeRegistry;
const ParameterType = cucumber.ParameterType;

function compile(binding){
    //On transforme les synonymes en leur équivalent en regex
    let synonyms = {};
    for (let i in binding.synonyms){
        let regex = "";
        for (let j in binding.synonyms[i]){
            regex = regex.concat(binding.synonyms[i][j],"/");
        }
        regex = regex.replace(/\/$/,"");
        synonyms[i] = regex;
    }
    //console.log(synonyms);

    //On remplace les synonymes dans les patterns par leur équivalent en regex
    let patterns = [];
    for (let i in binding.patterns){
        patterns[i] = binding.patterns[i];
        let sub = binding.patterns[i].match(/\[[a-zA-Z0-9]+\]/g);
        for(let j in sub){
            let synonymName = sub[j].substr(1,sub[j].length-2);
            if(synonyms[synonymName]){
                patterns[i] = patterns[i].replace(sub[j],synonyms[synonymName]).toLowerCase()
            }
            else{
                console.error(synonymName," is not a defined synonym!")
            }
        }
    }
    //console.log(patterns);

    //On construit une liste de parametres selon ce qu'on trouve dans les patterns
    let paramList = {};
    for (let i in patterns){
        let params = binding.patterns[i].match(/{[a-zA-Z0-9]+}/g);
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
    binding.expressions = expressions;
}

module.exports.compile = compile;