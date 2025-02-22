import Scene from "../engine/scene.js";
import Button from "../engine/button.js";
import { renderGame } from "../render.js";


class SpectateScene extends Scene {

    constructor() {
        super();
        this.homeButton = new Button("home", -160, -85, 20);
        this.previousButton = new Button("previous", -160, 85, 20);
        this.nextButton = new Button("next", 160, 85, 20);
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraSize = 20;
    }

    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(this.cameraSize);
        renderGame(wCtx, remote.game, remote.spectatedPlayerId, this.cameraX, this.cameraY);
        // Boutons
        this.homeButton.draw(vCtx);
        if (remote.game.opponents.length > 1) {
            this.previousButton.draw(vCtx);
            this.nextButton.draw(vCtx);
        }
    }
    
    onClick(remote, input, cursor) {
        // Précédent
        if (input == "special") {
            remote.spectatePrevious();
        }
        if (input == "use") {
            // Bouton home
            if (this.homeButton.isHover(cursor)) {
                remote.leaveGame();
                return;
            }
            // Bouton précédent
            if (this.previousButton.isHover(cursor)) {
                remote.spectatePrevious();
                return;
            }
            // Suivant
            remote.spectateNext();
        }
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


export default SpectateScene;