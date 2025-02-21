import VehiclePart from "./part.js";
import { allParts, createPartById } from "./parts.js";


export default class VehiclePattern {

    constructor() {
        /** @type {(VehiclePart|null)[][]} */
        this.parts = new Array(5).fill([]).map(_ => new Array(7).fill(null));
    }

    /**
     * Retourne la hauteur du modèle
     * @returns {number}
     */
    getHeight() {
        return this.parts.length;
    }

    /**
     * Retourne la largeur du modèle
     * @returns {number}
     */
    getWidth() {
        return this.parts[0].length;
    }

    /**
     * Retourne une pièce du modèle
     * @param {number} x
     * @param {number} y
     * @returns {VehiclePart?}
     */
    get(x, y) {
        return this.parts[y][x];
    }

    /**
     * Place une pièce dans le modèle
     * @param {number} x
     * @param {number} y
     * @param {VehiclePart?} part
     * @returns {VehiclePart?} pièce précédente
     */
    set(x, y, part) {
        if (y < 0 || this.parts.length <= y || x < 0 || this.parts[y].length <= x)
            return part;
        if (!this.parts[y][x]) {
            this.parts[y][x] = part;
            return null;
        }
        if (this.parts[y][x].contain && part && part.containable) {
            let previousPart = this.parts[y][x].contained;
            this.parts[y][x].contained = part;
            return previousPart;
        }
        let previousPart = this.parts[y][x];
        this.parts[y][x] = part;
        return previousPart;
    }

    /**
     * Retire une pièce du modèle
     * @param {number} x
     * @param {number} y
     * @returns {VehiclePart?} la pièce retirée
     */
    delete(x, y) {
        if (y < 0 || this.parts.length <= y || x < 0 || this.parts[y].length <= x)
            return null;
        if (!this.parts[y][x])
            return null;
        if (this.parts[y][x].contained) {
            let part = this.parts[y][x].contained;
            this.parts[y][x].contained = null;
            return part;
        }
        let part = this.parts[y][x];
        this.parts[y][x] = null;
        return part;
    }

    /**
     * Tourne une pièce du modèle
     * @param {number} x
     * @param {number} y
     */
    rotate(x, y) {
        if (y < 0 || this.parts.length <= y || x < 0 || this.parts[y].length <= x)
            return;
        if (!this.parts[y][x])
            return;
        if (this.parts[y][x].rotate4)
            this.parts[y][x].rotation = ((this.parts[y][x].rotation || 0) + 1) % 4;
        if (this.parts[y][x].rotate8)
            this.parts[y][x].rotation = ((this.parts[y][x].rotation || 0) + .5) % 4;
        if (this.parts[y][x].colors)
            this.parts[y][x].color = ((this.parts[y][x].color || 0) + 1) % this.parts[y][x].colors;
    }

    /**
     * Teste si le modèle est valide
     * @param {number} width
     * @param {number} height
     * @returns {boolean}
     */
    isValid(width=7, height=5) {
        if (this.parts.length > height) return false;
        let havePlayer = false;
        for (let line of this.parts) {
            if (line.length > width) return false;
            for (let part of line) {
                if (!part) continue;
                if (part instanceof allParts["player"] || part.contained instanceof allParts["player"])
                    havePlayer = true;
            }
        }
        return havePlayer;
    }

    /**
     * Inverse le modèle horizontalement
     */
    flip() {
        for (let y = 0; y < this.parts.length; y++) {
            this.parts[y].reverse();
            // Rotation des pièces tournables
            for (let part of this.parts[y]) {
                if (!part)
                    continue;
                if (part.rotate8)
                    part.rotation = (8 - part.rotation) % 8;
                if (part.rotate4)
                    part.rotation = (4 - part.rotation) % 4;
            }
        }
    }

    /**
     * Simplifie le modèle pour le rendre serialisable en JSON
     * @returns {Object[][]}
     */
    serialize() {
        return this.parts.map(l => l.map(p => p ? { id: p.id, param: p.getParam() } : null));
    }

    static cast(obj) {
        if (!Array.isArray(obj) || !obj.every(l => Array.isArray(l)))
            throw "Invalid vehicle pattern";
        let pattern = new VehiclePattern();
        pattern.parts = obj.map(l => l.map(p => p ? createPartById(p.id, p.param) : null));
        return pattern;
    }

}
