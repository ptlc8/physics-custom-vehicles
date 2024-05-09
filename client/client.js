import Engine from "./engine";
import { default as Remote, State } from "./remote.js";
import BuildScene from "./scenes/build.js";
import WaitScene from "./scenes/wait.js";
import PlayScene from "./scenes/play.js";
import SpectateScene from "./scenes/spectate.js";
import { renderMap, renderBackground } from "./render.js";


var mousePos = {};
var scenes = {
	[State.BUILD]: new BuildScene(),
	[State.WAIT]: new WaitScene(),
	[State.PLAY]: new PlayScene(),
	[State.SPECTATE]: new SpectateScene()
};

var engine = new Engine(document.getElementById("aff"), 1920, 1080, update, render, 30, { keyup: onKeyUp, keydown: onKeyDown, mousedown: onMouseDown, mouseup: onMouseUp, mousemove: onMouseMove, touchstart: onMouseDown, touchend: onMouseUp, touchmove: onMouseMove });
var protocol = location.protocol == "https:" ? "wss:" : "ws:";
var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
var remote = new Remote(protocol + "//" + location.host + path);
engine.run();


function update() {

}

/**
 * @param {RenderContext} worldContext 
 * @param {RenderContext} viewportContext 
 * @param {number} renderRatio 
 */
function render(worldContext, viewportContext, renderRatio) {
	worldContext.clear();
	renderBackground(worldContext);
	if (remote.game)
		renderMap(worldContext, remote.game.map);
	scenes[remote.state].render(remote, worldContext, viewportContext, renderRatio, mousePos);
}


function onMouseDown(event) {
	scenes[remote.state].onMouseDown(remote, event);
}
function onMouseUp(event) {
	scenes[remote.state].onMouseUp(remote, event);
}
function onMouseMove(event) {
	mousePos = event;
}
function onKeyUp(event) {
	scenes[remote.state].onKeyUp(remote, event);
}
function onKeyDown(event) {
	scenes[remote.state].onKeyDown(remote, event);
}