

module.exports.init = init;	// private. Users can't use it
module.exports.send_message = send_message; // send_message(message, channel)
module.exports.get_user_info = get_user_info; // get_user_info(user_id, callback)
module.exports.web_send_message = web_send_message;
module.exports.get_im_list = get_im_list;
module.exports.get_user_group = get_user_group;
module.exports.log = log;

var is_inited = false;

var web = null;
var rtm = null;
var messages = [];

var Method = {
  RTM: 1,
  WEB: 2
};

function init(p_web, p_rtm){
	if(!is_inited){
		web = p_web;
		rtm = p_rtm;
		is_inited = true;
	}
}


var message_sending_timeout = null;

function start_sending_messages(){
    if(!message_sending_timeout)
        message_sending_timeout = setInterval(send_message_request,100);
}

start_sending_messages();

function send_message_request(){
	if(messages.length >= 1){
		let request = messages.shift();
        if(request.method == Method.RTM){
            rtm.sendMessage(request.message, request.channel, (error,m) => {
                if(error){
                    console.log("Error in send_message rtm:");
                    console.log(error);
                    clearInterval(message_sending_timeout);
                    message_sending_timeout = null;
                    messages.unshift(request);
                    setTimeout(start_sending_messages,1000);
                }
    		});
        }
        if(request.method == Method.WEB){
            web.chat.postMessage(request.channel, request.message, (err, res) => {
                if (err) {
                    console.log("Error in send_message web:");
                    console.log(err);
                    clearInterval(message_sending_timeout);
                    message_sending_timeout = null;
                    messages.unshift(request);
                    setTimeout(start_sending_messages,1000);
                }
            });
        }
	}
}

function send_message(message, channel){
	if(message && channel){
		messages.push({message:message, channel:channel, method:Method.RTM});
	}
}


function get_user_list(callback){
	web.users.list(function (err, res) {
		callback(err, res);
	});
}

var users_infos = {};

function get_user_info(user_id,callback){
	if(users_infos[user_id]){
		callback(null, users_infos[user_id]);
	} else{
		web.users.info(user_id, function(err,res){
	        if(err){
	            console.log("Error in get_user_info:");
	            console.log(err);
				callback(err, res);
	        }else{
				users_infos[user_id] = res.user;
				setTimeout(delete_user_info, 15 * 60 * 1000, user_id);
	            callback(err, res.user);
	        }
	    });
	}
}

function delete_user_info(user_id){
	delete users_infos[user_id];
}

function web_send_message(message,channel){
    if(message && channel){
		messages.push({message:message, channel:channel, method:Method.WEB});
	}
}

function get_im_list(callback){
	web.im.list(function (err, res) {
	    if(err){
	        console.log("Error in im.list:");
	        console.log(err);
			callback(err, res);
	    }
	    callback(err, res);
	});
}

var users_group = {
    U81NYS49F: ["si5", "al"],
    U81P5T8PQ: ["si5", "al"]
};

function get_user_group(user){
    return users_group[user];
}

function log(){
    // var m = ["test1", "test2", "test3"];
    // console.log("index of "+m.indexOf("test4"));
}
