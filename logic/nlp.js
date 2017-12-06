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
        tagTypes: ['adv','ver','nom','pro','adj'],
        strictness: false,
        minimumLength: 2,
        debug: false
    };
    const keptTags = ["VER","NOM","ADV","PRO:int","PRO:rel","ADJ:int"];
    let nlptools = new NLPToolsFR(text, config);

    // On que certains types de mots dans la phrase (noms, verbes, pronoms interrogatifs...)
    let pos = nlptools.posTagger();
    let keywordsID = [];
    for(let i in pos){
        let tags = pos[i].pos;
        for(let j in tags){
            let tag = tags[j];
            if(keptTags.indexOf(tag) > -1){
                keywordsID.push(pos[i].id);
                break;
            }
        }

    }

    //On cherche les racines des mots trouvés
    let lemmas = nlptools.lemmatizer();
    let keywords = [];
    for(let i in lemmas){
        let lemma = lemmas[i];
        if(keywordsID.indexOf(lemma.id) > -1){
            keywords.push(lemma.lemma);
        }
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
console.log(nlp("ou est mon bureau?"));
console.log(nlp("quand passe le prochain bus?"));
console.log(nlp("quel est le bureau de Dupond?"));