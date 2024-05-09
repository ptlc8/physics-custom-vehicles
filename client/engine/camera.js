import RenderContext from "./rendercontext";

class Camera {

    /**
     * @param {number} x position x
     * @param {number} y position y
     * @param {number} s taille du plan de projection
     * @param {number} z distance entre la camera et le plan de projection
     */
    constructor(x = 0, y = 0, s = 100, z = 1) {
        this.x = x;
        this.y = y;
        this.s = s;
        this.z = z;
    }

    /**
     * Retourne la position de la camera
     * @returns {{ x: number, y: number }}
     */
    getPos() {
        return {
            x: this.x,
            y: this.y
        };
    }

    /**
     * Définit la position de la camera
     * @param {number} x 
     * @param {number} y 
     */
    setPos(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Retourne la taille du plan de projection
     * @returns {number}
     */
    getSize() {
        return this.s;
    }

    /**
     * Définit la taille du plan de projection
     * @param {number} s
     */
    setSize(s) {
        this.s = s;
    }

    /**
     * Retourne la distance entre la camera et le plan de projection
     * @returns {number}
     */s
    getDistance() {
        return this.z;
    }

    /**
     * Définit la distance entre la camera et le plan de projection
     * @param {number} z doit être > 0 
     */
    setDistance(z) {
        this.z = z;
    }

    /**
     * Convertit une position x du monde en position x sur le canvas
     * @param {number} x
     * @param {CanvasRenderingContext2D} ctx
     */
    worldToCamX(x, ctx) {
        return (x - this.x) / this.z * Math.min(ctx.canvas.width, ctx.canvas.height) / this.s + ctx.canvas.width / 2;
    }

    /**
     * Convertit une position y du monde en position y sur le canvas
     * @param {number} y
     * @param {CanvasRenderingContext2D} ctx
     */
    worldToCamY(y, ctx) {
        return (y / this.z - this.y) / this.z * Math.min(ctx.canvas.width, ctx.canvas.height) / this.s + ctx.canvas.height / 2;
    }

    /**
     * Convertit une taille du monde en taille sur le canvas
     * @param {number} s
     * @param {CanvasRenderingContext2D} ctx
     */
    worldToCamSize(s, ctx) {
        return s * Math.min(ctx.canvas.width, ctx.canvas.height) / this.s / this.z;
    }

    /**
     * Convertit une position x sur le canvas en position x du monde
     * @param {number} x
     * @param {CanvasRenderingContext2D} ctx
     */
    camToWorldX(x, ctx) {
        return (x - ctx.canvas.width / 2) * this.s * this.z / Math.min(ctx.canvas.width, ctx.canvas.height) + this.x;
    }

    /**
     * Convertit une position y sur le canvas en position y du monde
     * @param {number} y
     * @param {CanvasRenderingContext2D} ctx
     */
    camToWorldY(y, ctx) {
        return (y - ctx.canvas.height / 2) * this.s / this.z / Math.min(ctx.canvas.width, ctx.canvas.height) + this.y;
    }
}


export default Camera;