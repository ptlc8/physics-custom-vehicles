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
            if (inputs[input].clicked)
                this.onClick(remote, input, cursor);
            if (inputs[input].unclicked)
                this.onUnclick(remote, input, cursor);
            this.onValue(remote, input, inputs[input].value, cursor);
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

    /**
     * Quand une entrée a une valeur
     * @abstract
     * @param {Remote} remote
     * @param {string} input
     * @param {number} value
     * @param {Cursor} cursor
     */
    onValue(remote, input, value, cursor) { }

}


export default Scene;