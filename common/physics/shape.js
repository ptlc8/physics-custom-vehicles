import Box2D from "box2d.js";


class Shape {
    /**
     * @returns {Box2D.b2Shape}
     */
    toBox2D() {
        throw new Error("Not implemented");
    }
}

Shape.Box = class extends Shape {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }
    toBox2D() {
        let shape = new Box2D.b2PolygonShape();
        shape.SetAsBox(this.width, this.height);
        return shape;
    }
}

Shape.Circle = class extends Shape {
    constructor(radius) {
        super();
        this.radius = radius;
    }
    toBox2D() {
        let shape = new Box2D.b2CircleShape();
        shape.set_m_radius(this.radius);
        return shape;
    }
}

Shape.Polygon = class extends Shape {
    constructor(vertices) {
        super();
        this.vertices = vertices;
    }
    toBox2D() {
        var shape = new Box2D.b2PolygonShape();
        var buffer = Box2D._malloc(this.vertices.length * 8);
        var offset = 0;
        for (var i = 0; i < this.vertices.length; i++) {
            Box2D.HEAPF32[buffer + offset >> 2] = this.vertices[i][0];
            Box2D.HEAPF32[buffer + (offset + 4) >> 2] = this.vertices[i][1];
            offset += 8;
        }
        var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
        shape.Set(ptr_wrapped, this.vertices.length);
        return shape;
    }
}


export default Shape;
