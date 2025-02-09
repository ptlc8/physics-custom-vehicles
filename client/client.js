const ControlKeys = [{code:"KeyE",display:"E"},{code:"KeyR",display:"R"},{code:"KeyT",display:"T"},{code:"KeyY",display:"Y"},{code:"KeyU",display:"U"},{code:"KeyI",display:"I"},{code:"KeyS",display:"S"},{code:"KeyD",display:"D"},{code:"KeyF",display:"F"},{code:"KeyG",display:"G"},{code:"KeyH",display:"H"},{code:"KeyJ",display:"J"},{code:"KeyK",display:"K"},{code:"KeyL",display:"L"}];
var engine;
var server;
var world;
const State = Object.assign({}, ...Object.entries(["BUILD","WAIT","PLAY","SPECTATE"]).map(([a,b])=>({[b]:a})));
var state = State.BUILD;
var mousePos = {sx:0, sy:0, rx:0, ry:0, wx:0, wy:0};
const u = undefined; // tmp :)
var vehiclePattern = [[u,u,u,u,u,u,u],[u,u,u,u,u,u,u],[u,u,u,u,u,u,u],[u,u,u,u,u,u,u],[u,u,u,u,u,u,u]];
var placingItem = undefined;
var selfPlayer = undefined;
var game = undefined;
var spectatedPlayerId = undefined;

import Box2D from "box2d.js";
import AmbiEngine from "./ambiengine.js";
import Player from "../common/player.js";
import Game from "../common/game.js";
import Items from "../common/physics/items.js";
import WorldMap from "../common/map.js";
import Gamemodes from "../common/gamemodes.js";

engine = AmbiEngine.create(document.getElementById("aff"), 1920, 1080, init, update, render, 30, {keyup:onKeyUp, keydown:onKeyDown, mousedown:onMouseDown, mouseup:onMouseUp, mousemove:onMouseMove, touchstart:onMouseDown, touchend:onMouseUp, touchmove:onMouseMove});
init();
engine.run()

function Server(url, events={}) {
	this.ws = new WebSocket(url);
	this.ws.onopen = (e) => {
		if (events.open)
			events.open(this);
	};
	this.ws.onmessage = (e) => {
		let args = JSON.parse(e.data);
		if (args.command && events.message)
			events.message(this, args.command, args);
		if (!args.command && args.error && events.messageerror)
			events.messageerror(this, args.error, args);
	};
	this.ws.onclose = (e) => {
		if (events.close)
			events.close(this);
	};
	this.ws.onerror = (e) => {
		if (events.error)
			events.error(this, e);
	};
}
Server.prototype.send = function(command, args={}) {
	args.command = command;
	this.ws.send(JSON.stringify(args));
}

function init() {
	engine.setCameraSize(10);
	engine.setCameraPos(0, -1);
	var protocol = location.protocol == "https:" ? "wss:" : "ws:";
	var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
	server = new Server(protocol + "//" + location.host + path, {
		open: onServerOpen,
		message: onServerCommand,
		close: onServerClose,
		messageerror: onServerError
	});
}

function onServerOpen(server) {
	console.log("[ws] Connecté");
	server.send("setname", {name:"myself"});
}

function onServerClose(server) {
	console.log("[ws] Déconnecté");
	
}

var commands = {};

function onServerCommand(server, command, args) {
	console.group("[ws] Serveur : "+command);
	console.info(args);
	console.groupEnd();
	if (!commands[command])
		return console.error("[ws] Unknow command : "+command);
	commands[command](args);
}

function onServerError(server, error, args) {
	console.group("[ws] Erreur : "+error);
	console.warn(args);
	console.groupEnd();
}

// Lorsque le joueur est enregistré
commands.logged = function(args) { // self, selfId
	selfPlayer = Player.cast(args.self);
	selfPlayer.id = args.selfId;
}

