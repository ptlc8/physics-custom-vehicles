import { isPositiveInteger } from "./type-checks.js";


// Uniquement en jeu, désactive un controle du véhicule
export default {
	args: { index: isPositiveInteger },
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			return {error:"Not in game"};
		var event = this.games[gameId].disactivate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};
