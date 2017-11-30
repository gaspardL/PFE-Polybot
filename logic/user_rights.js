"use strict";

const levenshtein = require("./levenshtein");
const norm = require("./string_normalize");
const fs = require('fs');

var binding_rights = {};

var web = null;

function init(webapi){
    web = webapi;
    load_info();
}

function load_info(){
    fs.readFile("data/user_rights.json", "utf8", function (err, data){
        if (err){
            console.log("Error in load_info:");
            console.log(err);
        } else {
            binding_rights = JSON.parse(data);
        }
    });
}

function save_info(){
    let json = JSON.stringify(binding_rights);
    fs.writeFile("data/user_rights.json", json, 'utf8', function (err) {
        if (err) {
            console.log("Error in save_info:");
            console.log(err);
        }
    });
}

function add_binding_right(user_id,binding_name){
    if(!binding_rights[user_id]){
        binding_rights[user_id] = {};
    }
    binding_rights[user_id][binding_name] = true;
    save_info();
}

function is_admin(user){
    return user.is_admin || user.is_owner || user.is_primary_owner;
}

function has_rights(user,binding_name){
    if(binding_rights[user.id] && binding_rights[user.id][binding_name]){
        return true;
    }else{
        return is_admin(user);
    }
}

function find_user(user_name, callback){
    web.users.list(function (err, res) {
       if(err){
           console.log("Error in find_user: ");
           console.log(err);
       }else{
           let found = [];
           let users = res.members;
           for(let i in users){
               let user = users[i];
               console.log(user);
               console.log(norm(user.profile.real_name_normalized));
               let names = [norm(user.profile.real_name_normalized),norm(user.profile.display_name_normalized)];
               for(let j in names){
                   let name = names[j];
                   if(levenshtein(user_name,name) < 4){
                       found.push(user);
                       break;
                   }
               }
           }
           callback(found);
       }
    });
}

var binding_add_rights = {
    name : "add_rights",
    restricted : true,
    description:"Permet d'ajouter le droit d'utilisation d'une commande à un utilisateur",
    patterns : [
        "ajoute( )(le(s))( )(droit(s))( )(de/d')( )(utiliser/utilisation)( )(du/de)( )(le/la)( )(plugin/commande/fonction) {command} a/pour {user}",
        "autorise( )([monsieur]) {user} a/de/pour/sur( )(utiliser/utilisation)( )(la/le)( )(plugin/commande/fonction) {command}"
    ],
    synonyms :{
        monsieur: ["m","mme","monsieur","madame","professeur","prof"]
    },
    tests :[
        {
            input: "Autorise Charles Edmon à utiliser la commande add_plugin",
            result: {user:"charles edmon",command:"add_plugin"}
        }
    ],
    callback : function(reply,params){
        find_user(params.user,function(users){
            if(users.length === 0){
                reply("Je n'ai pas pu trouvé d'utilisateurs répondant au nom de "+params.user)
            }else if(users.length === 1){
                let user = users[0];
                add_binding_right(user.id,params.command);
                reply("J'ai ajouté les droit d'utilisation de la commande "+params.command+" à "+user.profile.real_name)
            }else{
                let response = "Différents utilisateurs répondent au nom de "+params.user+":\n";
                for(let i in users){
                    response = response + " - " + users[i].profile.real_name + "\n";
                }
                reply(response);
            }
        });
    }
};

module.exports.has_rights = has_rights;
module.exports.init = init;
module.exports.add_binding_right = add_binding_right;
module.exports.bindings = [binding_add_rights];
module.exports.name = "rights";