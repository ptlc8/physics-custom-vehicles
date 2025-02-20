import { isValidVehiclePattern } from "../type-checks.js";
import Game from "../common/game.js";
import WorldMap from "../common/map.js";
import Gamemodes from "../common/gamemodes.js";


// Démarre une instance de jeu solo
export default {
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
