import { Wanderer } from './angel.js';
import { backgrounds } from './assetsLoader.js';

export class Stage {
	constructor(stageData) {
		this.angelsSpecies = 'puissance';
		this.archangel = 'camael';
		this.angels = [];

		this.background = backgrounds.stageOne;
		this.backgroundX = 0;

		this.numberOfAngels = 10;
		this.numberOfAngelsSpawned = 0;
		this.numberOfAngelsKilled = 0;
	}

	renderBackground(context) {
		const img = new Image();
		img.src = this.background;
		this.backgroundX -= 1;
		if (this.backgroundX <= -img.width) {
			console.log('reset');
			this.backgroundX = -1;
		}
		context.drawImage(img, this.backgroundX, 0);
		context.drawImage(img, this.backgroundX + img.width, 0);
	}

	renderAngels(context) {
		this.angels.forEach(angel => angel.render(context));
	}

	renderProgressionBar(context, canvas) {
		context.beginPath();
		context.rect((canvas.width / 4) * 3 - 150, 10, 300, 20);
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.stroke();
		context.fillStyle = this.calculateCurrentColorBasedOnProgression();
		context.fillRect(
			(canvas.width / 4) * 3 - 150,
			10,
			(this.numberOfAngelsKilled / this.numberOfAngels) * 300,
			20
		);
	}

	calculateCurrentColorBasedOnProgression() {
		let green = (this.numberOfAngelsKilled / this.numberOfAngels) * 240;
		let red = 240 - green;
		return `rgb(${red}, ${green}, 0)`;
	}

	update(canvas) {
		this.angels = this.angels.filter(angel => angel.health > 0);
		this.numberOfAngelsKilled = this.numberOfAngelsSpawned - this.angels.length;
		this.angels.forEach(angel => angel.update(canvas));
	}

	spawnAngels(canvas, gameNotFocused) {
		let x = canvas.width;
		let y = Math.floor(Math.random() * canvas.height);

		if (gameNotFocused) return;
		if (this.numberOfAngelsSpawned < this.numberOfAngels) {
			this.angels.push(new Wanderer(x, y, this.angelsSpecies, 'one'));
			this.numberOfAngelsSpawned++;
		}
	}

	stageIsClear() {
		return (
			this.numberOfAngelsSpawned === this.numberOfAngels &&
			this.angels.length === 0
		);
	}
}
