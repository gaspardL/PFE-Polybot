const path = require("path");
const fs = require("fs");
const rmdir = require('rimraf');
const request = require('request');
const git = require('simple-git/promise');

var plugin_list;
var binding_list;
var plugins_folder;
var bot_token;
var load_plugin_file;

function init(p_list, b_list, token, lp_function){
	plugin_list = p_list;
	binding_list = b_list;
	plugins_folder = path.join(path.dirname(module.parent.filename), "plugins");
	bot_token = token;
	load_plugin_file = lp_function;
}

var binding_addplugin_dnd = {
	name : "ajout plugin dragndrop",
	restricted: true,
	description : "Permet d'ajouter un plugin en uploadant directement un fichier sur slack. Commande à écrire dans le commentaire du fichier",
	patterns : [
		"([ajouter])( )(le)( )(l')[plugin]",
	],
	synonyms :{
		ajouter: ["ajoute", "ajouter", "add"],
		plugin: ["plugin", "extension"]
	},
	tests :[
		{
			input: "ajoute plugin",
			result: {}
		}
	],
	callback : ajout_plugin_dnd
};

var binding_addplugin_git = {
	name : "ajout plugin lien git",
	description : "Permet d'ajouter des plugins en fournissant un lien de repository git",
	restricted: true,
	patterns : [
		"([ajouter])( )(le)( )(l')[plugin] {giturl}",
	],
	synonyms :{
		ajouter: ["ajoute", "ajouter", "add"],
		plugin: ["plugin", "extension"]
	},
	tests :[
		{
			input: "ajoute plugin https://giturl.git",
			result: {giturl: "https://giturl.git"}
		}
	],
	callback : ajout_plugin_git
};

var binding_deleteplugin = {
	name : "suppression plugin",
	description : "Permet de supprimer des plugins du serveur",
	restricted: true,
	patterns : [
		"([supprimer])( )(le)( )(l')[plugin] {name}",
	],
	synonyms :{
		supprimer: ["supprime", "supprimer", "delete", "remove"],
		plugin: ["plugin", "extension"]
	},
	tests :[
		{
			input: "supprime le plugin ping",
			result: {name: "ping"}
		}
	],
	callback : delete_plugin
};

function ajout_plugin_dnd(reply,params, message){
	if(message.subtype !== "file_share"){
		reply("Veuillez uploader les sources de votre plugin et écrire cette commande en commentaire");
		return;
	}

	// Création du dossier qui va contenir le fichier
	var pluginFolder = "dndplugin"+ new Date().getTime();
	fs.mkdir(path.join(plugins_folder, pluginFolder), (err) => {
		if(err){
			console.log(err);
			reply("Erreur pendant la création du dossier du plugin: "+err);
			return;
		}

		// Téléchargement du fichier et renommage de celui ci en index.js dans le nouveau dossier créé
		download(message.file.url_private_download, path.join(plugins_folder, pluginFolder, "index.js"), (err) => {
			if (err) {
				console.error(err);
				delete_plugin_folder(pluginFolder);
				reply("Erreur pendant le chargement du plugin: "+err);
				return;
			}

			let errors = load_plugin_file(pluginFolder);
			if(!errors){
				reply("Nouveau plugin ajouté sur polybot");
			} else {
				delete_plugin_folder(pluginFolder);
				let response = "Problème lors de l'ajout du plugin:\n";
				for(let i in errors){
					response = response + " - " + errors[i] + "\n";
				}
				reply(response);
			}
		});
	});
}

function download(url, dest, cb) {
	// on créé un stream d'écriture qui nous permettra
	// d'écrire au fur et à mesure que les données sont téléchargées
	const file = fs.createWriteStream(dest);

	// on lance le téléchargement
	const sendReq = request.get(url, {
		'auth': {
			'bearer': bot_token
		}
	});

	// on vérifie la validité du code de réponse HTTP
	sendReq.on('response', (response) => {
		if (response.statusCode !== 200) {
			return cb('Response status was ' + response.statusCode);
		}
	});

	// au cas où request rencontre une erreur
	// on efface le fichier partiellement écrit
	// puis on passe l'erreur au callback
	sendReq.on('error', (err) => {
		fs.unlink(dest);
		cb(err.message);
	});

	// écrit directement le fichier téléchargé
	sendReq.pipe(file);

	// lorsque le téléchargement est terminé
	// on appelle le callback
	file.on('finish', () => {
		// close étant asynchrone,
		// le cb est appelé lorsque close a terminé
		file.close(cb);
	});

	// si on rencontre une erreur lors de l'écriture du fichier
	// on efface le fichier puis on passe l'erreur au callback
	file.on('error', (err) => {
		// on efface le fichier sans attendre son effacement
		// on ne vérifie pas non plus les erreur pour l'effacement
		fs.unlink(dest);
		cb(err.message);
	});
}

function ajout_plugin_git(reply, params){
	var url = params.giturl.slice(1, -1);
	var pluginFolder = "gplugin"+ new Date().getTime();
	git().clone(url, path.join(plugins_folder, pluginFolder))
	.then(() => {
		let errors = load_plugin_file(pluginFolder);
		if(!errors){
			reply("Nouveau plugin ajouté sur polybot");
		} else {
			delete_plugin_folder(pluginFolder);
			let response = "Problème lors de l'ajout du plugin:\n";
			for(let i in errors){
				response = response + " - " + errors[i] + "\n";
			}
			reply(response);
		}
	})
	.catch((err) => reply("Impossible d'ajouter le plugin. Problème lors du clonage du repository."));
}

function delete_plugin_folder(dirname){
	rmdir(path.join(plugins_folder, dirname), function(erreur){
		if(erreur) {
			console.log(erreur);
		}
	});
}

function delete_plugin(reply, params){
	if(!plugin_list[params.name]){
		reply("Nom du plugin introuvable");
		return;
	}
	delete_plugin_folder(plugin_list[params.name].dirname);
	for(let b in plugin_list[params.name].bindings){
		delete binding_list[plugin_list[params.name].bindings[b]];
	}
	delete plugin_list[params.name];
	console.log("Plugin \""+params.name+"\" removed");
	reply("Plugin "+params.name+" correctement supprimé");
}


module.exports.bindings = [binding_addplugin_dnd, binding_addplugin_git, binding_deleteplugin];
module.exports.name = "plugin manager";
module.exports.init = init;
