import Express from 'express';
import WebSocket from 'ws';
import Compression from 'compression';
import PcvServer from './pcvServer.js';
import Http from 'http';
import * as Vite from 'vite';


const port = process.env.PORT || 13029;
const isDevelopment = process.env.NODE_ENV === 'development';

// Création du serveur Express
const app = Express();
app.use(Compression());

if (isDevelopment) {
	console.log('[http] Mode développement');
	// Lancement du serveur Vite
	var viteServer = await Vite.createServer({
		server: {
			middlewareMode: true
		}
	});
	app.use(viteServer.middlewares);
} else {
	console.log('[http] Mode production');
	// Construction avec vite et distribution des fichiers
	await Vite.build();
	app.use(Express.static('dist'));
}

// Création du serveur HTTP
const server = Http.createServer(app);

// Création du serveur WS
var wss = new WebSocket.Server({ server });

// Liste des websockets par identifiant
var clients = {};
var kId = 0;

// Création du serveur pcv
const pcvs = new PcvServer();
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
		let args;
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
