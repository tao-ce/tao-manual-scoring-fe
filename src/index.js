// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { routingTable, router } from '@/core';
import { locale } from '@/core/utils';
import { __ } from '@oat-sa-private/ui-core';
import '@oat-sa-private/ui-identity/css/main.css';
import packageJson from '../package.json';
import { log } from './core/utils';
import './locale/beMessages';

window.__VERSION = packageJson.version;

__.setDictionaryLoader(localeCode =>
    import(`./locale/${localeCode}/messages.json`).then(dictionaryModule => dictionaryModule.default)
);

async function start() {
    try {
        const localeCode = await locale.getStoredCode();
        locale.setApplicationLocale(localeCode);
        locale.setLangAttribute(localeCode);
    } catch (error) {
        log.error(error);
    }

    await router.start(routingTable);
}

start();
