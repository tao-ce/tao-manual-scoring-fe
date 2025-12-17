// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { render } from '@testing-library/svelte';
import ScoringCriteria from './ScoringCriteria.svelte';

describe('ScoringCriteria', () => {
    it('scoring criteria renders correctly with no data', () => {
        const { container } = render(ScoringCriteria);

        expect(container).toMatchSnapshot();
    });
});
