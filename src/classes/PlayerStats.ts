export class PlayerStats {
    money: number = 100;
    lives: number = 20;
    score: number = 0;

    private moneyEl: HTMLElement;
    private livesEl: HTMLElement;
    // private scoreEl: HTMLElement;

    constructor() {
        this.moneyEl = document.getElementById('money')!;
        this.livesEl = document.getElementById('lives')!;
        // this.scoreEl = document.getElementById('score')!;
        this.updateUI();
    }

    addMoney(amount: number) {
        this.money += amount;
        this.updateUI();
    }

    spendMoney(amount: number): boolean {
        if (this.money >= amount) {
            this.money -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    takeDamage(amount: number) {
        this.lives -= amount;
        this.updateUI();
        if (this.lives <= 0) {
            alert('Game Over!');
            location.reload(); // 簡易リセット
        }
    }

    private updateUI() {
        this.moneyEl.textContent = this.money.toString();
        this.livesEl.textContent = this.lives.toString();
        // this.scoreEl.textContent = this.score.toString();
    }
}
