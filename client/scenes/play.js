import Scene from "../engine/scene.js";
import Button from "../engine/button.js";
import { renderGame, renderGameControls } from "../render.js";
import Box2D from "box2d.js";


const controlKeys = [{ code: "KeyE", display: "E" }, { code: "KeyR", display: "R" }, { code: "KeyT", display: "T" }, { code: "KeyY", display: "Y" }, { code: "KeyU", display: "U" }, { code: "KeyI", display: "I" }, { code: "KeyS", display: "S" }, { code: "KeyD", display: "D" }, { code: "KeyF", display: "F" }, { code: "KeyG", display: "G" }, { code: "KeyH", display: "H" }, { code: "KeyJ", display: "J" }, { code: "KeyK", display: "K" }, { code: "KeyL", display: "L" }];

class PlayScene extends Scene {

    constructor() {
        super();
        this.leaveButton = new Button("home", -160, -85, 20);
        this.debug = false;
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraSize = 20;
    }
    
    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(this.cameraSize);
        renderGame(wCtx, remote.game, remote.selfPlayer.id, this.cameraX, this.cameraY, this.debug);
        renderGameControls(vCtx, remote.game, remote.selfPlayer.id, controlKeys);
        this.leaveButton.draw(vCtx);
    }

    onClick(remote, input, cursor) {
        if (input == "debug")
            this.debug = true;
        if (remote.game == undefined) return;
        if (input == "use") {
             // controls bar
            if (65 < cursor.viewportY && cursor.viewportY < 95) {
                let opponentIndex = remote.game.getOpponentIndex(remote.selfPlayer.id);
                let controlIndex = Math.floor((cursor.viewportX + remote.game.world.vehicles[opponentIndex].controls.length * 20) / 40);
                if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[opponentIndex].controls.length) {
                    if (remote.game.world.vehicles[opponentIndex].controls[controlIndex].parts[0].activated)
                        remote.disactivate(controlIndex);
                    else
                        remote.activate(controlIndex);
                }
                return;
            }
            if (this.leaveButton.isHover(cursor)) {
                remote.leaveGame();
            }
        }
        if (input == "special") {
            remote.game.world.explode(new Box2D.b2Vec2(cursor.worldX, cursor.worldY), 10, 16);
        }
        let opponentIndex = remote.game.getOpponentIndex(remote.selfPlayer.id);
        if (input.startsWith("control")) {
            let controlIndex = parseInt(input.substring(7));
            if (0 <= controlIndex && controlIndex < remote.game.world.vehicles[opponentIndex].controls.length) {
                if (remote.game.world.vehicles[opponentIndex].controls[controlIndex].parts[0].activated)
                    remote.disactivate(controlIndex);
                else
                    remote.activate(controlIndex);
            }
        }
    }

    onUnclick(remote, input, cursor) {
        if (input == "debug")
            this.debug = false;
    }

    onValue(remote, input, value) {
        if (!value)
            return;
        if (input == "cameraX")
            this.cameraX += value;
        if (input == "cameraY")
            this.cameraY += value;
        if (input == "cameraSize")
            this.cameraSize = Math.min(80, Math.max(4, Math.exp(Math.log(this.cameraSize) + value / 10)));
    }

}


export default PlayScene;