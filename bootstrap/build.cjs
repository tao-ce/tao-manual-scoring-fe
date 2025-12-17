// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

Promise.all([
    fs.promises.readFile(path.join(__dirname, 'server.tpl.cjs'), 'utf8'),
    fs.promises.readFile(path.join(srcDir, 'index.html'), 'utf8')
])
    .then(([bootstrap, index]) => {
        const resolvedTemplate = bootstrap.replace('{{{index}}}', index);
        fs.writeFile('server.cjs', resolvedTemplate, err => {
            if (err) {
                console.error(err); // eslint-disable-line no-console
                process.exit(-1);
            }
        });
    })
    .catch(e => console.error(e)); // eslint-disable-line no-console
