// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2022-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { render } from '@testing-library/svelte';
import LtiSubmitted from './+page.svelte';

describe('Lti Submitted', () => {
    it('renders correctly', () => {
        const { container } = render(LtiSubmitted);
        expect(container).toMatchSnapshot();
    });
});
