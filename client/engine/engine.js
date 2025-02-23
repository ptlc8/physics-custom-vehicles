import RenderContext from "./rendercontext.js";
import Camera from "./camera.js";
import Cursor from "./cursor.js";
import InputsManager from "./inputs.js";
import { getAudio } from "./sounds.js";


/**
 * Gère les boucles de jeu et de rendu, les contextes de rendu et les événements
 * @version v0.3
 * @author Ambi
 */
class Engine {

    /**
     * @param {HTMLCanvasElement} cvs canvas element
     * @param {number} w width of the canvas
     * @param {number} h height of the canvas
     * @param {function(Array<[value: number, clicked: boolean, unclicked: boolean]>, { x: number, y: number }, number):void} update update function, called every tick
     * @param {function(RenderContext, RenderContext, number, { x: number, y: number }):void} render render function, called every frame
     * @param {Array<[string, string]>} inputsMapping mapping of keys to inputs
     * @param {number} tps expected ticks per second
     */
    constructor(cvs, w, h, update, render, inputsMapping, tps = 30) {
        this.cvs = cvs;
        cvs.width = w;
        cvs.height = h;
        this.ctx = cvs.getContext("2d");
        cvs.addEventListener("contextmenu", e => e.preventDefault());
        // contexts
        this.worldContext = new RenderContext(this.ctx, new Camera(0, -1, 10));
        this.viewportContext = new RenderContext(this.ctx, new Camera(0, 0, 200));
        // loops
        this.update = update;
        this.render = render;
        this.tps = tps;
        this.running = false;
        this.updateIntervalId = 0;
        // events
        this.cursor = new Cursor(w, h);
        this.inputs = new InputsManager(inputsMapping, cvs);
        cvs.addEventListener("mousemove", e => {
            let x = e.offsetX * cvs.width / cvs.clientWidth;
            let y = e.offsetY * cvs.height / cvs.clientHeight;
            this.cursor.setPos(x, y, this.ctx, this.worldContext, this.viewportContext);
            cvs.focus();
        });
        cvs.addEventListener("touchmove", e => {
            let x = (e.changedTouches[0].clientX - cvs.getBoundingClientRect().left) * cvs.width / cvs.clientWidth
            let y = (e.changedTouches[0].clientY - cvs.getBoundingClientRect().top) * cvs.height / cvs.clientHeight;
            this.cursor.setPos(x, y, this.ctx, this.worldContext, this.viewportContext);
            cvs.focus();
        });
    }

    /**
     * Lance la boucle de jeu et de rendu
     */
    run() {
        this.running = true;
        var lastTick = Date.now();
        this.updateIntervalId = setInterval(() => {
            for (; lastTick + this.tps < Date.now(); lastTick += this.tps) {
                const inputs = this.inputs.getInputs();
                if (inputs["$cursorMoveX"])
                    this.cursor.addPos(inputs["$cursorMoveX"].value, 0, this.ctx, this.worldContext, this.viewportContext);
                if (inputs["$cursorMoveY"])
                    this.cursor.addPos(0, inputs["$cursorMoveY"].value, this.ctx, this.worldContext, this.viewportContext);
                this.update(inputs, this.cursor, this.tps);
            }
            //update(-lastTick + (lastTick = Date.now()));
        }, 1000 / this.tps);
        var requestRender = () => {
            requestAnimationFrame(() => {
                if (this.ctx.resetTransform) this.ctx.resetTransform();
                this.render(this.worldContext, this.viewportContext, this.cvs.width / this.cvs.height, this.cursor);
                if (this.running) requestRender(requestRender);
            });
        }
        requestRender();
    }

    /**
     * Met en pause la boucle de jeu et de rendu
     */
    pause() {
        this.running = false;
        clearInterval(this.updateIntervalId);
    }

    /**
     * Change le curseur de la souris sur le canvas
     * @param {string} cssCursor 
     */
    setMouseCursor(cssCursor) {
        this.cvs.style.cursor = cssCursor;
    }

    /**
     * Joue un son
     * @param {string} name
     */
    playSound(name) {
        let audio = getAudio(name);
        if (audio) {
            audio.currentTime = 0;
            audio.play();
        }
    }

    /**
     * Arrête un son
     * @param {string} name
     */
    stopSound(name) {
        let audio = getAudio(name);
        if (audio) audio.pause();
    }

}


export default Engine;