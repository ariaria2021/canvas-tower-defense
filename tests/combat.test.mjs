import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// Node 24 strips TypeScript; resolve the extensionless imports used by Vite.
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (context.parentURL?.endsWith('.ts') && specifier.startsWith('./')) {
            return nextResolve(`${specifier}.ts`, context);
        }
        return nextResolve(specifier, context);
    },
});
const { Enemy } = await import('../src/classes/Enemy.ts');
const { Projectile } = await import('../src/classes/Projectile.ts');
const { Tower } = await import('../src/classes/Tower.ts');
const { Game } = await import('../src/classes/Game.ts');

const straight = [{ x: 0, y: 0 }, { x: 10000, y: 0 }];
function gameFixture() {
    const game = Object.create(Game.prototype);
    Object.assign(game, {
        entities: [], map: { waypoints: straight }, currentStage: 1,
        enemySpawnTimer: 0, enemySpawnInterval: 1.5,
        spawnedEnemiesCount: 0, totalEnemiesToSpawn: 10, isGameOver: false,
        stats: {
            money: 0, lives: 20,
            addMoney(amount) { this.money += amount; },
            takeDamage(amount) { this.lives -= amount; },
        },
        updateUI() {},
    });
    return game;
}

for (const stage of [1, 2, 3, 5, 6, 10, 11, 12, 20]) {
    test(`stage ${stage}: speed cap, unchanged HP and enemy count`, (t) => {
        globalThis.requestAnimationFrame = () => 0;
        globalThis.document = { getElementById: () => null };
        t.after(() => {
            delete globalThis.requestAnimationFrame;
            delete globalThis.document;
        });
        for (const [roll, baseHealth, baseSpeed, availableFrom] of [
            [0.8, 100, 100, 1], [0.1, 50, 200, 3], [0.3, 300, 60, 2],
        ]) {
            if (stage < availableFrom) continue;
            const game = gameFixture();
            if (stage > 1) {
                game.currentStage = stage - 1;
                game.startNextStage();
            }
            assert.equal(game.totalEnemiesToSpawn, 10 + (stage - 1) * 2);
            const random = t.mock.method(Math, 'random', () => roll);
            game.enemySpawnTimer = 1.5;
            game.update(0);
            random.mock.restore();
            const enemy = game.entities[0];
            assert.equal(enemy.speed, baseSpeed * Math.min(1.5, 1 + (stage - 1) * 0.1));
            assert.equal(enemy.health, baseHealth * (1 + (stage - 1) * 0.5));
        }
    });
}

for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.5]) {
    test(`projectile catches a fleeing fast enemy at dt=${dt}`, () => {
        const enemy = new Enemy(straight, 525, 300);
        const shot = new Projectile(-150, 0, enemy, gameFixture());
        for (let elapsed = 0; elapsed < 3 && !shot.markedForDeletion; elapsed += dt) {
            enemy.update(dt);
            shot.update(dt);
        }
        assert.equal(enemy.health, 500);
        assert.equal(shot.markedForDeletion, true);
    });
}

test('large projectile movement hits once, with one kill reward', () => {
    const game = gameFixture();
    const enemy = new Enemy(straight, 25, 0);
    const shots = [new Projectile(-100, 0, enemy, game), new Projectile(-100, 0, enemy, game)];
    for (const shot of shots) { shot.update(1); shot.update(1); }
    assert.equal(enemy.health, 0);
    assert.equal(game.stats.money, 10);
    assert.ok(shots.every(shot => shot.markedForDeletion));
});

test('enemy consumes remaining distance across corners and duplicate waypoints', () => {
    const enemy = new Enemy([
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 },
        { x: 10, y: 10 }, { x: 30, y: 10 },
    ], 100, 100);
    enemy.update(0.25);
    assert.deepEqual([enemy.x, enemy.y, enemy.currentWaypointIndex], [15, 10, 3]);
    assert.equal(enemy.reachedGoal, false);
    enemy.update(1);
    assert.deepEqual([enemy.x, enemy.y], [30, 10]);
    assert.equal(enemy.reachedGoal, true);
    assert.equal(enemy.markedForDeletion, true);
});

test('goal arrival costs exactly one life and no kill reward', () => {
    const game = gameFixture();
    const enemy = new Enemy([{ x: 0, y: 0 }, { x: 10, y: 0 }], 25, 300);
    game.entities = [enemy, new Projectile(0, 0, enemy, game)];
    game.update(0.5);
    game.update(0.5);
    assert.equal(game.stats.lives, 19);
    assert.equal(game.stats.money, 0);
    assert.equal(game.entities.length, 0);
});

test('killed enemy does not move or cost a life', () => {
    const game = gameFixture();
    const enemy = new Enemy([{ x: 0, y: 0 }, { x: 10, y: 0 }], 25, 300);
    game.entities = [new Projectile(0, 0, enemy, game), enemy];
    game.update(0.5);
    assert.equal(enemy.x, 0);
    assert.equal(enemy.reachedGoal, false);
    assert.equal(game.stats.lives, 20);
    assert.equal(game.stats.money, 10);
});

test('tower ignores deleted enemies', () => {
    const game = gameFixture();
    const dead = new Enemy(straight);
    dead.markedForDeletion = true;
    const alive = new Enemy(straight);
    alive.x = 50;
    game.entities = [dead, alive];
    const tower = new Tower(0, 0, game);
    assert.equal(tower.findTarget(), alive);
    alive.markedForDeletion = true;
    assert.equal(tower.findTarget(), null);
});

