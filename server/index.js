import http from 'http';
import express from 'express';
import addWebpackMiddleware from './middlewares/addWebpackMiddleware.js';
import { Server as IOServer } from 'socket.io';
import login from './login/login.js';
import signin from './login/signin.js';
import forgetPassword from './login/forgetPassword.js';
import Game from './game/game.js';
import { readFileSync, writeFileSync } from 'fs';
import resetPassword from './login/resetPassword.js';
import logout from './login/logout.js';
import {
	setCurrentSkin,
	setSkinsPool,
	setStat,
} from './player/playerDataManager.js';

let currentGame = [];

const fileOptions = { root: process.cwd() };
const app = express();
const httpServer = http.createServer(app);
export const io = new IOServer(httpServer);

export let angelData = JSON.parse(
	readFileSync('server/data/angelData.json', 'utf8')
);
export let playersData = JSON.parse(
	readFileSync('server/data/playerData.json', 'utf8')
);
export let stageData = JSON.parse(
	readFileSync('server/data/stageData.json', 'utf8')
);
export let skinData = JSON.parse(
	readFileSync('server/data/skinData.json', 'utf8')
);
export let bonusData = JSON.parse(
	readFileSync('server/data/bonusData.json', 'utf8')
);

const usersData = JSON.parse(
	readFileSync('server/data/userData.json', 'utf-8')
);
usersData.forEach(user => {
	setConnexion(user, false);
});

function setConnexion(user, value) {
	user.connexion = value;
	writeFileSync('server/data/userData.json', JSON.stringify(usersData));
}

io.on('connection', socket => {
	console.log(`New connection: ${socket.id}`);
	socket.on('userLogin', ({ userLogin, password }) => {
		login(userLogin, password, socket.id);
	});
	socket.on('userLogout', login => {
		logout(login, socket.id);
	});
	socket.on('userSignin', ({ login, password, recoverySentence, response }) => {
		signin(login, password, recoverySentence, response, socket.id);
	});
	socket.on('userForgetPassword', ({ login, recoverySentence, response }) => {
		forgetPassword(login, recoverySentence, response, socket.id);
	});
	socket.on('userResetPassword', ({ login, password }) => {
		resetPassword(login, password, socket.id);
	});

	socket.on('setCarousel', user => {
		const playerData = playersData.find(player => player.user === user);
		socket.emit('setCarousel', {
			playerData,
			playerSkins: skinData.playerSkins,
			weaponSkins: skinData.weaponSkins,
		});
	});

	socket.on('gameStart', ({ user, width, height }) => {
		playersData = JSON.parse(
			readFileSync('server/data/playerData.json', 'utf8')
		);
		let game = currentGame.find(game => game.owner === user);
		if (game) return;
		let playerData = playersData.find(player => player.user === user);
		game = new Game(width, height, playerData, socket.id);
		game.startGame();
		currentGame.push(game);
		socket.emit('gameStart', game);
	});

	socket.on('gameJoin', ({ host, user }) => {
		playersData = JSON.parse(
			readFileSync('server/data/playerData.json', 'utf8')
		);
		let game = currentGame.find(game => game.owner === host);
		if (!game) return;
		let playerData = playersData.find(player => player.user === user);
		game.addNewPlayer(playerData, socket.id);
		socket.emit('gameStart', game);
	});

	socket.on('stageChangeEnd', () => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		game.startGame();
	});

	socket.on('playerKeyDown', key => {
		const player = findPlayerBySocketId(socket.id);
		if (!player) return;
		player.onKeyDown(key);
	});

	socket.on('playerKeyUp', key => {
		const player = findPlayerBySocketId(socket.id);
		if (!player) return;
		player.onKeyUp(key);
	});

	socket.on('playerMouseDown', ({ clientX, clientY }) => {
		const player = findPlayerBySocketId(socket.id);
		if (!player) return;
		player.onMouseDown(clientX, clientY);
	});

	socket.on('playerMouseUp', () => {
		const player = findPlayerBySocketId(socket.id);
		if (!player) return;
		player.onMouseUp();
	});

	socket.on('playerMouseMove', ({ clientX, clientY }) => {
		const player = findPlayerBySocketId(socket.id);
		if (!player) return;
		player.onMouseMove(clientX, clientY);
	});

	socket.on('canvasResampled', data => {
		if (currentGame.length === 0) return;
		const game = currentGame.find(game => game.socketId === socket.id);
		if (game) {
			game.width = data.width;
			game.height = data.height;
		}
	});

	socket.on('gameStop', () => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		currentGame = currentGame.filter(game => game.socketId !== socket.id);
	});

	socket.on('disconnect', () => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (game) game.stopGame();
	});

	socket.on('currentSkin', data => {
		setCurrentSkin(data.username, data.skin, data.isProj);
	});

	socket.on('skinsPool', data => {
		setSkinsPool(data.username, data.skin, data.isProj);
	});

	socket.on('stat', data => {
		setStat(data.username, data.value, data.statName);
	});

	socket.on('close', username => {
		setConnexion(
			usersData.find(u => u.login === username),
			false
		);
	});

	socket.on('open', username => {
		setConnexion(
			usersData.find(u => u.login === username),
			true
		);
	});
});

function findPlayerBySocketId(socketId) {
	let player;
	currentGame.forEach(game => {
		if (game.mainPlayer.socketId === socketId) player = game.mainPlayer;
		else {
			game.otherPlayers.forEach(p => {
				if (p.socketId === socketId) player = p;
			});
		}
	});
	return player;
}

addWebpackMiddleware(app);

app.use(express.static('client/public'));

app.get('/*', (req, res) => {
	res.sendFile('client/public/index.html', fileOptions);
});

app.use((req, res) => {
	res.status(404);
	res.send(
		'<img src="https://cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg" style="width: 100%; height: 100%" \\>'
	);
});

let port = process.env.PORT;
if (!port) port = 8000;
httpServer.listen(port, () => {
	console.log(`Server running at http://localhost:${port}/`);
});
