// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const path = require('path');
const { glob } = require('glob');
const fs = require('fs');
const gettextParser = require('gettext-parser');

const input = path.join(__dirname, '../src/locale/**/messages.po');

glob(input).then(files => {
    files.forEach(file => {
        const localeMatch = file.match(/locale\/(.+)\/messages/);
        const locale = localeMatch && localeMatch[1];
        if (!locale) {
            //eslint-disable-next-line no-console
            console.warn(`Cannot parse locale for ${file}`);
            return;
        }

        const messagesPoFile = fs.readFileSync(file);
        const { translations } = gettextParser.po.parse(messagesPoFile);

        const messages = {};
        Object.values(translations['']).forEach(({ msgid, msgstr }) => {
            if (msgid) {
                messages[msgid] = msgstr[0];
            }
        });

        fs.writeFile(file.replace(/\.po$/, '.json'), JSON.stringify(messages, null, '\t'), writeError => {
            if (writeError) {
                throw writeError;
            }
        });
    });
});
