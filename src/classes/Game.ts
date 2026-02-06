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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.lastTime = 0;

        this.map = new GameMap(this.width, this.height);
        this.stats = new PlayerStats();

        window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.map = new GameMap(this.width, this.height);
    }

    handleClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // タワーコスト: 50
        if (this.stats.spendMoney(50)) {
            this.addEntity(new Tower(x, y, this));
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
        if (this.isGameOver) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt: number) {
        if (this.isGameOver) return;

        const enemyCountEl = document.getElementById('enemy-count');
        if (enemyCountEl) {
            enemyCountEl.textContent = (this.totalEnemiesToSpawn - this.spawnedEnemiesCount + this.entities.filter(e => e instanceof Enemy).length).toString();
        }

        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.spawnedEnemiesCount < this.totalEnemiesToSpawn) {
            this.enemySpawnTimer = 0;
            this.entities.push(new Enemy(this.map.waypoints));
            this.spawnedEnemiesCount++;
        }

        this.entities.forEach(entity => {
            entity.update(dt);

            // 敵がゴール到達
            if (entity instanceof Enemy && entity.markedForDeletion && entity.health > 0) {
                // Health > 0 なのに削除フラグ = ゴール到達とみなす（Enemyクラスの実装依存）
                // Enemy.ts側でゴール時にフラグ立てている前提
                // ただし、Projectile.tsで倒された場合もフラグ立つので区別が必要
                // ここでは「ゴール到達時にのみ呼び出される特別なフラグ」がないので、距離チェックなどを簡易的に行うか、
                // Enemyクラスに finished プロパティを追加するのが正しい。
            }
        });

        // 実際の実装: Enemyクラスでゴール到達時にstatsを操作できるよう、EnemyにGameへの参照を渡すか、
        // Game側でEnemyの状態を監視する。
        // 今回はEnemyクラスを修正して、Gameクラスへの参照を持たせるか、
        // もしくはGameクラスでEnemyの位置をチェックする。後者の方が結合度が低い。

        this.entities.forEach(entity => {
            if (entity instanceof Enemy) {
                // ゴール到達チェック（簡易）
                const goal = this.map.waypoints[this.map.waypoints.length - 1];
                const dist = Math.sqrt((entity.x - goal.x) ** 2 + (entity.y - goal.y) ** 2);
                if (dist < 10 && !entity.markedForDeletion) {
                    entity.markedForDeletion = true;
                    this.stats.takeDamage(1);
                }
            }
        });

        this.entities = this.entities.filter(entity => !entity.markedForDeletion);

        // ステージクリア判定
        const remainingEnemies = this.entities.filter(e => e instanceof Enemy).length;
        if (this.spawnedEnemiesCount >= this.totalEnemiesToSpawn && remainingEnemies === 0 && !this.isGameOver) {
            this.winGame();
        }
    }

    winGame() {
        this.isGameOver = true;
        setTimeout(() => {
            alert('STAGE CLEAR!');
            location.reload();
        }, 500);
    }

    draw() {
        this.ctx.fillStyle = '#111827';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.map.draw(this.ctx);
        this.entities.forEach(entity => entity.draw(this.ctx));
    }

    drawGrid() {
        const gridSize = 40;
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
}
