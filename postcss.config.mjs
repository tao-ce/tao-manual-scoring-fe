// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import path from 'path';
import { fileURLToPath } from 'url';
import postcssImport from 'postcss-import';
import postcssNormalize from 'postcss-normalize';
import postcssMixins from 'postcss-mixins';
import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins = [
    postcssImport(
        postcssNormalize().postcssImport({
            from: path.join(__dirname, 'css')
        })
    ),
    postcssMixins({
        mixinsDir: path.resolve(__dirname, 'node_modules', '@oat-sa-private', 'ui-identity', 'css', 'mixins')
    }),
    /**
     * PostCSS preset-env Stage 1
     * @see https://preset-env.cssdb.org/features#stage-1
     * includes:
     * - automatic browserslist config
     * - autoprefixer
     * - nesting rules
     * - custom properties
     * - :not() selector
     * and more...
     */
    postcssPresetEnv({
        stage: 1,
        importFrom: [
            path.join(
                __dirname,
                'node_modules',
                '@oat-sa-private',
                'ui-identity',
                'css',
                'abstracts',
                '_breakpoints.css'
            )
        ],
        features: {
            'focus-within-pseudo-class': false,
            'focus-visible-pseudo-class': false,
            'custom-properties': false
        }
    })
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(cssnano());
}

export default {
    map: true,
    plugins
};
