import Scene from "../scene.js";


class WaitScene extends Scene {
    render(wctx, rctx, rendererRatio) {

    }
    onMouseDown(remote, event) {
        // Clic gauche
        if (event.button == 0) {
            // Bouton quitter la queue
            if (Math.sqrt(Math.pow(120 - event.rx, 2) + Math.pow(event.ry, 2)) < 10) {
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