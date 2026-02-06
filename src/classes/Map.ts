export class GameMap {
    waypoints: { x: number; y: number }[] = [];

    constructor(width: number, height: number) {
        // 論理座標(800xH)に基づいた固定のコース設計
        const margin = 60;
        const h = height - margin * 2;

        this.waypoints = [
            { x: 20, y: height / 2 },              // Start
            { x: margin, y: height / 2 },
            { x: margin, y: height / 2 - h * 0.3 },
            { x: width - margin, y: height / 2 - h * 0.3 },
            { x: width - margin, y: height / 2 + h * 0.3 },
            { x: margin, y: height / 2 + h * 0.3 },
            { x: margin, y: height / 2 },
            { x: width - 20, y: height / 2 },      // Goal
        ];
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.waypoints.length < 2) return;

        ctx.strokeStyle = '#E6DDC3'; // Earthy Path color
        ctx.lineWidth = 44;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        ctx.stroke();

        // Start & Goal markers
        ctx.fillStyle = '#3E8E7E'; // Start (Muted Green)
        ctx.beginPath();
        ctx.arc(this.waypoints[0].x, this.waypoints[0].y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#B8405E'; // Goal (Muted Red)
        ctx.beginPath();
        ctx.arc(this.waypoints[this.waypoints.length - 1].x, this.waypoints[this.waypoints.length - 1].y, 18, 0, Math.PI * 2);
        ctx.fill();
    }
}
