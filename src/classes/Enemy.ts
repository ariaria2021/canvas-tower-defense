import { Entity } from './Entity';

export class Enemy extends Entity {
    waypoints: { x: number; y: number }[];
    currentWaypointIndex: number = 0;
    speed: number = 100; // pixels per second
    health: number = 100;
    maxHealth: number = 100;

    constructor(waypoints: { x: number; y: number }[]) {
        // 最初のウェイポイントから開始
        super(waypoints[0].x, waypoints[0].y, 15, '#EF4444');
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
    }

    update(dt: number): void {
        if (this.currentWaypointIndex >= this.waypoints.length - 1) {
            this.markedForDeletion = true; // ゴール到達
            // TODO: プレイヤーのライフを減らす処理
            return;
        }

        const target = this.waypoints[this.currentWaypointIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            // ウェイポイント到達とみなす
            this.currentWaypointIndex++;
        } else {
            // 移動
            const moveDist = this.speed * dt;
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // 本体描画
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // HPバー
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpPercentage = this.health / this.maxHealth;

        ctx.fillStyle = '#4B5563';
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - this.radius - 10, hpBarWidth, hpBarHeight);

        ctx.fillStyle = '#10B981';
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - this.radius - 10, hpBarWidth * hpPercentage, hpBarHeight);
    }
}
