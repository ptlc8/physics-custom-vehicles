export default class Cursor {
    
    constructor(maxX, maxY) {
        this.maxX = maxX;
        this.maxY = maxY;
        this.worldX = 0;
        this.worldY = 0;
        this.viewportX = 0;
        this.viewportY = 0;
        this.canvasX = 0;
        this.canvasY = 0;
        this.sensitivity = 40;
    }

    setPos(x, y, ctx, worldContext, viewportContext) {
        this.worldX = worldContext.camera.camToWorldX(x, ctx);
        this.worldY = worldContext.camera.camToWorldY(y, ctx);
        this.viewportX = viewportContext.camera.camToWorldX(x, ctx);
        this.viewportY = viewportContext.camera.camToWorldY(y, ctx);
        this.canvasX = x;
        this.canvasY = y;
    }

    addPos(x, y, ctx, worldContext, viewportContext) {
        x = Math.max(0, Math.min(this.maxX, this.canvasX + x * this.sensitivity));
        y = Math.max(0, Math.min(this.maxY, this.canvasY + y * this.sensitivity));
        this.setPos(x, y, ctx, worldContext, viewportContext);
    }
}