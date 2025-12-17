// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const loggerFactory = () => ({
    child: loggerFactory,
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    trace: jest.fn()
});

export default loggerFactory;
