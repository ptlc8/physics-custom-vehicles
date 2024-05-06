const Express = require('express');
const WebSocket = require('ws');
const Compression = require('compression');
const PcvServer = require('./pcvServer');
const Http = require('http');


const port = process.env.PORT || 13029;

// Création du serveur Express
const app = Express();
app.use(Compression());

// Distribution des scripts et des fichiers statiques
app.get('/scripts/*', (req, res, next) => {
	console.info(`[http] ${req.socket.remoteAddress}\t${req.url}`);
	res.sendFile(__dirname + '/scripts/' + req.params[0], err => err && next());
});
app.get('/*', (req, res, next) => {
	console.info(`[http] ${req.socket.remoteAddress}\t${req.url}`);
	res.sendFile(__dirname + '/static/' + req.params[0], err => err && next());
});

// Création du serveur HTTP
const server = Http.createServer(app);

// Création du serveur WS
var wss = new WebSocket.Server({ server });

// Liste des websockets par identifiant
var clients = {};
var kId = 0;

// Création du serveur pcv
pcvs = new PcvServer();
pcvs.send = function(connectionId, object) {
	if (clients[connectionId])
		clients[connectionId].send(JSON.stringify(object));
}
pcvs.broadcast = function(object) {
	for (let client of Object.values(clients))
		client.send(JSON.stringify(object));
}
console.info(`[pcv] Version du jeu : ${pcvs.version}`);

// Lorsque quelqu'un se connecte
function onConnection(ws) {
	var connectionId = kId++;
	console.log(`[wss] Nouvelle connexion (${connectionId})`);
	clients[connectionId] = ws;
	pcvs.connect(connectionId);
	ws.on('message', function(message) {
		try {
			args = JSON.parse(message);
		} catch (e) {
			ws.send('{"error":"Malformed JSON"}');
			return;
		}
		if (!args || pcvs.commands[args.command] == undefined) {
			ws.send('{"error":"Unknow command"}');
			return;
		}
		for (let arg of pcvs.commands[args.command].args) {
			if (args[arg] === undefined) {
				ws.send(`{"error":"Need more args","need":"${arg}"}`);
				return;
			}
		}
		let response = pcvs.commands[args.command].execute.call(pcvs, connectionId, args);
		if (response) ws.send(JSON.stringify(response));
	});
	ws.on('close', function() {
		console.log(`[wss] Déconnexion (${connectionId})`);
		pcvs.disconnect(connectionId);
		delete clients[connectionId];
	});
}
wss.on('connection', onConnection);
wss.on('listening', () => console.log('[wss] En écoute'));


server.listen(port, () => console.log(`[http] Lancé sur le port ${port}`));
