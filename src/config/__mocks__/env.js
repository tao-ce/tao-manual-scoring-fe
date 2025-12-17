// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

export default variableName => {
    const environmentConfig = {
        API_URL: 'http://example.com',
        TENANT_ID: 'construct-1',
        REFRESH_TOKEN_URI: '/api/v1/refresh-tokens'
    };

    return environmentConfig[variableName];
};
