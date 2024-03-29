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
import { data } from 'jquery';
import { setCurrentSkin, setSkinsPool, setStat } from './player/playerDataManager.js';

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

const usersData = JSON.parse(
	readFileSync('server/data/userData.json', 'utf-8')
);
usersData.forEach(user => {
	user.connexion = false;
});
writeFileSync('server/data/userData.json', JSON.stringify(usersData));

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

	socket.on('gameStart', ({ user, width, height }) => {
		playersData = JSON.parse(
			readFileSync('server/data/playerData.json', 'utf8')
		);
		let game = currentGame.find(game => game.user === user);
		if (game) return;
		let playerData = playersData.find(player => player.user === user);
		game = new Game(width, height, playerData, socket.id);
		game.startGame();
		currentGame.push(game);
		socket.emit('gameStart', game);
	});

	socket.on('playerKeyDown', key => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		if (game.mainPlayer.socketId === socket.id) game.mainPlayer.onKeyDown(key);
		else
			game.otherPlayers
				.filter(player => player.socketId === socket.id)
				.forEach(player => player.onKeyDown(key));
	});

	socket.on('playerKeyUp', key => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		if (game.mainPlayer.socketId === socket.id) game.mainPlayer.onKeyUp(key);
		else
			game.otherPlayers
				.filter(player => player.socketId === socket.id)
				.forEach(player => player.onKeyUp(key));
	});

	socket.on('playerMouseDown', ({ clientX, clientY }) => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		if (game.mainPlayer.socketId === socket.id)
			game.mainPlayer.onMouseDown(clientX, clientY);
		else
			game.otherPlayers
				.filter(player => player.socketId === data.socketId)
				.forEach(player => player.onMouseDown(data.x, data.y));
	});

	socket.on('playerMouseUp', () => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		if (game.mainPlayer.socketId === socket.id) game.mainPlayer.onMouseUp();
		else
			game.otherPlayers
				.filter(player => player.socketId === socket.id)
				.forEach(player => player.onMouseUp());
	});

	socket.on('playerMouseMove', ({ clientX, clientY }) => {
		const game = currentGame.find(game => game.socketId === socket.id);
		if (!game) return;
		if (game.mainPlayer.socketId === socket.id)
			game.mainPlayer.onMouseMove(clientX, clientY);
		else
			game.otherPlayers
				.filter(player => player.socketId === socket.id)
				.forEach(player => player.onMouseMove(clientX, clientY));
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
});

addWebpackMiddleware(app);

app.use(express.static('client/public'));

app.get('/:path', (req, res) => {
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
