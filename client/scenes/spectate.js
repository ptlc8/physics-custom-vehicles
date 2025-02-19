import Scene from "../engine/scene.js";
import Button from "../engine/button.js";
import { renderGame } from "../render.js";


class SpectateScene extends Scene {

    constructor() {
        super();
        this.homeButton = new Button("home", -160, -85, 20);
        this.previousButton = new Button("previous", -160, 85, 20);
        this.nextButton = new Button("next", 160, 85, 20);
    }

    render(remote, wCtx, vCtx, renderRatio, cursor) {
        wCtx.camera.setSize(20);
        renderGame(wCtx, remote.game, remote.spectatedPlayerId);
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
}


export default SpectateScene;