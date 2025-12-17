// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import cleaner from 'rollup-plugin-cleaner';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import i18n from '@oat-sa/tao-i18n-tools/src/rollup/i18n.js';
import svg from 'rollup-plugin-svg';
import dynamicImportVariables from 'rollup-plugin-dynamic-import-variables';

import svelteConfig from './svelte.config.js';
import postCssConfig from './postcss.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = process.env.NODE_ENV === 'production';
const srcDir = path.resolve(__dirname, 'src');
const distDir = path.resolve(__dirname, 'dist');
const staticDir = path.resolve(__dirname, 'static');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');

export default [
    {
        input: 'src/index.js',
        output: [
            {
                name: 'manualscoring',
                format: 'es',
                dir: distDir,
                sourcemap: true,
                chunkFileNames: 'chunks/chunk-[name].js',
                inlineDynamicImports: false,
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            }
        ],
        context: 'window',
        preserveEntrySignatures: false,
        plugins: [
            prod &&
                i18n({
                    exclude: ['**/node_modules/**'],
                    include: [
                        './src/**/*',
                        '**/node_modules/@oat-sa-private/ui-components/loading/**',
                        '**/node_modules/@oat-sa-private/ui-components/dateTimePicker/**',
                        '**/node_modules/@oat-sa-private/ui-components/livesave/**',
                        '**/node_modules/@oat-sa-private/ui-components/scoringInput/**',
                        '**/node_modules/@oat-sa-private/ui-elements/radiogroup/**',
                        '**/node_modules/@oat-sa-private/ui-elements/textarea/**'
                    ],
                    output: path.join(srcDir, 'locale', 'messages.pot')
                }),
            svelte(svelteConfig),
            postcss(postCssConfig),
            json({
                namedExports: false
            }),
            svg(),
            dynamicImportVariables(),
            alias({
                resolve: ['.svelte', '.js', '.css'],
                entries: [
                    { find: '@', replacement: srcDir },
                    { find: 'module', replacement: path.join(srcDir, 'module.js') },
                    { find: 'core/moduleLoader', replacement: path.resolve(srcDir, 'core', 'moduleLoader') },
                    {
                        find: 'core',
                        replacement: path.resolve(nodeModulesDir, '@oat-sa', 'tao-core-sdk', 'src', 'core')
                    },
                    {
                        find: 'util',
                        replacement: path.resolve(nodeModulesDir, '@oat-sa', 'tao-core-sdk', 'src', 'util')
                    },
                    { find: 'lib', replacement: path.resolve(nodeModulesDir, '@oat-sa', 'tao-core-libs', 'src') },
                    { find: /.\/ckeditor.js$/, replacement: path.join(srcDir, 'module.js') }
                ]
            }),
            resolve({
                browser: true,
                exportConditions: ['svelte'],
                extensions: ['.svelte', '.js', '.css'],
                preferBuiltins: false,
                dedupe: ['svelte', '@oat-sa-private/ui-core']
            }),
            commonjs(),
            babel({
                extensions: ['.js', '.mjs', '.html', '.svelte'],
                exclude: /node_modules[/\\](?!(svelte|@ckeditor|@oat-sa|@oat-sa-private)[/\\]).*/,
                babelHelpers: 'bundled'
            }),
            prod && terser(),
            cleaner({
                targets: [distDir]
            }),
            copy({
                targets: [
                    {
                        src: path.resolve(nodeModulesDir, '@oat-sa-private', 'ui-identity', 'dist', 'fonts'),
                        dest: distDir
                    },
                    {
                        src: path.resolve(staticDir, '*'),
                        dest: distDir
                    }
                ]
            })
        ],
        onwarn(warning, next) {
            // Silence pdf.js warning: "Use of eval is strongly discouraged"
            if (warning.code === 'EVAL' && warning.id.includes('pdf.js')) {
                return;
            }

            // keep original warning handler
            next(warning);
        }
    },
    {
        input: 'node_modules/@oat-sa/browser-support-checker/dist/checker.js',
        output: {
            file: path.join(distDir, 'scripts', 'checker.js'),
            format: 'iife'
        }
    }
];
