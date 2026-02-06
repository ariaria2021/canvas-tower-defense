import './style.css';
import { Game } from './classes/Game';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="ui-layer">
    <div class="stat-box">
      <span class="label">HP</span>
      <span id="lives" class="value">20</span>
    </div>
    <div class="stat-box">
      <span class="label">MONEY</span>
      <span id="money" class="value">100</span>
    </div>
    <div class="stat-box">
      <span class="label">ENEMIES</span>
      <span id="enemy-count" class="value">0</span>
    </div>
  </div>
  <canvas id="gameCanvas"></canvas>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const game = new Game(canvas);

game.start();
