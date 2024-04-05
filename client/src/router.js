import $ from 'jquery';
import { socket, user } from './main.js';
import { canvas, stopGameRenderer } from './game/renderGame.js';

export default class Router {
	static routes = [];
	static notFound;
	static currentRoute;
	static connexionRoutes = [];

	static #setInnerLinks;

	static setInnerLinks(setInnerLinks) {
		this.#setInnerLinks = setInnerLinks;
		$('.innerLink', this.#setInnerLinks).on('click', event => {
			event.preventDefault();
			const link = $(event.currentTarget);
			if(link.attr('host')){
				Router.navigate($(event.currentTarget).attr('href'), false, link.attr('host'));
			}else{
				Router.navigate($(event.currentTarget).attr('href'));
			}
		});
	}

	static navigate(path, skipPushState = false, hote = null) {
		let route = this.routes.find(route => route.path === path);
		if (user && this.connexionRoutes.includes(route?.path)) {
			route = this.routes.find(route => route.path === '/');
		}
		if (route) {
			this.notFound.hide();
			if (this.currentRoute) {
				this.currentRoute.view.hide();
			}
			this.currentRoute = route;
			route.view.show();
			if (route.path === '/jeu') {
				if(hote){
					socket.emit('gameJoin', {
						host: hote,
						user: window.sessionStorage.getItem('user'),
					});
				}else{
					socket.emit('gameStart', {
						width: canvas.width,
						height: canvas.height,
						user: window.sessionStorage.getItem('user'),
					});
				}
			} else {
				stopGameRenderer();
				socket.emit('gameStop');
			}
			if (!skipPushState) {
				window.history.pushState(null, null, route.path);
			}
		} else {
			this.notFound.show();
		}
	}
}
