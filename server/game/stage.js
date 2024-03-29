import { DiagWanderer, Shooter, Wanderer } from './angel.js';
import { stageData, angelData } from '../index.js';

export class Stage {
	constructor(name) {
		this.name = name;

		this.angelsSpecies = stageData[name].angelsSpecies;
		this.archangel = stageData[name].archangel;
		this.angels = [];

		this.strandedMissiles = [];

		this.background = stageData[name].background;
		this.backgroundX = 0;

		this.nameImage = stageData[name].nameImage;
		this.nameOpacity = 1;

		this.numberOfAngels = stageData[name].numberOfAngels;
		this.numberOfAngelsSpawned = 0;
		this.numberOfAngelsKilled = 0;
	}

	update(player) {
		this.angels.forEach(angel => {
			if (angel.health <= 0) {
				if (angel.species === this.archangel) {
					player.souls += 150;
				} else {
					player.souls +=
						angel.type == 'three' ? 40 : angel.type == 'two' ? 25 : 10;
				}
				if (angel.missiles) {
					this.strandedMissiles = this.strandedMissiles.concat(angel.missiles);
				}
			}
		});
		this.angels = this.angels.filter(angel => angel.health > 0);
		this.numberOfAngelsKilled = this.numberOfAngelsSpawned - this.angels.length;
	}

	spawnAngels(width, height) {
		let x = width;
		let y = Math.floor(Math.random() * height);

		if (this.numberOfAngelsSpawned < this.numberOfAngels) {
			const random = Math.random();
			let angel = null;
			if (random < 0.2) {
				angel = new Shooter(
					x,
					y,
					this.angelsSpecies,
					'three',
					angelData[this.angelsSpecies]['three']
				);
			} else if (random < 0.5) {
				angel = new DiagWanderer(
					x,
					y,
					this.angelsSpecies,
					'two',
					angelData[this.angelsSpecies]['two']
				);
			} else {
				angel = new Wanderer(
					x,
					y,
					this.angelsSpecies,
					'one',
					angelData[this.angelsSpecies]['one']
				);
			}
			this.angels.push(angel);
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
