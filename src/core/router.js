// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2026 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { match } from 'path-to-regexp';
import * as analyticsService from '@/services/analyticsService';
import env from '@/config/env';

/**
 * Global router using the history API to dispatch the URL to mapped routes.
 *
 * Routes are defined in config.
 * Controllers must be written, as a string parameter of the import,
 * due to webpack's static parsing of import()
 *
 */
const router = {
    /**
     * Table which consists all the possible routes in our app.
     * @type {import('./routingTable').Route[]}
     */
    routingTable: null,

    /**
     * Contains active controller instance
     */
    activeController: null,

    /**
     * Dispatch the router based on a URL.
     * The path will be used for the route and the parameters will be extracted.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
     * @param {string} url - the URL to dispatch
     * @param {string} [base] - the base URL
     * @throws {TypeError} if the URL is not correct (DOM requirements)
     * @returns {Promise}
     */
    dispatchURL(url, base) {
        try {
            const parsedUrl = new URL(url, base || window.location.href);
            const parameters = Array.from(parsedUrl.searchParams.entries()).reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
            analyticsService.urlChange();
            const namespace = env('APP_NAMESPACE');
            const pathName = namespace?.length 
                ? parsedUrl.pathname.replace(namespace, '')
                : parsedUrl.pathname;
            return this.dispatch(pathName, parameters);
        } catch (err) {
            throw new TypeError(`Invalid URL to dispatch :'${url}' (${err.message})`);
        }
    },

    /**
     * Dispatch the given route
     * @param {string} path - an internal route
     * @param {Object} parameters - parameters to be given to the controller
     * @returns {Promise}
     */
    dispatch(path, parameters = {}) {
        const currentRoute = this.routingTable.find(route => {
            if (match(route.path)(path)) {
                return route;
            }
        });

        const next = () =>
            currentRoute.controller().then(({ default: controllerFactory }) => {
                if (typeof controllerFactory === 'function') {
                    return this.startController(controllerFactory(), parameters);
                }
            });

        if (typeof currentRoute.guard === 'function') {
            return currentRoute.guard(next, this);
        }

        return next();
    },

    /**
     * Prepare and start the provided controller
     * @param {PageController} controller
     * @param {Object} [parameters] - parameters to be given to the controller
     */
    async startController(controller, parameters = {}) {
        if (this.activeController) {
            this.stopActiveController();
        }

        this.activeController = controller;
        controller.prepare();
        controller.mountCookiePolicyWrapper();
        await controller.start(parameters);
    },

    /**
     * Stop controller and clean container
     */
    stopActiveController() {
        this.activeController.destroy();
        this.activeController.destroyAdditionalComponents();
        this.activeController.clean();
        this.activeController = null;
    },

    /**
     * Replace state
     * @param {object|string} state - History state object or URL
     * @param {boolean} dispatch - if need to dispatch the URL
     * @returns {string|undefined}
     */
    replace(state, dispatch = true) {
        if (typeof state === 'string') {
            state = {
                url: state
            };
        }

        window.history.replaceState(state, state.title, `${window.location.origin}${state.url}`);

        if (dispatch) {
            return this.dispatchURL(state.url);
        }
    },

    /**
     * Push state
     * @param {object|string} state - History state object or URL
     * @returns {string}
     */
    redirect(state) {
        if (typeof state === 'string') {
            state = {
                url: state
            };
        }

        window.history.pushState(state, state.title, `${window.location.origin}${state.url}`);
        return this.dispatchURL(state.url);
    },

    /**
     * History pop state event handler
     */
    onPopState() {
        router.dispatchURL(window.location.href);
    },

    /**
     * Entry point of the router that will start event listeners and check actual route
     * @param {import('./routingTable').Route[]} routingTable - returns a controller
     * @returns {Promise}
     */
    start(routingTable) {
        this.routingTable = routingTable;
        //back & forward button, and push state
        window.addEventListener('popstate', this.onPopState);

        return this.dispatchURL(window.location.href);
    },

    /**
     * Stop router event listeners
     */
    stop() {
        window.removeEventListener('popstate', this.onPopState);
    }
};

export default router;
