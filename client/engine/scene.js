import Remote from "../remote.js";
import Cursor from "./cursor.js";


class Scene {

    /**
     * Render the scene
     * @abstract
     * @param {Remote} remote
     * @param {RenderContext} wCtx
     * @param {RenderContext} vCtx
     * @param {number} renderRatio
     * @param {Cursor} cursor
     */
    render(remote, wCtx, vCtx, renderRatio, cursor) { }

    /**
     * Quand les entrées utilisateurs arrivent
     * @param {Remote} remote
     * @param {Object<string, { value: number, clicked: boolean, unclicked: boolean }>} inputs
     * @param {Cursor} cursor
     */
    onInputs(remote, inputs, cursor) {
        for (let input in inputs) {
            if (inputs[input].clicked) {
                this.onClick(remote, input, cursor);
                console.log("click", input);
            }
            if (inputs[input].unclicked) {
                this.onUnclick(remote, input, cursor);
                console.log("unclick", input);
            }
        }
    }

    /**
     * Quand un entrée est appuyée
     * @abstract
     * @param {Remote} remote
     * @param {string} input
     * @param {Cursor} cursor
     */
    onClick(remote, input, cursor) { }

    /**
     * Quand une entrée est relachée
     * @abstract
     * @param {Remote} remote
     * @param {string} input
     * @param {Cursor} cursor
     */
    onUnclick(remote, input, cursor) { }
}


export default Scene;