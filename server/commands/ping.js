// Renvoie le temps du serveur
export default {
	args: {},
	execute: function(connectionId, args) {
		return {
			time: Date.now()
		};
	}
};
