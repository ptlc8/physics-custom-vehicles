const ControlKeys = [{ code: "KeyE", display: "E" }, { code: "KeyR", display: "R" }, { code: "KeyT", display: "T" }, { code: "KeyY", display: "Y" }, { code: "KeyU", display: "U" }, { code: "KeyI", display: "I" }, { code: "KeyS", display: "S" }, { code: "KeyD", display: "D" }, { code: "KeyF", display: "F" }, { code: "KeyG", display: "G" }, { code: "KeyH", display: "H" }, { code: "KeyJ", display: "J" }, { code: "KeyK", display: "K" }, { code: "KeyL", display: "L" }];
var engine;
var renderer;
var remote;
var world;
var mousePos = {sx:0, sy:0, rx:0, ry:0, wx:0, wy:0};
const u = undefined; // tmp :)
var vehiclePattern = [[u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u]];
var placingItem = undefined;
var game = undefined;
var spectatedPlayerId = undefined;


//Box2D().then(function(b2) {
Box2D = Box2D();//b2;
renderer = new Renderer(remote);
engine = AmbiEngine.create(document.getElementById("aff"), 1920, 1080, init, update, renderer.render, 30, { keyup: onKeyUp, keydown: onKeyDown, mousedown: onMouseDown, mouseup: onMouseUp, mousemove: onMouseMove, touchstart: onMouseDown, touchend: onMouseUp, touchmove: onMouseMove });
init();
engine.run()
//});


function init() {
	engine.setCameraSize(10);
	engine.setCameraPos(0, -1);
	var protocol = location.protocol == "https:" ? "wss:" : "ws:";
	var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
	remote = new Remote(protocol + "//" + location.host + path);
}


function update() {

}

function render() {

}


