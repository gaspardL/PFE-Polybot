"use strict";

var binding_rights = {};

var web = null;

function init(webapi){
    web = webapi;
    load_info();
}

function load_info(){

}

function save_info(){

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

module.exports.has_rights = has_rights;
module.exports.init = init;
module.exports.add_binding_right = add_binding_right;
