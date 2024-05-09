import RenderContext from "./rendercontext.js";
import Camera from "./camera.js";


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
     * @param {function(number):void} update update function, called every tick
     * @param {function(RenderContext, RenderContext, number):void} render render function, called every frame
     * @param {number} tps expected ticks per second
     * @param {Object<string, function(Object):void>} listeners event listeners
     */
    constructor(cvs, w, h, update, render, tps = 30, listeners = {}) {
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
        for (let event of Object.keys(listeners)) {
            if (!["mousedown", "mouseup", "keyup", "keydown", "mousemove", "touchstart", "touchend", "touchcancel", "touchleave", "touchmove"].includes(event)) {
                console.error("[Engine] Unknown event : " + event);
                continue;
            }
            let eventType = event;
            if (event.startsWith("mouse")) // mouse events
                cvs.addEventListener(event, e => {
                    let canvasX = e.offsetX * cvs.width / cvs.clientWidth;
                    let canvasY = e.offsetY * cvs.height / cvs.clientHeight;
                    listeners[event]({
                        worldX: this.worldContext.camera.camToWorldX(canvasX, this.ctx),
                        worldY: this.worldContext.camera.camToWorldY(canvasY, this.ctx),
                        viewportX: this.viewportContext.camera.camToWorldX(canvasX, this.ctx),
                        viewportY: this.viewportContext.camera.camToWorldY(canvasY, this.ctx),
                        canvasX,
                        canvasY,
                        button: e.button,
                        buttons: e.buttons,
                        type: eventType
                    });
                    e.preventDefault();
                    cvs.focus();
                });
            else if (event.startsWith("touch")) // touch events
                cvs.addEventListener(event, e => {
                    let canvasX = (e.changedTouches[0].clientX - cvs.getBoundingClientRect().left) * cvs.width / cvs.clientWidth
                    let canvasY = (e.changedTouches[0].clientY - cvs.getBoundingClientRect().top) * cvs.height / cvs.clientHeight;
                    listeners[event]({
                        worldX: this.worldContext.camera.camToWorldX(canvasX, this.ctx),
                        worldY: this.worldContext.camera.camToWorldY(canvasY, this.ctx),
                        viewportX: this.viewportContext.camera.camToWorldX(canvasX, this.ctx),
                        viewportY: this.viewportContext.camera.camToWorldY(canvasY, this.ctx),
                        canvasX,
                        canvasY,
                        button: e.changedTouches[0].identifier,
                        type: eventType
                    });
                    e.preventDefault();
                    cvs.focus();
                });
            else { // keyboard events
                cvs.tabIndex = 0;
                cvs.addEventListener(event, e => {
                    listeners[event]({ code: e.code, keyCode: e.keyCode, type: eventType });
                });
            }
        }
    }

    /**
     * Lance la boucle de jeu et de rendu
     */
    run() {
        this.running = true;
        var lastTick = Date.now();
        this.updateIntervalId = setInterval(() => {
            for (; lastTick + this.tps < Date.now(); lastTick += this.tps)
                this.update(this.tps);
            //update(-lastTick + (lastTick = Date.now()));
        }, 1000 / this.tps);
        var requestRender = () => {
            requestAnimationFrame(() => {
                if (this.ctx.resetTransform) this.ctx.resetTransform();
                this.render(this.worldContext, this.viewportContext, this.cvs.width / this.cvs.height);
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
     * @param {string} cursor 
     */
    setCursor(cursor) {
        this.cvs.style.cursor = cursor;
    }
}


export default Engine;