// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env');
jest.mock('../../component/LaunchPage/LaunchPage');

import launchControllerFactory from './launch';
import LaunchPage from '../../component/LaunchPage/LaunchPage';

describe('Launch controller for LTI', () => {
    it('controller is a factory', () => {
        expect(typeof launchControllerFactory).toBe('function');
        expect(launchControllerFactory()).not.toBe(launchControllerFactory());
    });

    it('renders correctly component', async () => {
        const launchController = launchControllerFactory();

        launchController.target = null;

        Object.defineProperty(window, 'location', {
            writable: true,
            value: {
                pathname: `/launch`,
                search: 'session_token=12341234'
            }
        });

        await launchController.start();

        expect(LaunchPage).toHaveBeenCalledWith({
            target: null,
            props: {
                sessionToken: '12341234'
            }
        });
    });
});
