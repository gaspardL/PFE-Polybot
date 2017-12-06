const SpellChecker = require('simple-spellchecker');
let dictionary = SpellChecker.getDictionarySync("fr-FR");

var nlptoolsfr = require('nlp-js-tools-french');

function spellcheck1(text){
    let words = text.split(" ");
    for(let i in words){
        let word = words[i];
        let suggestions = dictionary.getSuggestions(word);
        if(suggestions.length > 0){
            words[i] = suggestions[0];
        }
    }
    let corrected = words.join(" ");
    return corrected;
}

function getKeywords(text){
    const config = {
        tagTypes: ['ver', 'nom'],
        strictness: false,
        minimumLength: 2,
        debug: false
    };
    let nlptools = new nlptoolsfr(text, config);
    console.log(nlptools.posTagger());
    let lemmas = nlptools.lemmatizer();
    let keywords = [];
    for(let i in lemmas){
        keywords.push(lemmas[i].lemma);
    }
    return keywords
}

function nlp(text){
    text = spellcheck1(text);
    let words = getKeywords(text);
    return words;
}

console.log(nlp("bonjour madame"));
console.log(nlp("bonjoure maddame"));
console.log(nlp("ou se trouv le burau de m mosser"));
