import Camera from "./camera";
import { getImage } from "./images.js";


class RenderContext {

    /**
     * @param {CanvasRenderingContext2D} context 2d canvas context
     * @param {Camera} [camera=new Camera()]
     */
    constructor(context, camera = new Camera()) {
        this.ctx = context;
        this.camera = camera;
    }

    worldToCamX(x) {
        return this.camera.worldToCamX(x, this.ctx);
    }
    worldToCamY(y) {
        return this.camera.worldToCamY(y, this.ctx);
    }
    worldToCamSize(s) {
        return this.camera.worldToCamSize(s, this.ctx);
    }

    drawRect(color, x, y, w, h, angle = 0, originX = 0, originY = 0) {
        this.ctx.fillStyle = color;
        x = this.worldToCamX(x);
        y = this.worldToCamY(y);
        w = this.worldToCamSize(w);
        h = this.worldToCamSize(h);
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.translate(-originX * w, -originY * h);
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
        this.ctx.translate(originX * w, originY * h);
        this.ctx.rotate(-angle);
        this.ctx.translate(-x, -y);
    }
    drawRectInfiniteX(color, y, h) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, this.worldToCamY(y), this.ctx.canvas.width, this.worldToCamSize(h));
    }
    drawRectInfiniteY(color, x, w) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.worldToCamX(x), 0, this.worldToCamSize(w), this.ctx.canvas.height);
    }
    drawLine(color, x1, y1, x2, y2, thickness = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = this.worldToCamSize(thickness);
        this.ctx.beginPath();
        this.ctx.moveTo(this.worldToCamX(x1), this.worldToCamY(y1));
        this.ctx.lineTo(this.worldToCamX(x2), this.worldToCamY(y2));
        this.ctx.stroke();
    }
    drawLines(color, xs, ys, thickness = 1, close = false) {
        if (!xs.length || !ys.length || xs.length != ys.length) {
            console.error("[Engine] Invalid coordinates");
            return;
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = this.worldToCamSize(thickness);
        this.ctx.beginPath();
        this.ctx.moveTo(this.worldToCamX(xs[0]), this.worldToCamY(ys[0]));
        for (let i = 1; i < xs.length; i++) {
            this.ctx.lineTo(this.worldToCamX(xs[i]), this.worldToCamY(ys[i]));
        }
        if (close) this.ctx.lineTo(this.worldToCamX(xs[0]), this.worldToCamY(ys[0]));
        this.ctx.stroke();
    }
    drawCircle(color, x, y, r) {
        this.ctx.fillStyle = color;
        x = this.worldToCamX(x);
        y = this.worldToCamY(y);
        r = this.worldToCamSize(r);
        this.ctx.translate(x, y);
        this.ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
        this.ctx.translate(-x, -y);
    }
    drawImage(imageName, x, y, w, h, angle = 0, originX = 0, originY = 0) {
        x = this.worldToCamX(x);
        y = this.worldToCamY(y);
        w = this.worldToCamSize(w);
        h = this.worldToCamSize(h);
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.translate(-originX * w, -originY * h);
        try {
            this.ctx.drawImage(getImage(imageName), -w / 2, -h / 2, w, h);
        } catch (e) { }
        this.ctx.translate(originX * w, originY * h);
        this.ctx.rotate(-angle);
        this.ctx.translate(-x, -y);
    }
    drawImageInfiniteX(imageName, x, y, w, h) {
        x = this.worldToCamX(x);
        y = this.worldToCamY(y);
        w = this.worldToCamSize(w);
        h = this.worldToCamSize(h);
        this.ctx.translate(0, y);
        for (let j = (x % w - w) % w; j < this.ctx.canvas.width + w / 2; j += w) {
            try {
                this.ctx.drawImage(getImage(imageName), j - w / 2, -h / 2, w, h);
            } catch (e) { }
        }
        this.ctx.translate(0, -y);
    }
    drawText(text, x, y, fontHeight, color, angle = 0, strokeColor = undefined, textAlign = "left", originY = 0, font = "Arial", maxWidth = undefined) {
        fontHeight = this.worldToCamSize(fontHeight);
        x = this.worldToCamX(x);
        y = this.worldToCamY(y);
        if (maxWidth) maxWidth = this.worldToCamSize(maxWidth);
        this.ctx.fillStyle = color;
        if (strokeColor) this.ctx.strokeStyle = strokeColor;
        if (strokeColor) this.ctx.lineWidth = 0.03 * fontHeight;
        this.ctx.font = fontHeight + "px " + font;
        this.ctx.textAlign = textAlign;
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        let h = fontHeight; // TODO: h = fontHeight sur le vCtx, mais h = canvas.height sur le wctx
        this.ctx.translate(0, -originY * h);
        this.ctx.fillText(text, 0, fontHeight / 2, maxWidth);
        if (strokeColor) this.ctx.strokeText(text, 0, fontHeight / 2, maxWidth);
        this.ctx.translate(0, originY * h);
        this.ctx.rotate(-angle);
        this.ctx.translate(-x, -y);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

export default RenderContext;