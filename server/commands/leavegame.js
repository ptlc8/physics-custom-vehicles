export default {
	args: [],
	execute: function(connectionId, args) {
		let player = this.players[connectionId];
		if (player.game === undefined)
			throw "Not in game";
		let game = this.games[player.game];
        if (game.removeSpectator(connectionId)) {
			this.broadcastGame(player.game, {
				command: "removespectator",
				spectatorId: connectionId
			});
		}
		player.game = undefined;
		return {
			command: "build"
		}
	}
};