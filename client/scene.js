import Remote from "./remote.js";


class Scene {

    /**
     * Render the scene
     * @abstract
     * @param {WorldContext} wctx
     * @param {RenderContext} rctx
     * @param {number} rendererRatio
     */
    render(wctx, rctx, rendererRatio) {}

    /**
     * Quand un bouton souris est appuyé
     * @abstract
     * @param {Remote} remote
     * @param {MouseEvent} event
     */
    onMouseDown(remote, event) {}

    /**
     * Quand un bouton souris est relâché
     * @abstract
     * @param {Remote} remote
     * @param {MouseEvent} event
     */
    onMouseUp(remote, event) {}

    /**
     * Quand une touche clavier est appuyée
     * @abstract
     * @param {Remote} remote
     * @param {KeyboardEvent} event
     */
    onKeyDown(remote, event) {}

    /**
     * Quand une touche clavier est relâchée
     * @abstract
     * @param {Remote} remote
     * @param {KeyboardEvent} event
     */
    onKeyUp(remote, event) {}
}


export default Scene;