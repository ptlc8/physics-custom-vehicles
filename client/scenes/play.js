import Scene from "../scene.js";
import { renderGame, renderGameControls } from "../render.js";
import Box2D from "box2d.js";


const controlKeys = [{ code: "KeyE", display: "E" }, { code: "KeyR", display: "R" }, { code: "KeyT", display: "T" }, { code: "KeyY", display: "Y" }, { code: "KeyU", display: "U" }, { code: "KeyI", display: "I" }, { code: "KeyS", display: "S" }, { code: "KeyD", display: "D" }, { code: "KeyF", display: "F" }, { code: "KeyG", display: "G" }, { code: "KeyH", display: "H" }, { code: "KeyJ", display: "J" }, { code: "KeyK", display: "K" }, { code: "KeyL", display: "L" }];

class PlayScene extends Scene {
    render(remote, wCtx, vCtx, renderRatio, mousePos) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.selfPlayer.id);
        renderGameControls(vCtx, remote.game, remote.selfPlayer.id, controlKeys)
    }
    onMouseDown(remote, event) {
        // Clic gauche
        if (remote.game != undefined && event.button == 0) {
            if (65 < event.viewportY && event.viewportY < 95) { // controls bar
                let playerIndex = remote.game.getPlayerIndex(remote.selfPlayer.id);
                let controlIndex = Math.floor((event.viewportX + remote.game.world.vehicles[playerIndex].controls.length * 20) / 40);
                if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[playerIndex].controls.length) {
                    if (remote.game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
                        remote.disactivate(controlIndex);
                    else
                        remote.activate(controlIndex);
                }
                return;
            }
        }
        // Clic droit
        if (event.button == 2 && remote.game != undefined) {
            remote.game.world.explode(new Box2D.b2Vec2(event.worldX, event.worldY), 10, 16);
        }
    }
    onMouseUp(remote, event) {

    }
    onKeyDown(remote, event) {
        if (remote.game != undefined) {
            let controlIndex = undefined;
            for (let i = 0; i < controlKeys.length; i++)
                if (controlKeys[i].code == event.code) controlIndex = i;
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
    }
    onKeyUp(remote, event) {

    }
}


export default PlayScene;