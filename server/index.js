import http from 'http';
import express from 'express';
import addWebpackMiddleware from './middlewares/addWebpackMiddleware.js';
import { Server as IOServer } from 'socket.io';
import { readFileSync, writeFileSync } from 'fs';

import connexionManager from './managers/connexionManager.js';
import controllerManager from './managers/controllerManager.js';
import gameManager from './managers/gameManager.js';
import playerManager from './managers/playerManager.js';

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
	setConnexion(user, false);
});

function setConnexion(user, value) {
	user.connexion = value;
	writeFileSync('server/data/userData.json', JSON.stringify(usersData));
}

io.on('connection', socket => {
	console.log(`New connection: ${socket.id}`);

	connexionManager(socket);

	controllerManager(socket, currentGame);

	gameManager(socket, currentGame, playersData);

	playerManager(socket, skinData);
});

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
