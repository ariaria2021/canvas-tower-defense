import { Entity } from './Entity';
import { Enemy } from './Enemy';

export class Projectile extends Entity {
    target: Enemy;
    speed: number = 400;
    damage: number = 25;
    game: any; // 循環参照回避のためanyまたはinterface推奨だが、今回は簡易的に

    constructor(x: number, y: number, target: Enemy, game: any) {
        super(x, y, 4, '#FBBF24');
        this.target = target;
        this.game = game;
    }

    update(dt: number): void {
        if (this.target.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.target.radius) {
            // 命中
            this.target.health -= this.damage;
            if (this.target.health <= 0) {
                this.target.markedForDeletion = true;
                this.game.stats.addMoney(10); // 敵撃破でお金ゲット
            }
            this.markedForDeletion = true;
        } else {
            const moveDist = this.speed * dt;
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
