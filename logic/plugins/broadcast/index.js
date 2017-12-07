
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
            input: "broadcast \"Venez chercher vos relevés\"",
            result: {message:"venez chercher vos releves"}
        }
    ],
    callback : function(reply,params, message){
		var originalMessage = message.text.substring(message.text.indexOf('"')+1, message.text.lastIndexOf('"'));
		if(originalMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") != params.message){
			originalMessage = params.message;
		}
		api.send_message("test dm", "U81NYS49F");
    }
};


module.exports.bindings = [binding_broadcast_now];
module.exports.name = "broadcast";
module.exports.init = init;
