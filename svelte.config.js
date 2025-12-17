// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import sveltePreprocess from 'svelte-preprocess';

export default {
    compilerOptions: {
        dev: process.env.NODE_ENV !== 'production'
    },
    preprocess: sveltePreprocess({
        postcss: true
    })
};
