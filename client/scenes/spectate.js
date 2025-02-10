import Scene from "../scene.js";


class SpectateScene extends Scene {
    render(wctx, rctx, rendererRatio) {

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