function onMouseDown(e) {
	// Clic gauche en construction
	if (state == State.BUILD && e.button == 0) {
		// Bouton start
		if (Math.sqrt(Math.pow(120-e.rx, 2)+Math.pow(e.ry, 2)) < 10) {
			remote.startSolo(reducePattern(vehiclePattern));
			return;
		}
		// Bouton duo
		if (Math.sqrt(Math.pow(e.rx-120, 2)+Math.pow(e.ry+30, 2)) < 10) {
			remote.startMatch(reducePattern(vehiclePattern));
			return;
		}
		// Bouton spectate
		if (Math.sqrt(Math.pow(e.rx + 120, 2) + Math.pow(e.ry + 30, 2)) < 10) {
			spectate(parseInt(prompt("Quel est l'identifiant du joueur à regarder ?")));
			return;
		}
		// Barre d'inventaire
		let inventory = Object.entries(selfPlayer.inventory).map(e => ({ id: e[0], amount: e[1].amount }));
		let inventoryIndex = Math.floor(2.5 - e.ry / 40) * 9 + Math.floor((e.rx + 20 * Math.min(9, inventory.length)) / 40);
		if (0 <= inventoryIndex && inventoryIndex < inventory.length && placingItem == undefined && inventory[inventoryIndex].amount > 0) {
			placingItem = VehiclePart.createById(inventory[inventoryIndex].id);
			selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
			return;
		}
		// Édition du véhicule 
		let vehicleIndex = Math.floor(e.wy / 1.2 + vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx + (.6 * vehiclePattern[0].length) - .6) / 1.2 + .5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length && placingItem == undefined && vehiclePattern[vehicleIndex][vehicleJndex] != undefined) {
				placingItem = vehiclePattern[vehicleIndex][vehicleJndex].contained || vehiclePattern[vehicleIndex][vehicleJndex];
				if (vehiclePattern[vehicleIndex][vehicleJndex].contained) vehiclePattern[vehicleIndex][vehicleJndex].contained = undefined;
				else vehiclePattern[vehicleIndex][vehicleJndex] = undefined;
				return;
			}
		}
	}
	// Clic droit en construction
	if (state == State.BUILD && e.button == 2) {
		let vehicleIndex = Math.floor(e.wy / 1.2 + vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx + (.6 * vehiclePattern[0].length) - .6) / 1.2 + .5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length/* && placingItem==undefined*/) {
				if (vehiclePattern[vehicleIndex][vehicleJndex] == undefined) return;
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate4attachable) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable = ((vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable || 0) + 1) % 4;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate4) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((vehiclePattern[vehicleIndex][vehicleJndex].rotation || 0) + 1) % 4;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex].rotate8) {
					vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((vehiclePattern[vehicleIndex][vehicleJndex].rotation || 0) + .5) % 4;
				}
				if ("color" in vehiclePattern[vehicleIndex][vehicleJndex])
					vehiclePattern[vehicleIndex][vehicleJndex].color = ((vehiclePattern[vehicleIndex][vehicleJndex].color || 0) + 1) % vehiclePattern[vehicleIndex][vehicleJndex].colors;
				return;
			}
		}
	}
	// Clic gauche en recherche
	if (state == State.WAIT && e.button == 0) {
		// Bouton quitter la queue
		if (Math.sqrt(Math.pow(120-e.rx, 2)+Math.pow(e.ry, 2)) < 10) {
			remote.leaveQueue();
			return;
		}
	}
	if (state == State.PLAY && game != undefined && e.button == 0) {
		if (65 < e.ry && e.ry < 95) { // controls bar
			let playerIndex = game.getPlayerIndex(selfPlayer.id);
			let controlIndex = Math.floor((e.rx + game.world.vehicles[playerIndex].controls.length * 20) / 40);
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
		let vehicleIndex = Math.floor(e.wy / 1.2 + vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx + (.6 * vehiclePattern[0].length) - .6) / 1.2 + .5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length) {
				if (vehiclePattern[vehicleIndex][vehicleJndex] != undefined && vehiclePattern[vehicleIndex][vehicleJndex].contain && placingItem != undefined && placingItem.containable) {
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
						selfPlayer.vaddToInventory(vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
					vehiclePattern[vehicleIndex][vehicleJndex].contained = placingItem;
					placingItem = undefined;
					return;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex] != undefined) {
					selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].id);
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
						addToInventory(inventory, vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
				}
				vehiclePattern[vehicleIndex][vehicleJndex] = placingItem;
				placingItem = undefined;
				return;
			}
		}
		if (placingItem) {
			selfPlayer.addToInventory(placingItem.id, 1);
			if (placingItem.contained != undefined)
				selfPlayer.addToInventory(placingItem.contained.id, 1);
			placingItem = undefined;
		}
	}
}
function onMouseMove(e) {
	mousePos = { sx: e.sx, sy: e.sy, rx: e.rx, ry: e.ry, wx: e.wx, wy: e.wy };
}
function onKeyUp(e) {

}
function onKeyDown(e) {
	if (state == State.PLAY && game != undefined) {
		let controlIndex = undefined;
		for (let i = 0; i < ControlKeys.length; i++)
			if (ControlKeys[i].code == e.code) controlIndex = i;
		if (controlIndex == undefined) return;
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


function spectateNext() {
	if (spectatedPlayerId == game.opponents[game.opponents.length - 1])
		spectatedPlayerId = game.opponents[0];
	else
		spectatedPlayerId = game.opponents[game.opponents.indexOf(spectatedPlayerId) + 1];
}

function spectatePrevious() {
	if (spectatedPlayerId == game.opponents[0])
		spectatedPlayerId = game.opponents[game.opponents.length - 1];
	else
		spectatedPlayerId = game.opponents[game.opponents.indexOf(spectatedPlayerId) - 1];
}


function reducePattern(pattern) {
	var reducedPattern = [];
	for (let l of pattern) {
		let line = [];
		for (let p of l)
			line.push(p ? { id: p.id, param: p.getParam() } : undefined);
		reducedPattern.push(line);
	}
	return reducedPattern;
}


function clone(obj) {
	if (obj === undefined) return undefined;
	return JSON.parse(JSON.stringify(obj));
}

function getImage(name) {
	return AmbiEngine.getImage("assets/" + name + ".png");
}
