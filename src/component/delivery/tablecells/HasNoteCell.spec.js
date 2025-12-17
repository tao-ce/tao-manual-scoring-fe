// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');

import { render } from '@testing-library/svelte';
import HasNoteCell from './HasNoteCell.svelte';

describe('HasNoteCell', () => {
    it('it renders correctly', () => {
        const { container } = render(HasNoteCell, {
            props: {
                data: 'This is a dummy note'
            }
        });
        expect(container).toMatchSnapshot();
    });
});
