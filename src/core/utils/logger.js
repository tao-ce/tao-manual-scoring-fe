// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Logger abstraction, consider the replace it with https://github.com/pimterry/loglevel or similar lib
 */
export const log = {
    /* eslint-disable no-console */
    error: console.error,
    log: console.log,
    warn: console.warn
};
