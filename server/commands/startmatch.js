import { isValidVehiclePattern } from "../type-checks.js";
import Game from "../../common/game.js";
import WorldMap from "../../common/map.js";
import Gamemodes from "../../common/gamemodes.js";


// Recherche puis démarre une instance de match 1v1
export default {
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
