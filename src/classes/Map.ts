export class GameMap {
    waypoints: { x: number; y: number }[] = [];

    constructor(width: number, height: number) {
        // シンプルなジグザグコースを生成（画面サイズに合わせて調整）
        const margin = 100;
        const w = width - margin * 2;
        // const h = height - margin * 2; // 未使用変数を削除

        this.waypoints = [
            { x: margin, y: height / 2 },              // Start
            { x: margin + w * 0.2, y: height / 2 },
            { x: margin + w * 0.2, y: margin },
            { x: margin + w * 0.5, y: margin },
            { x: margin + w * 0.5, y: height - margin },
            { x: margin + w * 0.8, y: height - margin },
            { x: margin + w * 0.8, y: height / 2 },
            { x: width - margin, y: height / 2 },      // Goal
        ];
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.waypoints.length < 2) return;

        ctx.strokeStyle = '#374151'; // Path color
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        ctx.stroke();

        // Start & Goal markers
        ctx.fillStyle = '#10B981'; // Start (Green)
        ctx.beginPath();
        ctx.arc(this.waypoints[0].x, this.waypoints[0].y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444'; // Goal (Red)
        ctx.beginPath();
        ctx.arc(this.waypoints[this.waypoints.length - 1].x, this.waypoints[this.waypoints.length - 1].y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}
