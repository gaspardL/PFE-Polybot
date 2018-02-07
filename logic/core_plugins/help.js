
var api = null;
var ref_binding_list = null;
var has_rights = null;

function init(botapi, binding_list, has_rights_fct){
    api = botapi;
	ref_binding_list = binding_list;
	has_rights = has_rights_fct;
}

function get_help(user, binding){
    let help = "*"+binding.name+"*\n";
    help += binding.description+"\n";
    // if(!binding.method) {
    //     help += "_Patterns:_\n";
    //     for (let i in binding.patterns) {
    //         help += ">" + binding.patterns[i] + "\n";
    //     }
    // }
    help += "_Exemples:_\n";
    for (let i in binding.tests){
        help += ">"+binding.tests[i].input+"\n";
    }
    return help;
}

function help(reply, params, message){
    let response = "Voici les différentes commandes disponibles:\n\n";
    api.get_user_info(message.user, (err, res) => {
        for (let i in ref_binding_list){
            if(has_rights(res, ref_binding_list[i].name))
                response += get_help(message.user, ref_binding_list[i]) + "\n";
        }
    });
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
