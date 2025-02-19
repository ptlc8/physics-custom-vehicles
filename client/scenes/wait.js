import Scene from "../engine/scene.js";
import Button from "../engine/button.js";
import { renderVehicleEditor } from "../render.js";


class WaitScene extends Scene {

    constructor() {
        super();
        this.leaveButton = new Button("quit", 120, 0, 20);
    }
    
    render(remote, wCtx, vCtx, renderRatio, cursor) {
        renderVehicleEditor(wCtx, remote.selfPlayer.vehiclePattern);
        this.leaveButton.draw(vCtx);
        vCtx.drawImage("quit", 120, 0, 20, 20);
        let loadDots = new Array(3).fill(" ");
        loadDots[parseInt(Date.now() / 400) % loadDots.length] = ".";
        loadDots = loadDots.join("");
        vCtx.drawText("Recherche d'adversaires en cours" + loadDots, 0, 60, 20, "white", 0, "black", "center");
    }

    onClick(remote, input, cursor) {
        if (input == "use") {
            // Bouton quitter la queue
            if (this.leaveButton.isHover(cursor)) {
                remote.leaveQueue();
            }
        }
        if (input == "back") {
            remote.leaveQueue();
        }
    }
}


export default WaitScene;