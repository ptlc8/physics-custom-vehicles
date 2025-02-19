import Game from "../common/game.js";
import Player from "../common/player.js";
import WorldMap from "../common/map.js";
import Gamemodes from "../common/gamemodes.js";

import fs from "fs";
import path from "path";
import { createRequire } from 'node:module';
import { fileURLToPath } from 'url';


export default class PcvServer {

	constructor() {
		/** @type {number} Prochain id à utiliser */
		this.idIncrementer = 1;
		// Liste des joueurs connectés par identifiant de connexion
		this.players = {};
		// Liste des instances de jeu en cours par identifiant d'instance
		this.games = {};
		// Liste des joueurs en recherche avec identifiants
		this.waitingPlayersId = [];
	}

	/** @type {string} Version du serveur */
	static version = "0.2.0";

	/** @type {Object<string, { args: Object<string, function(any):boolean>, execute: function(this:PcvServer, number, Object<string, any>):string?}>} Commandes utilisables par un client */
	static commands = {};

	/**
	 * Lorsqu'un client se connecte
	 * @param {number} connectionId
	 */
	connect(connectionId) {
		
	}

	/**
	 * Lorsqu'un client envoie une commande
	 * @param {any} data
	 */
	receiveMessage(connectionId, data) {
		if (!data)
			throw "Malformed message";
		let command = PcvServer.commands[data.command];
		if (!command)
			throw "Unknow command";
		for (let arg in command.args) {
			if (data[arg] === undefined)
				throw "Need more arguments: " + arg;
			if (!command.args[arg](data[arg]))
				throw "Invalid arg: " + arg;
		}
		return command.execute.call(this, connectionId, data);
	}

	/**
	 * Lorsqu'un client se déconnecte
	 * @param {number} connectionId
	*/
	disconnect(connectionId) {
		this.cancelWait(connectionId);
		let player = this.players[connectionId];
		if (player.game) {
			let game = this.games[player.game];
			if (game.removeSpectator(connectionId)) {
				this.broadcastGame(player.game, {
					command: "removespectator",
					spectatorId: connectionId
				});
			}
		}
		if (player)
			delete this.players[connectionId];
	}

	/**
	 * Envoi au joueur sous forme d'objet
	 * @abstract
	 * @param {number} connectionId
	 * @param {Object} data
     */
	send(connectionId, data) { }

	/**
	 * Envoi à tous les joueurs sous forme d'objet
	 * @abstract
	 * @param {Object} data
	 */
    broadcast(data) { }

	/**
	 * Envoi à tous les participants d'un match
	 * @param {number} gameId
	 * @param {Object} data
	 */
    broadcastGame(gameId, data) {
		if (!data) return;
		let game = this.games[gameId];
		if (game === undefined) return;
		for (let connectionId of game.opponents)
			if (this.players[connectionId].game == gameId)
				this.send(connectionId, data);
		for (let connectionId of game.spectators)
			this.send(connectionId, data);
	}

	cancelWait(playerId) {
		let waitIndex = this.waitingPlayersId.indexOf(playerId);
		if (playerId >= 0)
			this.waitingPlayersId.splice(waitIndex, 1);
	}

}


const dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
fs.readdirSync(path.join(dirname, "commands"))
	.forEach(file => {
		PcvServer.commands[file.substring(0, file.lastIndexOf("."))] = require(path.join(dirname, 'commands', file)).default;
	});

console.info("[pcv] Commandes chargées: " + Object.keys(PcvServer.commands).join(", "))
