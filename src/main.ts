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
  <div id="overlay" class="overlay">
    <div class="overlay-content">
      <h2 id="overlay-title">STAGE CLEAR!</h2>
      <button id="restart-btn" class="restart-btn">NEXT STAGE</button>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const game = new Game(canvas);

game.start();
