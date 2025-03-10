import { images } from '../main.js';
import { renderMissiles } from './renderMissiles.js';

export function renderPlayer(player, context) {
	if (player.health <= 0) return;
	let direction =
		player.speedX > 0 ? 'right' : player.speedX < 0 ? 'left' : 'idle';
	const image = images.players[player.currentSkin][direction];

	context.drawImage(image, player.posX, player.posY);

	context.beginPath();
	context.font = '20px Arial';
	context.fillStyle = 'black';
	context.fillText(player.userName, player.posX, player.posY - 15);
	context.closePath();

	renderMissiles(player.missiles, context);
}

export function renderPlayers(players, context) {
	players.forEach(player => {
		renderPlayer(player, context);
	});
}

export function renderHealthBar(player, position, context) {
	const startX = 10 + position * 110;
	const startY = 10;

	const healthBarWidth = (player.health / player.maxHealth) * 150;
	const healthBarHeight = position === 0 ? 20 : 15;

	context.fillStyle = calculateCurrentColorBasedOnHealth(player);
	context.fillRect(startX, startY, healthBarWidth, healthBarHeight);

	context.beginPath();
	context.rect(startX, startY, 150, healthBarHeight);
	context.strokeStyle = 'black';
	context.lineWidth = 2;
	context.stroke();
	context.closePath();

	context.font = '20px Arial';
	context.fillStyle = 'black';
	context.fillText(
		player.userName,
		startX + 10,
		startY + healthBarHeight - 3.5
	);
}

function calculateCurrentColorBasedOnHealth(player) {
	let green = Math.floor((player.health / player.maxHealth) * 255);
	let red = 255 - green;
	return `rgb(${red}, ${green}, 0)`;
}

export function renderPlayerHitbox(player, context) {
	context.beginPath();
	context.rect(
		player.posX,
		player.posY,
		player.hitboxWidth,
		player.hitboxHeight
	);
	context.strokeStyle = 'red';
	context.stroke();
	context.closePath();
}

export function renderPlayerStats(player, context, canvas) {
	context.font = '20px Arial';
	context.fillStyle = 'black';
	context.fillText(`Health: ${player.health}`, 10, 20);
	context.fillText(`Damage: ${player.damage}`, 10, 40);
	context.fillText(`Fire Speed: ${player.fireSpeed}`, 10, 60);
	context.fillText(`Speed: ${player.speed}`, 10, 80);
}
