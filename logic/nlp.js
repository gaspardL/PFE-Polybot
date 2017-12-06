const SpellChecker = require('simple-spellchecker');
let dictionary = SpellChecker.getDictionarySync("fr-FR");

var NLPToolsFR = require('nlp-js-tools-french');

function spellcheck(text){
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
        strictness: true,
        minimumLength: 2,
        debug: false
    };
    let nlptools = new NLPToolsFR(text, config);

    // On cherche quels sont les mots qui sont des noms ou des verbes dans la phrase
    let pos = nlptools.posTagger();
    let keywordsID = [];
    for(let i in pos){
        if(pos[i].pos[0] === 'VER' || pos[i].pos[0] === 'NOM'){
            keywordsID.push(i);
        }
    }

    //On enlève les conjugaisons et les accords
    let lemmas = nlptools.lemmatizer();
    let keywords = [];
    for(let i in keywordsID){
        keywords.push(lemmas[keywordsID[i]].lemma);
    }
    return keywords
}

function nlp(text){
    text = spellcheck(text);
    let words = getKeywords(text);
    return words;
}

console.log(nlp("bonjour madame"));
console.log(nlp("bonjoure maddame"));
console.log(nlp("ou se trouv les salles de m mosser"));
