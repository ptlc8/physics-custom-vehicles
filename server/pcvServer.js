import Game from "../common/game.js";
import Player from "../common/player.js";
import WorldMap from "../common/map.js";
import Gamemodes from "../common/gamemodes.js";

function PcvServer() {
	// Prochain id à utiliser
	this.idIncrementer = 0;
	// Liste des joueurs connectés par identifiant de connexion
	this.players = {};
	// Liste des instances de jeu en cours par identifiant d'instance
	this.games = {};
	// Liste des joueurs en recherche avec identifiants
	this.waitingPlayers = [];
}

// Version du serveur
PcvServer.prototype.version = "0.1.0";


// Lorsqu'un joueur se connecte
PcvServer.prototype.connect = function(connectionId) {
	
}

// Lorsqu'un joueur se déconnecte
PcvServer.prototype.disconnect = function(connectionId) {
	this.waitingPlayers.splice(this.waitingPlayers.find(e=>e.id==connectionId), 1);
	if (this.players[connectionId])
		delete this.players[connectionId];
}

// abstract // Envoi au joueur sous forme d'objet
PcvServer.prototype.send = function(connectionId, object) {}

// abstract // Envoi à tous les joueurs sous forme d'objet
PcvServer.prototype.broadcast = function(object) {}

// Envoi à tous les participants d'un match
PcvServer.prototype.broadcastGame = function(gameId, object) {
	let game = this.games[gameId];
	if (game === undefined) return;
	for (let connectionId of game.opponents)
		this.send(connectionId, object);
	for (let connectionId of game.spectators)
		this.send(connectionId, object);
}

PcvServer.prototype.commands = {};

// Commande ping : renvoie le temps du serveur
PcvServer.prototype.commands.ping = {
	args:[],
	execute: function(connectionId, args) {
		return {
			time:Date.now()
		};
	}
};

// Commande setname : renvoie l'inventaire du joueur
PcvServer.prototype.commands.setname = {
	args:["name"],
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
PcvServer.prototype.commands.getinventory = {
	args:[],
	execute: function(connectionId, args) {
		return {
			inventory:this.players[connectionId].inventory
		};
	}
};

// Commande getvehicles : renvoie les véhicules du joueur
PcvServer.prototype.commands.getvehicles = {
	args:[],
	execute: function(connectionId, args) {
		return {
			vehicles:this.players[connectionId].vehicles
		};
	}
};

// Commande startsolo : démarre une instance de jeu solo
PcvServer.prototype.commands.startsolo = {
	args:["vehiclePattern"],
	execute: function(connectionId, args) {
		if (!isValidVehiclePattern(args.vehiclePattern))
			return {error:"Invalid pattern"};
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
PcvServer.prototype.commands.activate = {
	args:["index"],
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		if (typeof args.index != "number" || args.index < 0)
			return {error:"Invalid index"};
		var event = this.games[gameId].activate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};

// Commande disactivate : uniquement en jeu, désactive un controle du véhicule
PcvServer.prototype.commands.disactivate = {
	args:["index"],
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		if (typeof args.index != "number" || args.index < 0)
			return {error:"Invalid index"};
		var event = this.games[gameId].disactivate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};

// Commande disactivate : uniquement en jeu, désactive un controle du véhicule
PcvServer.prototype.commands.spectate = {
	args:["playerId"],
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
PcvServer.prototype.commands.startmatch = {
	args: ["vehiclePattern"],
	execute: function(connectionId, args) {
		let gamemode = Gamemodes.RUSH;
		if (!isValidVehiclePattern(args.vehiclePattern))
			return {error:"Invalid pattern"};
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

PcvServer.prototype.commands.leavequeue = {
	args: [],
	execute: function(connectionId, args) {
		this.waitingPlayers.splice(this.waitingPlayers.find(e=>e.id==connectionId), 1);
		return {
			command: "leavequeue"
		};
	}
};

function isValidVehiclePattern(pattern, width=7, height=5) {
	if (pattern.length > height) return false;
	let havePlayer = false;
	for (let line of pattern) {
		if (line.length > width) return false;
		for (let part of line) {
			if (part == undefined) continue;
			if (typeof part !== "object")
				return false;
			if (part.id=="player" || (part.param && part.param.id == "player"))
				havePlayer = true;
		}
	}
	return havePlayer;
}

export default PcvServer; 
