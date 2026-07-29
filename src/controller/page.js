// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import router from '@/core/router';
import { __ } from '@oat-sa-private/ui-core';
import jwtTokenRegistry from 'core/jwt/jwtTokenRegistry';
import config from '@/config';
import { useRoute } from '../core/utils';
import * as analyticsService from '@/services/analyticsService';
import CookiePolicyWrapper from '@/component/CookiePolicyWrapper/CookiePolicyWrapper.svelte';

import { JWT_TOKEN_HANDLER_SERVICE_NAME } from '@/constants/jwtToken.js';

let container;

/**
 * The provided controller object will be extended with page controller properties and methods.
 * If property or method exists in controller - it will override default one.
 * Usage:
 *  import pageController from 'controller/page';
 *  const controller = pageController(controller, {
 *      foo() {
 *          // in controller functions, page controller functions are available
 *          this.router();
 *      }
 *  });
 *
 * @param {Object} controller - controller object that should be extended
 * @returns {Object} controller object that is extended with page controller functions.
 */
export default controller =>
    Object.assign({
        /**
         * Flag defining if component has been destroyed
         */
        destroyed: false,

        /**
         * Getter of page container
         * @returns {Element} Page container element
         */
        get container() {
            return container || (container = document.querySelector('#page'));
        },

        /**
         * @readonly
         * @returns {Object} Router instance
         * Router object
         */
        get router() {
            return router;
        },
        /**
         * @readonly
         * @type {import('@/core/utils/route').RouteObject}
         * Current route object
         */
        get route() {
            return useRoute();
        },

        setPageTitle(title) {
            document.title = __('%s - Manual Scoring', title);
            const pageTitle = document.getElementById('page-title');
            pageTitle.innerText = title;
        },

        /**
         * Common prepare function before controller starts
         */
        prepare() {
            this.container.classList.add(this.name);
        },

        /**
         * Common clean function after controller stopped
         */
        clean() {
            const pageContainer = this.container;
            pageContainer.classList.remove(this.name);
        },

        /**
         * Logout event handler
         * @returns {Promise<void>}
         */
        logout() {
            return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
                .clearStore()
                .then(() => {
                    analyticsService.logout();
                    this.router.redirect(config.routes.login);
                })
                .catch(response => console.error(response.message)); // eslint-disable-line no-console
        },

        /**
         * Shows a feedback for a limited amount of time
         * @param {string}status
         * @param {string} message
         */
        showFeedback(status, message) {
            this.component.$set({ feedback: { status, message } });
        },
        /**
         * 
         * @param {Object} Component - Svelte component constructor
         * @param {any} [props] - component props
         */
        mount(Component, props) {
            this.component = new Component({
                target: this.container,
                props
            });
        },
        /**
         * Mounts the CookiePolicyWrapper component
         */
        mountCookiePolicyWrapper() {
            this.cookiePolicyWrapper = new CookiePolicyWrapper({
                target: this.container
            });
        },
        /**
         * Updates page component with props
         * @param {Object} props - props to pass and update the component
         */
        update(props) {
            if (this.component && !this.destroyed) {
                this.component.$set(props);
            }
        },
        /**
         * Destroy the component
         */
        destroy() {
            this.destroyed = true;
            if (this.component) {
                this.component.$destroy();
            }
        },
        /**
         * Function to be called directly in router to avoid any rewriting for default hooks
         */
        destroyAdditionalComponents() {
            if (this.cookiePolicyWrapper) {
                this.cookiePolicyWrapper.$destroy();
            }
        }
    }, controller);
