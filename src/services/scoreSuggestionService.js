// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import request, { getEndpointUrl } from '@/core/apiRequest/apiRequest';

export const getScoringSuggestion = async (taksId, aiKey = null) => {
    if (!aiKey) {
        const postTaskIdForScoringSuggestion = await request(getEndpointUrl('aiScoringSuggestion', { id: taksId }), {
            method: 'POST'
        });
        aiKey = postTaskIdForScoringSuggestion.key;
    }

    const getScoringSuggestionByTask = await request(getEndpointUrl('aiScoringSuggestion', { id: aiKey }), {
        method: 'GET'
    });
    const getData = getScoringSuggestionByTask?.data?.suggestion;
    if (getData?.status !== 'finished') {
        return new Promise(resolve => {
            setTimeout(() => getScoringSuggestion(taksId, aiKey).then(resolve), 3000);
        });
    } else {
        return getData?.suggestedScores[0]?.scores;
    }
};