// Lorsqu'une instance de jeu démarre
commands.start = function(args) { // map, vehiclesPatterns, opponents, gamemode
	var map = WorldMap.cast(args.map);
	game = new Game(map, Gamemodes.getByName(args.gamemode), args.vehiclesPatterns, args.opponents);
	engine.setCameraSize(20);
	state = State.PLAY;
	game.start();
}

// Lorsque l'on devient spectateur d'un jeu
commands.spectate = function(args) { // map, vehiclesPatterns, opponents, events, tick
	var map = WorldMap.cast(args.map);
	game = new Game(map, Gamemodes.getByName(args.gamemode), args.vehiclesPatterns, args.opponents);
	game.events = args.events;
	game.world.tick = args.tick;
	engine.setCameraSize(20);
	state = State.SPECTATE;
	game.start();
	game.regenerate();
}

// Lorqu'un évent se produit lors d'un match, ex : activate, disactivate
commands.gameevent = function(args) { // event
	game.insertEvent(args.event.index, args.event.tick, args.event)
}

commands.wait = function (args) {
	state = State.WAIT;
}

commands.leavequeue = function(args) {
	state = State.BUILD;
}

function update() {
	
}

function render(wctx, rctx, rendererRatio) {
	wctx.clear();
	wctx.setZ(-2);
	wctx.drawRectInfiniteX("#6ab9e2", -2176, 242);
	wctx.drawImageInfiniteX(getImage("sky"), 0, -128, 128, 72);
	wctx.drawRectInfiniteX("#b4d5f4", -56, 2048);
	wctx.setZ(0);
	// Affichage du sol
	if (game && game.map) wctx.drawLines("green", game.map.groundVertices.map(e=>e[0]), game.map.groundVertices.map(e=>e[1]), .1);
	// En jeu
	if ((state == State.PLAY || state == State.SPECTATE) && game!==undefined) {
		// Centrage de la caméra sur le véhicule du joueur
		let playerIdToFollow = state==State.PLAY ? selfPlayer.id : state==State.SPECTATE ? spectatedPlayerId : undefined;
		let opponentIndexToFollow = game.getPlayerIndex(playerIdToFollow);
		if (game.world.vehicles[opponentIndexToFollow] !== undefined) {
			let toFollow = game.world.vehicles[opponentIndexToFollow].pos;
			engine.setCameraPos(toFollow?toFollow.get_x():0, toFollow?toFollow.get_y():0);
		}
		// Affichage des arrivées
		for (let finish of game.map.finishes) {
			wctx.drawImage(getImage("finish"), finish[0]-1, finish[1]-2, 2, 4);
		}
		for (const [index,vehicle] of Object.entries(game.world.vehicles)) {
			// Véhicules
			for (let line of vehicle.parts) for (let part of line) {
				if (part == undefined) continue;
				wctx.drawImage(getImage(part.id+(part.color!=undefined?part.color:"")), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), 1, 1, part.body.GetAngle());
				if (part.contained)
					wctx.drawImage(getImage(part.contained.id), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), .9, .9, part.body.GetAngle());
				if (part.id == "player" || (part.contained && part.contained.id == "player"))
					wctx.drawText("Joueur "+game.opponents[index], part.body.GetPosition().get_x(), part.body.GetPosition().get_y()-1, .5, "white", 0, "black", "center");
			}
			if (index==opponentIndexToFollow) {
				// Affichage des contrôles du véhicule du joueur
				for (let i = 0; i < vehicle.controls.length; i++) {
					rctx.drawRect("#A0A0A0", i*40-(20*vehicle.controls.length)+20+2, 80+2, 30, 30);
					rctx.drawRect("#C0C0C0", i*40-(20*vehicle.controls.length)+20, 80, 30, 30);
					rctx.drawImage(getImage(vehicle.controls[i].id+vehicle.controls[i].color), i*40-(20*vehicle.controls.length)+20, 80, 20, 20, vehicle.controls[i].rotation*Math.PI/2);
					rctx.drawText(vehicle.controls[i].parts[0].activated?"ON":"OFF", i*40-(20*vehicle.controls.length)+8, 86, 12, "white", 0, "black");
					if (i<ControlKeys.length) rctx.drawText(ControlKeys[i].display, i*40-(20*vehicle.controls.length)+34, 70, 12, "white", 0, "black", "right");
				}
			}
		}
	}
	// Éditeur de véhicule
	if (state == State.BUILD || state == State.WAIT) {
		for (let i = 0; i < vehiclePattern.length; i++)
			for (let j = 0; j < vehiclePattern[i].length; j++) {
				wctx.drawRect("#D0D0D0", j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1);
				if (vehiclePattern[i][j]) {
					let angle = 0;
					if (vehiclePattern[i][j].rotation) angle = (vehiclePattern[i][j].rotation||0)*Math.PI/2;
					else if (vehiclePattern[i][j].rotate4attachable) angle = (vehiclePattern[i][j].rotationattachable||0)*Math.PI/2;
					wctx.drawImage(getImage(vehiclePattern[i][j].id+(vehiclePattern[i][j].colorable?vehiclePattern[i][j].color:"")), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1, angle);
					if (vehiclePattern[i][j].contained!=undefined)
						wctx.drawImage(getImage(vehiclePattern[i][j].contained.id+(vehiclePattern[i][j].contained.colorable?vehiclePattern[i][j].contained.color:"")), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, .9, .9, angle);
					if (vehiclePattern[i][j].rotate4attachable) {
						wctx.drawImage(getImage("rotation-arrow"), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1, ((vehiclePattern[i][j].rotationattachable||0)-1)*Math.PI/2);
					}
				}
			}
	}
	// En contruction de véhicule
	if (state == State.BUILD) {
		// Barre d'inventaire
		if (selfPlayer && selfPlayer.inventory) {
			let inventory = Object.entries(selfPlayer.inventory).map(e=>({id:e[0],amount:e[1].amount}));
			for (let i = 0; i < inventory.length; i++) {
				let x = i%9*40-20*Math.min(9, inventory.length);
				let y = 80-40*Math.floor(i/9);
				rctx.drawRect("#A0A0A0", x+22, y+2, 30, 30);
				rctx.drawRect("#C0C0C0", x+20, y, 30, 30);
				rctx.drawImage(getImage(inventory[i].id), x+20, y, 20, 20)
				rctx.drawText(inventory[i].amount, x+8, y+6, 12, "white", 0, "black");
			}
		}
		// Objet en placement
		if (placingItem) {
			rctx.drawImage(getImage(placingItem.id), mousePos.rx, mousePos.ry, 20, 20);
			if (placingItem.contained) rctx.drawImage(getImage(placingItem.contained.id), mousePos.rx, mousePos.ry, 18, 18);
		}
		// Boutons start
		rctx.drawImage(getImage("solo"), 120, 0, 20, 20);
		rctx.drawImage(getImage("duo"), 120, -30, 20, 20);
		rctx.drawImage(getImage("spectate"), -120, -30, 20, 20);
	}
	// En attente d'un match
	if (state == State.WAIT) {
		rctx.drawImage(getImage("quit"), 120, 0, 20, 20);
		let loadDot = Array(3).fill(" ");
		loadDot[parseInt(Date.now()/1000)%3] = ".";
		loadDot = loadDot.join("");
		rctx.drawText("Recherche d'adversaires en cours"+loadDot, 0, 60, 20, "white", 0, "black", "center");
	}
}
function onMouseDown(e) {
	// Clic gauche en construction
	if (state == State.BUILD && e.button == 0) {
		// Bouton start
		if (Math.sqrt(Math.pow(120-e.rx, 2)+Math.pow(e.ry, 2)) < 10) {
			server.send("startsolo", {vehiclePattern: reducePattern(vehiclePattern)});
			return;
		}
		// Bouton duo
		if (Math.sqrt(Math.pow(e.rx-120, 2)+Math.pow(e.ry+30, 2)) < 10) {
			server.send("startmatch", {vehiclePattern: reducePattern(vehiclePattern)});
			return;
		}
		// Bouton spectate
		if (Math.sqrt(Math.pow(e.rx+120, 2)+Math.pow(e.ry+30, 2)) < 10) {
			spectate(parseInt(prompt("Quel est l'identifiant du joueur à regarder ?")));
			return;
		}
		// Barre d'inventaire
		let inventory = Object.entries(selfPlayer.inventory).map(e=>({id:e[0],amount:e[1].amount}));
		let inventoryIndex = Math.floor(2.5-e.ry/40)*9+Math.floor((e.rx+20*Math.min(9, inventory.length))/40);
		if (0 <= inventoryIndex && inventoryIndex < inventory.length && placingItem==undefined && inventory[inventoryIndex].amount>0) {
			placingItem = clone(Items.getItem(inventory[inventoryIndex].id));
			selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
			return;
		}
		// Édition du véhicule 
		let vehicleIndex = Math.floor(e.wy/1.2+vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx+(.6*vehiclePattern[0].length)-.6)/1.2+.5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length && placingItem==undefined && vehiclePattern[vehicleIndex][vehicleJndex]!=undefined) {
				placingItem = vehiclePattern[vehicleIndex][vehicleJndex].contained||vehiclePattern[vehicleIndex][vehicleJndex];
				if (vehiclePattern[vehicleIndex][vehicleJndex].contained) vehiclePattern[vehicleIndex][vehicleJndex].contained = undefined;
				else vehiclePattern[vehicleIndex][vehicleJndex] = undefined;
				return;
			}
		}
	}
	// Clic droit en construction
	if (state == State.BUILD && e.button == 2) {
		let vehicleIndex = Math.floor(e.wy/1.2+vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx+(.6*vehiclePattern[0].length)-.6)/1.2+.5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length/* && placingItem==undefined*/) {
				if (vehiclePattern[vehicleIndex][vehicleJndex] == undefined) return;
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate4attachable) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable = ((vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable||0)+1)%4;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate4) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((vehiclePattern[vehicleIndex][vehicleJndex].rotation||0)+1)%4;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate8) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((vehiclePattern[vehicleIndex][vehicleJndex].rotation||0)+.5)%4;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex].colorable)
					vehiclePattern[vehicleIndex][vehicleJndex].color = ((vehiclePattern[vehicleIndex][vehicleJndex].color||0)+1)%vehiclePattern[vehicleIndex][vehicleJndex].colors;
				return;
			}
		}
	}
	// Clic gauche en recherche
	if (state == State.WAIT && e.button == 0) {
		// Bouton quitter la queue
		if (Math.sqrt(Math.pow(120-e.rx, 2)+Math.pow(e.ry, 2)) < 10) {
			server.send("leavequeue");
			return;
		}
	}
	if (state == State.PLAY && game!=undefined && e.button == 0) {
		if (65 < e.ry && e.ry < 95) { // controls bar
			let playerIndex = game.getPlayerIndex(selfPlayer.id);
			let controlIndex = Math.floor((e.rx+game.world.vehicles[playerIndex].controls.length*20)/40);
			if (0 <= controlIndex && controlIndex < game.world.vehicles[playerIndex].controls.length) {
				if (game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
					disactivate(controlIndex);
				else 
					activate(controlIndex);
			}
			return;
		}
	}
	if (state == State.PLAY && e.button == 2 && game != undefined) {
		game.world.explode(new Box2D.b2Vec2(e.wx, e.wy), 10, 16);
	}
}

