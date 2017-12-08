
var ref_binding_list = null;

function init(binding_list){
	ref_binding_list = binding_list;
}

function get_help(binding){
    let help = "*"+binding.name+"*\n";
    help += binding.description+"\n";
    if(!binding.method) {
        help += "_Patterns:_\n";
        for (let i in binding.patterns) {
            help += ">" + binding.patterns[i] + "\n";
        }
    }
    help += "_Exemples:_\n";
    for (let i in binding.tests){
        help += ">"+binding.tests[i].input+"\n";
    }
    return help;
}

function help(reply){
    let response = "Voici les différentes commandes disponibles:\n\n";
    for (let i in ref_binding_list){
        response += get_help(ref_binding_list[i]) + "\n";
    }
    reply(response);
}

var binding_help = {
    name : "help",
    description : "Affiche les différentes commandes disponibles",
    patterns : [
        "help",
        "aide",
        "commandes",
        "commands"
    ],
    synonyms :{},
    tests :[
        {
            input: "help",
            result: {}
        }
    ],
    callback : help
};

module.exports.bindings = [binding_help];
module.exports.name = "help";
module.exports.init = init;
