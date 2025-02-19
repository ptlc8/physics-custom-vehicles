import Cursor from "./cursor";

export default class Button {

    /**
     * @param {string} image image name
     * @param {number} x position X
     * @param {number} y position Y
     * @param {number} d diameter
     */
    constructor(image, x, y, d) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.d = d;
    }

    /**
     * @param {RenderContext} vCtx viewport context
     */
    draw(vCtx) {
        vCtx.drawImage(this.image, this.x, this.y, this.d, this.d);
    }

    /**
     * Teste si le curseur est sur le bouton
     * @param {Cursor} cursor
     * @returns {boolean}
     */
    isHover(cursor) {
        return Math.sqrt(Math.pow(cursor.viewportX - this.x, 2) + Math.pow(cursor.viewportY - this.y, 2)) < this.d / 2;
    }

}