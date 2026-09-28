import { Entity } from './Entity';

export class Enemy extends Entity {
    waypoints: { x: number; y: number }[];
    currentWaypointIndex: number = 0;
    reachedGoal: boolean = false;
    speed: number = 100; // pixels per second
    health: number = 100;
    maxHealth: number = 100;

    constructor(waypoints: { x: number; y: number }[], health: number = 100, speed: number = 100, color: string = '#D64545') {
        // 最初のウェイポイントから開始
        super(waypoints[0].x, waypoints[0].y, 16, color);
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
    }

    update(dt: number): void {
        if (this.markedForDeletion) return;

        let remainingDistance = this.speed * dt;
        while (this.currentWaypointIndex < this.waypoints.length - 1) {
            const target = this.waypoints[this.currentWaypointIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (remainingDistance < distance) {
                this.x += (dx / distance) * remainingDistance;
                this.y += (dy / distance) * remainingDistance;
                return;
            }

            // 曲がり角に到達し、残りの距離で次の区間へ進む。
            this.x = target.x;
            this.y = target.y;
            remainingDistance -= distance;
            this.currentWaypointIndex++;
        }

        this.reachedGoal = true;
        this.markedForDeletion = true;
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