function onMouseUp(e) {
	if (state == State.BUILD && e.button == 0) {
		let vehicleIndex = Math.floor(e.wy/1.2+vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx+(.6*vehiclePattern[0].length)-.6)/1.2+.5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length) {
				if (vehiclePattern[vehicleIndex][vehicleJndex]!=undefined && vehiclePattern[vehicleIndex][vehicleJndex].contain && placingItem!=undefined && placingItem.containable) {
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained!=undefined)
						selfPlayer.vaddToInventory(vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
					vehiclePattern[vehicleIndex][vehicleJndex].contained = placingItem;
					placingItem = undefined;
					return;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex]!=undefined) {
					selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].id);
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained!=undefined)
						selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
				}
				vehiclePattern[vehicleIndex][vehicleJndex] = placingItem;
				placingItem = undefined;
				return;
			}
		}
		if (placingItem) {
			selfPlayer.addToInventory(placingItem.id, 1);
			if (placingItem.contained!=undefined)
				selfPlayer.addToInventory(placingItem.contained.id, 1);
			placingItem = undefined;
		}
	}
}
function onMouseMove(e) {
	mousePos = {sx:e.sx, sy:e.sy, rx:e.rx, ry:e.ry, wx:e.wx, wy:e.wy};
}
function onKeyUp(e) {
	
}
function onKeyDown(e) {
	if (state == State.PLAY && game!=undefined) {
		let controlIndex = undefined;
		for (let i = 0; i < ControlKeys.length; i++)
			if (ControlKeys[i].code == e.code) controlIndex = i;
		if (controlIndex==undefined) return;
		let playerIndex = game.getPlayerIndex(selfPlayer.id);
		if (0 <= controlIndex && controlIndex < game.world.vehicles[playerIndex].controls.length) {
			if (game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
				disactivate(controlIndex);
			else 
				activate(controlIndex);
		}
		return;
	}
	if (state == State.SPECTATE) {
		if (e.code == "ArrowLeft") {
			spectatePrevious();
		} else if (e.code == "ArrowRight") {
			spectateNext();
		}
	}
}


function activate(index) {
	let tag = createTag();
	server.send("activate", {index:index, tag:tag});
	game.activate(selfPlayer.id, index, tag, true);
}

function disactivate(index) {
	let tag = createTag();
	server.send("disactivate", {index:index, tag:tag});
	game.disactivate(selfPlayer.id, index, tag, true);
}

function spectate(playerId) {
	server.send("spectate", {playerId:playerId});
	spectatedPlayerId = playerId;
}

function spectateNext() {
	if (spectatedPlayerId == game.opponents[game.opponents.length-1])
		spectatedPlayerId = game.opponents[0];
	else
		spectatedPlayerId = game.opponents[game.opponents.indexOf(spectatedPlayerId)+1];
}

function spectatePrevious() {
	if (spectatedPlayerId == game.opponents[0])
		spectatedPlayerId = game.opponents[game.opponents.length-1];
	else
		spectatedPlayerId = game.opponents[game.opponents.indexOf(spectatedPlayerId)-1];
}


function reducePattern(pattern) {
	var reducedPattern = [];
	for (let l of pattern) {
		let line = [];
		for (let p of l) {
			if (p) {
				let part = {};
				part.id = p.id;
				if (p.color) part.color = p.color;
				if (p.rotation) part.rotation = p.rotation;
				if (p.rotationattachable) part.rotationattachable = p.rotationattachable;
				if (p.contained) {
					part.contained = p.contained;
					if (p.contained.color) part.contained.color = p.contained.color;
				}
				line.push(part);
			} else
				line.push(undefined);
		}
		reducedPattern.push(line);
	}
	return reducedPattern;
}

var tId = 0;
function createTag() {
	return selfPlayer.id+"#"+(tId++);
}

function clone(obj) {
	if (obj === undefined) return undefined;
	return JSON.parse(JSON.stringify(obj));
}

function getImage(name) {
	return AmbiEngine.getImage("assets/"+name+".png");
}
