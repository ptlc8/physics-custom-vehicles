import Scene from "../engine/scene.js";
import { renderGame } from "../render.js";


class SpectateScene extends Scene {

    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.spectatedPlayerId);
        // TODO: renderSpectateControls(vCtx, game)
    }
    
    onClick(remote, input, cursor) {
        if (input == "use") {
            remote.spectateNext();
        } else if (input == "special") {
            remote.spectatePrevious();
        }
    }
}


export default SpectateScene;