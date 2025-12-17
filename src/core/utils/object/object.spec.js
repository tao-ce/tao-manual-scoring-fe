// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { keyById } from './object';

test('keyById should return correct data', () => {
    const users = [
        {
            id: 4,
            createdAt: 1603896052,
            firstName: 'John',
            lastName: 'Doe',
            relatedScoringProjects: ['Test'],
            username: 'john_1'
        },
        {
            id: 6,
            createdAt: 1610717091,
            firstName: 'Jane',
            lastName: 'Doe',
            relatedScoringProjects: ['Test'],
            username: 'jane_1'
        }
    ];
    const expected = {
        4: {
            id: 4,
            createdAt: 1603896052,
            firstName: 'John',
            lastName: 'Doe',
            relatedScoringProjects: ['Test'],
            username: 'john_1'
        },
        6: {
            id: 6,
            createdAt: 1610717091,
            firstName: 'Jane',
            lastName: 'Doe',
            relatedScoringProjects: ['Test'],
            username: 'jane_1'
        }
    };

    const result = keyById(users);
    expect(result).toEqual(expected);
});
