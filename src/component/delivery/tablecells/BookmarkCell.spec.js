// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');

import { render } from '@testing-library/svelte';
import BookmarkCell from './BookmarkCell.svelte';

describe('BookmarkCell', () => {
    it('it renders correctly with bookmarked state', () => {
        const { container } = render(BookmarkCell, {
            props: {
                data: true
            }
        });
        expect(container).toMatchSnapshot();
    });

    it('it renders correctly with not bookmarked state', () => {
        const { container } = render(BookmarkCell, {
            props: {
                data: false
            }
        });
        expect(container).toMatchSnapshot();
    });
});
