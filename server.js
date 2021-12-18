const Http = require('http');
const Static = require('node-static');
const WebSocket = require("ws");
const PcvServer = require("./pcvServer");


const ip = process.argv[2] || "localhost";
const port = 80;

// Création du serveur HTTP relié au dossier www
const file = new Static.Server('./www');
const httpServer = Http.createServer((req, res) => {
	console.info("[http] "+req.connection.remoteAddress+"\t"+req.url);
	req.addListener('end', () => file.serve(req, res)).resume();
});

// Création du serveur WS sur le port 13028
var wss = new WebSocket.Server({server:httpServer, port:13028});

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
console.info("[pcv] Version du jeu : "+pcvs.version);

// Lorsque quelqu'un se connecte
function onConnection(ws) {
	var connectionId = kId++;
	console.log('[wss] Nouvelle connexion ('+connectionId+')');
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
				ws.send('{"error":"Need more args","need":"'+arg+'"}');
				return;
			}
		}
		let response = pcvs.commands[args.command].execute.call(pcvs, connectionId, args);
		if (response) ws.send(JSON.stringify(response));
	});
	ws.on('close', function() {
		console.log('[wss] Déconnexion ('+connectionId+')');
		pcvs.disconnect(connectionId);
		delete clients[connectionId];
	});
}
wss.on('connection', onConnection);
wss.on('listening', () => console.log('[wss] En écoute'));

httpServer.listen(port, ip, () => console.log(`[http] Lancé sur http://${ip}:${port}`));
