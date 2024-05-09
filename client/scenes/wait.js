import Scene from "../scene.js";
import { renderVehicleEditor } from "../render.js";


class WaitScene extends Scene {
    render(remote, wCtx, vCtx, renderRatio, mousePos) {
        // TODO: renderVehicleEditor(wCtx, vehiclePattern);
        vCtx.drawImage("quit", 120, 0, 20, 20);
        let loadDots = new Array(3).fill(" ");
        loadDots[parseInt(Date.now() / 400) % loadDots.length] = ".";
        loadDots = loadDots.join("");
        vCtx.drawText("Recherche d'adversaires en cours" + loadDots, 0, 60, 20, "white", 0, "black", "center");
    }
    onMouseDown(remote, event) {
        // Clic gauche
        if (event.button == 0) {
            // Bouton quitter la queue
            if (Math.sqrt(Math.pow(120 - event.viewportX, 2) + Math.pow(event.viewportY, 2)) < 10) {
                remote.leaveQueue();
                return;
            }
        }
    }
    onMouseUp(remote, event) {

    }
    onKeyDown(remote, event) {

    }
    onKeyUp(remote, event) {

    }
}


export default WaitScene;