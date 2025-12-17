// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import * as userConfigurationService from './userConfigurationService';

describe('User config service', () => {
    it('get config without setting', () => {
        expect(userConfigurationService.getConfig()).toEqual(userConfigurationService.DEFAULT_USER_CONFIG);

        userConfigurationService.setConfig();
        expect(userConfigurationService.getConfig()).toEqual(userConfigurationService.DEFAULT_USER_CONFIG);
    });

    it('set and get config', () => {
        const config1 = {
            isSuggestedScoringEnabled: true,
            isMarkAsSuspiciousForCheatingEnabled: true
        };
        const config2 = {
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: false
        };
        userConfigurationService.setConfig(config1);
        expect(userConfigurationService.getConfig()).toEqual(config1);

        userConfigurationService.setConfig(config2);
        expect(userConfigurationService.getConfig()).toEqual(config2);
    });
});
