import { Entity } from './Entity';
import { GameMap } from './Map';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { PlayerStats } from './PlayerStats';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    lastTime: number;
    entities: Entity[] = [];
    map: GameMap;
    enemySpawnTimer: number = 0;
    enemySpawnInterval: number = 1.5;
    totalEnemiesToSpawn: number = 10;
    spawnedEnemiesCount: number = 0;
    stats: PlayerStats;
    isGameOver: boolean = false;
    isPaused: boolean = false;
    currentStage: number = 1;

    // 仮想座標系
    logicalWidth: number = 800;
    logicalHeight: number = 600;
    scale: number = 1;

    enemyBaseHealth: number = 100;
    enemyBaseSpeed: number = 100;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.scale = this.width / this.logicalWidth;
        this.logicalHeight = this.height / this.scale;
        this.lastTime = 0;

        this.map = new GameMap(this.logicalWidth, this.logicalHeight);
        this.stats = new PlayerStats();

        window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.scale = this.width / this.logicalWidth;
        this.logicalHeight = this.height / this.scale;
        this.map = new GameMap(this.logicalWidth, this.logicalHeight);
    }

    handleClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        // 仮想座標に変換
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        const gridSize = 40;
        const snappedX = Math.floor(x / gridSize) * gridSize + gridSize / 2;
        const snappedY = Math.floor(y / gridSize) * gridSize + gridSize / 2;

        // タワーコスト: 50
        if (this.stats.spendMoney(50)) {
            this.addEntity(new Tower(snappedX, snappedY, this));
        }
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    loop(timestamp: number) {
        if (this.isGameOver || this.isPaused) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseStatus = document.getElementById('pause-status');
        if (pauseStatus) {
            pauseStatus.textContent = this.isPaused ? '▶' : 'II';
        }

        if (!this.isPaused) {
            this.lastTime = performance.now();
            requestAnimationFrame((ts) => this.loop(ts));
        }
    }

    update(dt: number) {
        if (this.isGameOver) return;

        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.spawnedEnemiesCount < this.totalEnemiesToSpawn) {
            this.enemySpawnTimer = 0;

            let health = 100;
            let speed = 100;
            let color = '#EF4444'; // Basic (Red)

            const rand = Math.random();
            if (this.currentStage >= 3 && rand < 0.2) {
                // Fast (Yellow)
                health = 50;
                speed = 200;
                color = '#FBBF24';
            } else if (this.currentStage >= 2 && rand < 0.4) {
                // Tank (Blue)
                health = 300;
                speed = 60;
                color = '#3B82F6';
            }

            // ステージが進むごとに全体的に大幅に強化（少数精鋭）
            const hpMultiplier = 1 + (this.currentStage - 1) * 0.5;
            const speedMultiplier = 1 + (this.currentStage - 1) * 0.1;
            this.entities.push(new Enemy(this.map.waypoints, health * hpMultiplier, speed * speedMultiplier, color));
            this.spawnedEnemiesCount++;
        }

        this.entities.forEach(entity => {
            entity.update(dt);
        });

        this.entities.forEach(entity => {
            if (entity instanceof Enemy) {
                // ゴール到達チェック（簡易）
                const goal = this.map.waypoints[this.map.waypoints.length - 1];
                const dx = entity.x - goal.x;
                const dy = entity.y - goal.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 15 && !entity.markedForDeletion) {
                    entity.markedForDeletion = true;
                    this.stats.takeDamage(1);
                }
            }
        });

        this.entities = this.entities.filter(entity => !entity.markedForDeletion);
        this.updateUI();

        // ステージクリア判定
        const remainingEnemies = this.entities.filter(e => e instanceof Enemy).length;
        if (this.spawnedEnemiesCount >= this.totalEnemiesToSpawn && remainingEnemies === 0 && !this.isGameOver) {
            this.winGame();
        }
    }

    updateUI() {
        const enemyCountEl = document.getElementById('enemy-count');
        const stageEl = document.getElementById('stage');

        if (enemyCountEl) {
            const currentEnemies = this.entities.filter(e => e instanceof Enemy).length;
            enemyCountEl.textContent = (this.totalEnemiesToSpawn - this.spawnedEnemiesCount + currentEnemies).toString();
        }

        if (stageEl) {
            stageEl.textContent = this.currentStage.toString();
        }
    }

    winGame() {
        this.isGameOver = true;
        const overlay = document.getElementById('overlay');
        const restartBtn = document.getElementById('restart-btn');
        const titleEl = document.getElementById('overlay-title');

        if (titleEl) titleEl.textContent = `STAGE ${this.currentStage} CLEAR!`;
        if (overlay) {
            overlay.classList.add('active');
        }

        if (restartBtn) {
            restartBtn.textContent = 'NEXT STAGE';
            restartBtn.onclick = () => this.startNextStage();
        }
    }

    startNextStage() {
        this.currentStage++;
        this.totalEnemiesToSpawn = 10 + (this.currentStage - 1) * 2;
        this.spawnedEnemiesCount = 0;
        this.enemySpawnTimer = 0;
        this.isGameOver = false;

        // 既存の敵や弾丸をクリア（タワーは残す）
        this.entities = this.entities.filter(entity => entity instanceof Tower);

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        this.updateUI();
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    draw() {
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        this.ctx.fillStyle = '#111827';
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

        this.drawGrid();
        this.map.draw(this.ctx);
        this.entities.forEach(entity => entity.draw(this.ctx));

        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 40;
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.logicalWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.logicalHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.logicalHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.logicalWidth, y);
            this.ctx.stroke();
        }
    }
}
