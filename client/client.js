import Box2D from "box2d.js";
import AmbiEngine from "./ambiengine.js";
import { default as Remote, State } from "./remote.js";
import Renderer from "./renderer.js";
import BuildScene from "./scenes/build.js";
import WaitScene from "./scenes/wait.js";
import PlayScene from "./scenes/play.js";
import SpectateScene from "./scenes/spectate.js";


var renderer;
var remote;
var mousePos = {sx:0, sy:0, rx:0, ry:0, wx:0, wy:0};
var scenes = {
	State.BUILD: new BuildScene(),
	State.WAIT: new WaitScene(),
	State.PLAY: new PlayScene(),
	State.SPECTATE: new SpectateScene()
};

var engine = AmbiEngine.create(document.getElementById("aff"), 1920, 1080, init, update, render, 30, { keyup: onKeyUp, keydown: onKeyDown, mousedown: onMouseDown, mouseup: onMouseUp, mousemove: onMouseMove, touchstart: onMouseDown, touchend: onMouseUp, touchmove: onMouseMove });
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


function onMouseDown(event) {
	scenes[remote.state].onMouseDown(remote, event);
}
function onMouseUp(event) {
	scenes[remote.state].onMouseUp(remote, event);
}
function onMouseMove(e) {
	mousePos = { sx: e.sx, sy: e.sy, rx: e.rx, ry: e.ry, wx: e.wx, wy: e.wy };
}
function onKeyUp(event) {
	scenes[remote.state].onKeyUp(remote, event);
}
function onKeyDown(event) {
	scenes[remote.state].onKeyDown(remote, event);
}