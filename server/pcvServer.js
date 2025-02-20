import Game from "../common/game.js";
import Player from "../common/player.js";
import WorldMap from "../common/map.js";
import Gamemodes from "../common/gamemodes.js";
import { isString, isNumber, isPositiveInteger, isValidVehiclePattern } from "./type-checks.js";


export default class PcvServer {

	constructor() {
		/** @type {number} Prochain id à utiliser */
		this.idIncrementer = 0;
		// Liste des joueurs connectés par identifiant de connexion
		this.players = {};
		// Liste des instances de jeu en cours par identifiant d'instance
		this.games = {};
		// Liste des joueurs en recherche avec identifiants
		this.waitingPlayers = [];
	}

	/** @type {string} Version du serveur */
	static version = "0.1.0";


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
	receiveMessage(data) {
		if (!data)
			return { error: "Malformed message" };
		let command = PcvServer.commands[args.command];
		if (!command)
			return { error: "Unknow command" };
		for (let arg in command.args) {
			if (data[arg] === undefined)
				return { error: "Need more arguments", arg: arg };
			if (!command.args[arg](data[arg]))
				return { error: "Invalid arg", arg: arg };
		}
		let response = command.execute.call(this, connectionId, data);
		if (response) ws.send(JSON.stringify(response));
	}

	/**
	 * Lorsqu'un client se déconnecte
	 * @param {number} connectionId
	*/
	disconnect(connectionId) {
		this.waitingPlayers.splice(this.waitingPlayers.find(e=>e.id==connectionId), 1);
		if (this.players[connectionId])
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
		let game = this.games[gameId];
		if (game === undefined) return;
		for (let connectionId of game.opponents)
			this.send(connectionId, data);
		for (let connectionId of game.spectators)
			this.send(connectionId, data);
	}

}


import fs from "fs";
import path from "path";
import { createRequire } from 'node:module';

PcvServer.commands = {};

const dirname = path.dirname(import.meta.url);
console.log("dirname: " + dirname);
const require = createRequire(import.meta.url);
fs.readdirSync(path.join(dirname, "commands"))
	.forEach(file => {
		PcvServer.commands[path.basename(file)] = require(path.join(dirname, 'commands', file));
	});


// Commande setname : renvoie l'inventaire du joueur
PcvServer.commands.setname = {
	args: { "name": isString },
	execute: function(connectionId, args) {
		if (args.name.length < 3)
			return {
				error: "name too short"
			};
		this.players[connectionId] = new Player(args.name);
		return {
			command: "logged",
			self: this.players[connectionId],
			selfId: connectionId
		};
	}
};

// Commande getinventory : renvoie l'inventaire du joueur
PcvServer.commands.getinventory = {
	args: {},
	execute: function(connectionId, args) {
		return {
			inventory:this.players[connectionId].inventory
		};
	}
};

// Commande getvehicles : renvoie les véhicules du joueur
PcvServer.commands.getvehicles = {
	args: {},
	execute: function(connectionId, args) {
		return {
			vehicles:this.players[connectionId].vehicles
		};
	}
};

// Commande startsolo : démarre une instance de jeu solo
PcvServer.commands.startsolo = {
	args: { vehiclePattern: isValidVehiclePattern },
	execute: function(connectionId, args) {
		let map = new WorldMap(WorldMap.createSinusoidalGround(), [[0,0]]);
		let vehiclesPatterns = [args.vehiclePattern];
		let opponents = [connectionId];
		let gameId = this.idIncrementer++;
		this.players[connectionId].game = gameId;
		this.games[gameId] = new Game(map, Gamemodes.SOLO, vehiclesPatterns, opponents);
		this.games[gameId].start();
		console.log("[pcv] Nouvelle partie solo");
		return {
			command: "start",
			map: map,
			gamemode: Gamemodes.SOLO.name,
			vehiclesPatterns: vehiclesPatterns,
			opponents: opponents
		};
	}
};

// Commande activate : uniquement en jeu, active un controle du véhicule
PcvServer.commands.activate = {
	args: { index: isPositiveInteger },
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		var event = this.games[gameId].activate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};

// Commande disactivate : uniquement en jeu, désactive un controle du véhicule
PcvServer.commands.disactivate = {
	args: { index: isPositiveInteger },
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		var event = this.games[gameId].disactivate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};

// Commande disactivate : uniquement en jeu, désactive un controle du véhicule
PcvServer.commands.spectate = {
	args: { playerId: isNumber },
	execute: function(connectionId, args) {
		if (this.players[connectionId].game !== undefined)
			return {error:"In game"};
		if (!this.players[args.playerId])
			return {error:"Invalid player"};
		let gameId = this.players[args.playerId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		this.players[connectionId].game = gameId;
		let game = this.games[gameId];
		game.spectators.push(connectionId);
		return {
			command: "spectate",
			map: game.map,
			gamemode: game.gamemode.name,
			vehiclesPatterns: game.vehiclesPatterns,
			opponents: game.opponents,
			events: game.events,
			tick: game.world.tick
		};
	}
};

// Commande startmatch : recherche puis démarre une instance de match 1v1
PcvServer.commands.startmatch = {
	args: { vehiclePattern: isValidVehiclePattern},
	execute: function(connectionId, args) {
		let gamemode = Gamemodes.RUSH;
		if (this.waitingPlayers.length >= gamemode.players-1) {
			let map = WorldMap.createMatchMap();
			let vehiclesPatterns = [];
			let opponents = [];
			let gameId = this.idIncrementer++;
			vehiclesPatterns.push(args.vehiclePattern);
			opponents.push(connectionId);
			this.players[connectionId].game = gameId;
			for (let i = 0; i < gamemode.players-1; i++) {
				let opponent = this.waitingPlayers.shift();
				vehiclesPatterns.push(opponent.vehiclePattern);
				opponents.push(opponent.id);
				this.players[opponent.id].game = gameId;
			}
			this.games[gameId] = new Game(map, gamemode, vehiclesPatterns, opponents);
			this.games[gameId].start();
			console.log("[pcv] Nouveau match ("+opponents.join(" vs ")+")");
			this.broadcastGame(gameId, {
				command: "start",
				map: map,
				gamemode: gamemode.name,
				vehiclesPatterns: vehiclesPatterns,
				opponents: opponents
			});
		} else {
			this.waitingPlayers.push({id:connectionId, vehiclePattern:args.vehiclePattern});
			console.log("[pcv] Joueur ("+connectionId+") en recherche de match");
			return {
				command: "wait"
			};
		}
	}
};

PcvServer.commands.leavequeue = {
	args: {},
	execute: function(connectionId, args) {
		this.waitingPlayers.splice(this.waitingPlayers.find(e=>e.id==connectionId), 1);
		return {
			command: "leavequeue"
		};
	}
};
