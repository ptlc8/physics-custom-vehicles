import Box2D from "box2d.js";
import AmbiEngine from "./ambiengine.js";
import { default as Remote, State } from "./remote.js";
import Renderer from "./renderer.js";
import VehiclePart from "../common/physics/part.js";


const ControlKeys = [{ code: "KeyE", display: "E" }, { code: "KeyR", display: "R" }, { code: "KeyT", display: "T" }, { code: "KeyY", display: "Y" }, { code: "KeyU", display: "U" }, { code: "KeyI", display: "I" }, { code: "KeyS", display: "S" }, { code: "KeyD", display: "D" }, { code: "KeyF", display: "F" }, { code: "KeyG", display: "G" }, { code: "KeyH", display: "H" }, { code: "KeyJ", display: "J" }, { code: "KeyK", display: "K" }, { code: "KeyL", display: "L" }];
var engine;
var renderer;
var remote;
var mousePos = {sx:0, sy:0, rx:0, ry:0, wx:0, wy:0};
const u = undefined; // tmp :)
var vehiclePattern = [[u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u]];
var placingItem = undefined;


engine = AmbiEngine.create(document.getElementById("aff"), 1920, 1080, init, update, render, 30, { keyup: onKeyUp, keydown: onKeyDown, mousedown: onMouseDown, mouseup: onMouseUp, mousemove: onMouseMove, touchstart: onMouseDown, touchend: onMouseUp, touchmove: onMouseMove });
init();
engine.run()


function init() {
	engine.setCameraSize(10);
	engine.setCameraPos(0, -1);
	var protocol = location.protocol == "https:" ? "wss:" : "ws:";
	var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
	remote = new Remote(protocol + "//" + location.host + path);
	renderer = new Renderer(engine, remote);
}


function update() {

}

function render() {
	renderer.render();
}


function onMouseDown(e) {
	// Clic gauche en construction
	if (remote.state == State.BUILD && e.button == 0) {
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
			remote.spectate(parseInt(prompt("Quel est l'identifiant du joueur à regarder ?")));
			return;
		}
		// Barre d'inventaire
		let inventory = Object.entries(remote.selfPlayer.inventory).map(e => ({ id: e[0], amount: e[1].amount }));
		let inventoryIndex = Math.floor(2.5 - e.ry / 40) * 9 + Math.floor((e.rx + 20 * Math.min(9, inventory.length)) / 40);
		if (0 <= inventoryIndex && inventoryIndex < inventory.length && placingItem == undefined && inventory[inventoryIndex].amount > 0) {
			placingItem = VehiclePart.createById(inventory[inventoryIndex].id);
			remote.selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
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
	if (remote.state == State.BUILD && e.button == 2) {
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
	if (remote.state == State.WAIT && e.button == 0) {
		// Bouton quitter la queue
		if (Math.sqrt(Math.pow(120-e.rx, 2)+Math.pow(e.ry, 2)) < 10) {
			remote.leaveQueue();
			return;
		}
	}
	if (remote.state == State.PLAY && remote.game != undefined && e.button == 0) {
		if (65 < e.ry && e.ry < 95) { // controls bar
			let playerIndex = remote.game.getPlayerIndex(remote.selfPlayer.id);
			let controlIndex = Math.floor((e.rx + remote.game.world.vehicles[playerIndex].controls.length * 20) / 40);
			if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[playerIndex].controls.length) {
				if (remote.game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
					remote.disactivate(controlIndex);
				else
					remote.activate(controlIndex);
			}
			return;
		}
	}
	if (remote.state == State.PLAY && e.button == 2 && remote.game != undefined) {
		remote.game.world.explode(new Box2D.b2Vec2(e.wx, e.wy), 10, 16);
	}
}

function onMouseUp(e) {
	if (remote.state == State.BUILD && e.button == 0) {
		let vehicleIndex = Math.floor(e.wy / 1.2 + vehiclePattern.length); // vehicle editor
		if (0 <= vehicleIndex && vehicleIndex < vehiclePattern.length) {
			let vehicleJndex = Math.floor((e.wx + (.6 * vehiclePattern[0].length) - .6) / 1.2 + .5);
			if (0 <= vehicleJndex && vehicleJndex < vehiclePattern[0].length) {
				if (vehiclePattern[vehicleIndex][vehicleJndex] != undefined && vehiclePattern[vehicleIndex][vehicleJndex].contain && placingItem != undefined && placingItem.containable) {
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
						remote.selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
					vehiclePattern[vehicleIndex][vehicleJndex].contained = placingItem;
					placingItem = undefined;
					return;
				}
				if (vehiclePattern[vehicleIndex][vehicleJndex] != undefined) {
					remote.selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].id);
					if (vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
						remote.selfPlayer.addToInventory(vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
				}
				vehiclePattern[vehicleIndex][vehicleJndex] = placingItem;
				placingItem = undefined;
				return;
			}
		}
		if (placingItem) {
			remote.selfPlayer.addToInventory(placingItem.id, 1);
			if (placingItem.contained != undefined)
				remote.selfPlayer.addToInventory(placingItem.contained.id, 1);
			placingItem = undefined;
		}
	}
}
function onMouseMove(e) {
	mousePos = { sx: e.sx, sy: e.sy, rx: e.rx, ry: e.ry, wx: e.wx, wy: e.wy };
}
function onKeyUp() {
	
}
function onKeyDown(e) {
	if (remote.state == State.PLAY && remote.game != undefined) {
		let controlIndex = undefined;
		for (let i = 0; i < ControlKeys.length; i++)
			if (ControlKeys[i].code == e.code) controlIndex = i;
		if (controlIndex == undefined) return;
		let playerIndex = remote.game.getPlayerIndex(remote.selfPlayer.id);
		if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[playerIndex].controls.length) {
			if (remote.game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
				remote.disactivate(controlIndex);
			else
				remote.activate(controlIndex);
		}
		return;
	}
	if (remote.state == State.SPECTATE) {
		if (e.code == "ArrowLeft") {
			remote.spectatePrevious();
		} else if (e.code == "ArrowRight") {
			remote.spectateNext();
		}
	}
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
