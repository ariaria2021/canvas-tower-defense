import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { Game } from './Game';

export class Tower extends Entity {
    range: number = 150;
    cooldown: number = 0;
    maxCooldown: number = 0.8; // 発射間隔（秒）
    game: Game;

    constructor(x: number, y: number, game: Game) {
        super(x, y, 20, '#3B82F6'); // Blue Square
        this.game = game;
    }

    update(dt: number): void {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (this.cooldown <= 0) {
            const target = this.findTarget();
            if (target) {
                this.shoot(target);
                this.cooldown = this.maxCooldown;
            }
        }
    }

    findTarget(): Enemy | null {
        let nearestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        const enemies = this.game.entities.filter(e => e instanceof Enemy) as Enemy[];

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.range && distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        return nearestEnemy;
    }

    shoot(target: Enemy) {
        // 修正: Projectileのコンストラクタにthis.gameを渡す
        this.game.addEntity(new Projectile(this.x, this.y, target, this.game));
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);

        ctx.fillStyle = '#1D4ED8';
        ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
    }
}
