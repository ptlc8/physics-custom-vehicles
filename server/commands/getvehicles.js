// Renvoie les véhicules du joueur
export default {
	args: {},
	execute: function(connectionId, args) {
		return {
			vehicles: this.players[connectionId].vehicles
		};
	}
};
