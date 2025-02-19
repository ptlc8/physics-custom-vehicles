import { isValidVehiclePattern } from "../type-checks.js";
import Game from "../../common/game.js";
import WorldMap from "../../common/map.js";
import Gamemodes from "../../common/gamemodes.js";


// Recherche puis démarre une instance de match 1v1
export default {
	args: { vehiclePattern: isValidVehiclePattern},
	execute: function(connectionId, args) {
		let gamemode = Gamemodes.RUSH;
		if (this.waitingPlayersId.length >= gamemode.players-1) {
			let map = WorldMap.createMatchMap();
			let vehiclesPatterns = [];
			let opponents = [];
			let gameId = this.idIncrementer++;
			vehiclesPatterns.push(args.vehiclePattern);
			opponents.push(connectionId);
			this.players[connectionId].game = gameId;
			for (let i = 0; i < gamemode.players-1; i++) {
				let playerId = this.waitingPlayersId.shift();
				let player = this.players[playerId];
				vehiclesPatterns.push(player.vehiclePattern);
				opponents.push(playerId);
				player.game = gameId;
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
			let player = this.players[connectionId];
			player.vehiclePattern = args.vehiclePattern;
			this.waitingPlayersId.push(connectionId);
			console.log("[pcv] Joueur ("+connectionId+") en recherche de match");
			return {
				command: "wait",
				vehiclePattern: args.vehiclePattern
			};
		}
	}
};
