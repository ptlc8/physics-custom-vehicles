import Scene from "../scene.js";
import { renderGame } from "../render.js";


class SpectateScene extends Scene {
    render(remote, wCtx, vCtx, renderRatio, mousePos) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.spectatedPlayerId);
        // TODO: renderSpectateControls(vCtx, game)
    }
    onMouseDown(remote, event) {

    }
    onMouseUp(remote, event) {

    }
    onKeyDown(remote, event) {
        if (event.code == "ArrowLeft") {
            remote.spectatePrevious();
        } else if (event.code == "ArrowRight") {
            remote.spectateNext();
        }
    }
    onKeyUp(remote, event) {

    }
}


export default SpectateScene;