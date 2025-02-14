import Scene from "../engine/scene.js";
import { renderGame, renderGameControls } from "../render.js";
import Box2D from "box2d.js";


const controlKeys = [{ code: "KeyE", display: "E" }, { code: "KeyR", display: "R" }, { code: "KeyT", display: "T" }, { code: "KeyY", display: "Y" }, { code: "KeyU", display: "U" }, { code: "KeyI", display: "I" }, { code: "KeyS", display: "S" }, { code: "KeyD", display: "D" }, { code: "KeyF", display: "F" }, { code: "KeyG", display: "G" }, { code: "KeyH", display: "H" }, { code: "KeyJ", display: "J" }, { code: "KeyK", display: "K" }, { code: "KeyL", display: "L" }];

class PlayScene extends Scene {
    
    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.selfPlayer.id);
        renderGameControls(vCtx, remote.game, remote.selfPlayer.id, controlKeys)
    }

    onClick(remote, input, cursor) {
        if (remote.game == undefined) return;
        if (input == "use") {
             // controls bar
            if (65 < cursor.viewportY && cursor.viewportY < 95) {
                let playerIndex = remote.game.getPlayerIndex(remote.selfPlayer.id);
                let controlIndex = Math.floor((cursor.viewportX + remote.game.world.vehicles[playerIndex].controls.length * 20) / 40);
                if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[playerIndex].controls.length) {
                    if (remote.game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
                        remote.disactivate(controlIndex);
                    else
                        remote.activate(controlIndex);
                }
                return;
            }
        }
        if (input == "special") {
            remote.game.world.explode(new Box2D.b2Vec2(cursor.worldX, cursor.worldY), 10, 16);
        }
        let playerIndex = remote.game.getPlayerIndex(remote.selfPlayer.id);
        if (input.startsWith("control")) {
            let controlIndex = parseInt(input.substring(7));
            if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[playerIndex].controls.length) {
                if (remote.game.world.vehicles[playerIndex].controls[controlIndex].parts[0].activated)
                    remote.disactivate(controlIndex);
                else
                    remote.activate(controlIndex);
            }
        }
    }
}


export default PlayScene;