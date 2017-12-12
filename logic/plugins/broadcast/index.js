
var api = null;

function init(botapi){
	api = botapi;
}


var binding_broadcast_now = {
    name : "broadcast immédiat",
    description:"Envoie immédiatement un message à tous les utilisateurs",
    patterns : [
		"broadcast (ce/le)( )(message )\"{message}\"",
        "[envoyer] (a tous/tout)( )(le monde)(les etudiants)( )(ce/le)( )(message )\"{message}\""
    ],
    synonyms :{
        envoyer : ["broadcast", "envoyer","envoie", "transmet", "transmettre"]
    },
    tests :[
        {
            input: "Envoie le message \"Venez chercher vos relevés\"",
            result: {message:"venez chercher vos releves"}
        },
        {
            input: "Transmet à tout le monde ce message \"Venez chercher vos relevés\"",
            result: {message:"venez chercher vos releves"}
        },
		{
            input: "broadcast \"Venez chercher vos relevés\"",
            result: {message:"venez chercher vos releves"}
        }
    ],
    callback : function(reply,params, message){
		var originalMessage = message.text.substring(message.text.indexOf('"')+1, message.text.lastIndexOf('"'));
		if(originalMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") != params.message){
			originalMessage = params.message;
		}
        api.get_user_info(message.user, function(err1, res1){
            var auteur = res1.real_name;
            api.get_im_list(function(err, res){
    			for(let i in res.ims){
    				let channel = res.ims[i].id;
    				if(channel != message.channel){
        		        api.web_send_message("Message transmis par *"+auteur+"* :\n>"+originalMessage, channel);
    				}
    			}
                reply("Message transmis.");
    		});
        });

    }
};


var binding_broadcast_group_now = {
    name : "broadcast immédiat filtré en groupe",
    description:"Envoie immédiatement un message aux utilisateurs d'un groupe",
    patterns : [
		"broadcast {groupe}(ce/le)( )(message )\"{message}\"",
        "[envoyer] (a/aux)( )(tous/tout)( )(les)( )(etudiants)( ){groupe}( )(ce/le)( )(message )\"{message}\""
    ],
    synonyms :{
        envoyer : ["broadcast", "envoyer","envoie", "transmet", "transmettre"]
    },
    tests :[
        {
            input: "Envoie à tous les si5 le message \"Venez chercher vos relevés\"",
            result: {groupe:"si5", message:"venez chercher vos releves"}
        },
		{
            input: "broadcast al \"C'est l'heure du rendu\"",
            result: {groupe:"al", message:"c'est l'heure du rendu"}
        }
    ],
    callback : function(reply,params, message){
		var originalMessage = message.text.substring(message.text.indexOf('"')+1, message.text.lastIndexOf('"'));
		if(originalMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") != params.message){
			originalMessage = params.message;
		}
        api.get_user_info(message.user, function(err1, res1){
            var auteur = res1.real_name;
            api.get_im_list(function(err, res){
    			for(let i in res.ims){
    				let channel = res.ims[i].id;
    				if(channel != message.channel){
                        var groups = api.get_user_group(res.ims[i].user);
                        if(groups && groups.indexOf(params.groupe) != -1){
        		            api.web_send_message("Message transmis aux "+params.groupe+" par *"+auteur+"* :\n>"+originalMessage, channel);
                        }
    				}
    			}
                reply("Message transmis.");
    		});
        });

    }
};


module.exports.bindings = [binding_broadcast_now, binding_broadcast_group_now];
module.exports.name = "broadcast";
module.exports.init = init;
