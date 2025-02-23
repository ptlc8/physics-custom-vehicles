import Engine from "./engine/engine.js";
import { default as Remote, State } from "./remote.js";
import LoadScene from "./scenes/load.js";
import BuildScene from "./scenes/build.js";
import WaitScene from "./scenes/wait.js";
import PlayScene from "./scenes/play.js";
import SpectateScene from "./scenes/spectate.js";
import { renderMap, renderBackground, renderCursor } from "./render.js";


var scenes = {
	[State.LOAD]: new LoadScene(),
	[State.BUILD]: new BuildScene(),
	[State.WAIT]: new WaitScene(),
	[State.PLAY]: new PlayScene(),
	[State.SPECTATE]: new SpectateScene()
};

var inputsMapping = [
	["ArrowLeft", "-$cursorMoveX"],
	["ArrowRight", "+$cursorMoveX"],
	["Gamepad0Axe0", "$cursorMoveX"],
	["ArrowUp", "-$cursorMoveY"],
	["ArrowDown", "+$cursorMoveY"],
	["Gamepad0Axe1", "$cursorMoveY"],
	["MouseButton0", "use"],
	["Space", "use"],
	["Gamepad0Button0", "use"],
	["MouseButton2", "special"],
	["KeyC", "special"],
	["Gamepad0Button3", "special"],
	["Escape", "back"],
	["Gamepad0Button1", "back"],
	["KeyE", "control0"],
	["KeyR", "control1"],
	["KeyT", "control2"],
	["KeyY", "control3"],
	["KeyU", "control4"],
	["KeyI", "control5"],
	["KeyO", "control6"],
	["KeyP", "control7"],
	["ShiftLeft", "debug"]
]

const canvas = document.getElementById("aff");
var engine = new Engine(canvas, 1920, 1080, update, render, inputsMapping, 30);
engine.setMouseCursor("none");
var protocol = location.protocol == "https:" ? "wss:" : "ws:";
var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
var remote = new Remote(protocol + "//" + location.host + path);
engine.run();


/**
 * @param {Object<string, { value: number, clicked: boolean, unclicked: boolean }>} inputs
 * @param {{ x: number, y: number }} cursor
 * @param {number} tps
 */
function update(inputs, cursor, tps) {
	scenes[remote.state].onInputs(remote, inputs, cursor);
}

/**
 * @param {RenderContext} worldContext
 * @param {RenderContext} viewportContext
 * @param {number} renderRatio
 * @param {{ x: number, y: number }} cursor
 */
function render(worldContext, viewportContext, renderRatio, cursor) {
	worldContext.clear();
	renderBackground(worldContext);
	if (remote.game)
		renderMap(worldContext, remote.game.map);
	scenes[remote.state].render(remote, worldContext, viewportContext, renderRatio, cursor);
	renderCursor(viewportContext, cursor);
}