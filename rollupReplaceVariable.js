// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
/**
 * Inject variables to file
 * Config:
 *  - file: absolute path of the file
 *  - variables: object that contain variables, that sholud be replaced
 */

import fs from 'fs';

export default ({ file, variables } = {}) => ({
    name: 'inject vars to html',
    writeBundle() {
        return fs.promises.readFile(file, 'utf8').then(content => {
            content = content.toString();
            Object.keys(variables).forEach(variableName => {
                content = content.replace(variableName, variables[variableName]);
            });

            return fs.promises.writeFile(file, content);
        });
    }
});
