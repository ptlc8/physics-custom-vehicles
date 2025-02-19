import Scene from "../engine/scene.js";
import { renderGame } from "../render.js";


class SpectateScene extends Scene {

    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.spectatedPlayerId);
        // Boutons
        vCtx.drawImage("home", 0, 80, 20, 20);
        if (remote.game.opponents.length > 1) {
            vCtx.drawImage("previous", -120, 80, 20, 20);
            vCtx.drawImage("next", 120, 80, 20, 20);
        }
    }
    
    onClick(remote, input, cursor) {
        // Précédent
        if (input == "special") {
            remote.spectatePrevious();
        }
        if (input == "use") {
            // Bouton home
            if (Math.sqrt(Math.pow(cursor.viewportX, 2) + Math.pow(cursor.viewportY - 80, 2)) < 10) {
                remote.leaveSpectate();
                return;
            }
            // Bouton précédent
            if (Math.sqrt(Math.pow(cursor.viewportX + 120, 2) + Math.pow(cursor.viewportY - 80, 2)) < 10) {
                remote.spectatePrevious();
                return;
            }
            // Suivant
            remote.spectateNext();
        }
    }
}


export default SpectateScene;