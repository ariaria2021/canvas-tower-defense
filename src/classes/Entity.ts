export abstract class Entity {
    x: number;
    y: number;
    radius: number;
    color: string;
    markedForDeletion: boolean = false;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    abstract update(dt: number): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;
}
