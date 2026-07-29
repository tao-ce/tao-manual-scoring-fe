// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import { writable } from 'svelte/store';

const initialStoreValues = {
    highlighter: {
        installed: false, // show or hide toolbar button
        disabled: false, // enable or disable toolbar button
        open: false // track panel state
    },
    inlineComments: {
        installed: true,
        disabled: false // influences how LTI claim should be built
        // it has no panel to open
    },
    markingSymbols: {
        installed: false, // show or hide toolbar button
        disabled: false, // enable or disable toolbar button
        open: false // track panel state
    }
};

export const highlighterToolStore = writable({ ...initialStoreValues.highlighter });
export const inlineCommentsToolStore = writable({ ...initialStoreValues.inlineComments });
export const markingSymbolsToolStore = writable({ ...initialStoreValues.markingSymbols });

export const resetAllToolStores = () => {
    highlighterToolStore.set({ ...initialStoreValues.highlighter });
    inlineCommentsToolStore.set({ ...initialStoreValues.inlineComments });
    markingSymbolsToolStore.set({ ...initialStoreValues.markingSymbols });
};
