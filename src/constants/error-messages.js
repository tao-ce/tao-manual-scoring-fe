// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import {__} from "@oat-sa-private/ui-core";
import { ERROR_CODES } from './error-codes';

export const ERROR_MESSAGES = {
    INTERRUPTED_BY_ADMIN: __(
        'This scoring session has been interrupted because the test taker’s session was reopened by an administrator. Please go back and restart scoring.'
    ),

    INTERRUPTED_BY_UNKNOWN_REASONS: __(
        'We encountered an issue. Please try again. If the problem persists, contact our support team for assistance.'
    ),
};

export const FINAL_MESSAGES = {
    [ERROR_CODES.NO_TASKS_TO_SCORE]: {
        title: __(
            'Nothing left to score.'
        ),
        description: __(
            'All scores have already been submitted.'
        ),
    },
    'default': {
        title: __(
            'Scoring not available.'
        ),
        description: __(
            'Please contact your system administrator'
        ),
    }
};