function canvasGameFixture(t, width = 390, height = 780) {
    const rect = { left: 7, top: 64, width, height };
    const context = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}) });
    const canvas = {
        getContext: () => context,
        getBoundingClientRect: () => rect,
        addEventListener() {},
    };
    const callbacks = {};
    globalThis.document = { getElementById: () => ({ textContent: '', classList: { add() {}, remove() {} } }) };
    globalThis.window = { addEventListener: (event, callback) => { callbacks[event] = callback; } };
    globalThis.ResizeObserver = class {
        constructor(callback) { callbacks.observer = callback; }
        observe() {}
    };
    t.after(() => {
        delete globalThis.document;
        delete globalThis.window;
        delete globalThis.ResizeObserver;
    });
    const game = new Game(canvas);
    const click = (x, y) => game.handleClick({
        clientX: rect.left + game.offsetX + x * game.scale,
        clientY: rect.top + game.offsetY + y * game.scale,
    });
    return { game, rect, callbacks, click };
}

test('board fits portrait, landscape and wide canvases without changing the map', (t) => {
    const { game, rect } = canvasGameFixture(t);
    const originalMap = game.map;
    for (const [width, height] of [[390, 780], [320, 504], [844, 326], [1920, 995], [2560, 515], [800, 600]]) {
        Object.assign(rect, { width, height });
        game.resize();
        assert.equal(game.logicalWidth, 800);
        assert.equal(game.logicalHeight, 600);
        assert.equal(game.map, originalMap);
        assert.ok(game.offsetX >= 0 && game.offsetY >= 0);
        assert.ok(game.logicalWidth * game.scale <= width + 1e-9);
        assert.ok(game.logicalHeight * game.scale <= height + 1e-9);
    }
});

test('click coordinates include letterboxing and reject every outside edge without charging', (t) => {
    const { game, rect, click } = canvasGameFixture(t);
    for (const [width, height] of [[390, 780], [844, 326]]) {
        Object.assign(rect, { width, height });
        game.resize();
        game.entities = [];
        game.stats.money = 100;
        for (const [x, y] of [[-1, 300], [801, 300], [400, -1], [400, 601]]) click(x, y);
        assert.equal(game.entities.length, 0);
        assert.equal(game.stats.money, 100);
        click(780, 580);
        assert.deepEqual([game.entities[0].x, game.entities[0].y], [780, 580]);
        assert.equal(game.stats.money, 50);
        click(780, 580);
        assert.equal(game.stats.money, 50);
        click(20, 20);
        assert.deepEqual([game.entities[1].x, game.entities[1].y], [20, 20]);
    }
});

test('paused rotation preserves enemies, projectiles, towers and paths and redraws', (t) => {
    const { game, rect, callbacks, click } = canvasGameFixture(t);
    click(60, 300);
    game.enemySpawnTimer = 1.5;
    game.update(0);
    game.update(0.01);
    game.isPaused = true;
    const entities = [...game.entities];
    const positions = entities.map(e => [e.x, e.y]);
    const map = game.map;
    const draw = t.mock.method(game, 'draw');
    Object.assign(rect, { width: 844, height: 326 });
    callbacks.resize();
    callbacks.observer();
    assert.equal(draw.mock.callCount(), 2);
    assert.equal(game.map, map);
    assert.deepEqual(game.entities, entities);
    assert.deepEqual(game.entities.map(e => [e.x, e.y]), positions);
    assert.ok(game.entities.filter(e => e instanceof Enemy).every(e => e.waypoints === map.waypoints));
    assert.ok(game.entities.some(e => e instanceof Projectile));
    assert.equal(game.isPaused, true);
});

test('zero-sized canvas ignores placement and recovers when visible', (t) => {
    const { game, rect, click } = canvasGameFixture(t, 0, 0);
    click(20, 20);
    assert.equal(game.entities.length, 0);
    assert.equal(game.stats.money, 100);
    Object.assign(rect, { width: 800, height: 600 });
    game.resize();
    click(20, 20);
    assert.equal(game.entities.length, 1);
});

test('same battle produces identical results across canvas sizes and mid-battle rotation', (t) => {
    t.mock.method(Math, 'random', () => 0.1);
    const results = [];
    for (const [width, height, rotate] of [[390, 780, false], [844, 326, false], [2560, 515, false], [390, 780, true]]) {
        const { game, rect, click } = canvasGameFixture(t, width, height);
        game.currentStage = 10;
        game.totalEnemiesToSpawn = 5;
        click(220, 300);
        click(580, 300);
        const samples = [];
        for (let frame = 0; frame < 1200; frame++) {
            if (rotate && frame === 240) {
                Object.assign(rect, { width: 844, height: 326 });
                game.resize();
            }
            game.update(1 / 60);
            if (frame % 120 === 0) {
                samples.push(game.entities.map(e => [e.constructor.name, e.x, e.y, e.health]));
            }
        }
        results.push({ samples, lives: game.stats.lives, money: game.stats.money, entities: game.entities.map(e => [e.constructor.name, e.x, e.y, e.health]), cleared: game.isGameOver });
    }
    assert.ok(results[0].samples.flat().some(([type, , , health]) => type === 'Enemy' && health < 275));
    assert.ok(results[0].lives < 20); // Enemies traversed the full path; this is not an idle comparison.
    for (const result of results.slice(1)) assert.deepEqual(result, results[0]);
});
