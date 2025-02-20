import { isNumber } from "../type-checks.js";


// Uniquement en jeu, désactive un controle du véhicule
export default {
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
