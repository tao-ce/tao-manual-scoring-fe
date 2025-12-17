// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
jest.mock('module');

import { render } from '@testing-library/svelte';
import TaskHeader from './TaskHeader.svelte';

describe('TaskHeader', () => {
    it('renders correctly', () => {
        const { container } = render(TaskHeader);
        expect(container).toMatchSnapshot();
    });

    it('shows back button based on property', () => {
        const { container } = render(TaskHeader, {
            showBackButton: false
        });

        expect(container.getElementsByClassName('back-button').length).toBe(0);
    });

    it('shows back breadcrumbs based on property', () => {
        const { container } = render(TaskHeader, {
            taskHeaderBreadcrumbItems: [ { label: 'test', href: 'https://example.com' }, { label: 'item' } ]
        });

        expect(container.querySelector('.breadcrumbs')).toMatchSnapshot();
    });

    it('sets correct label after LTI launch', () => {
        const { getByLabelText } = render(TaskHeader, {
            isLTI: true
        });

        expect(getByLabelText('Back')).not.toBeNull();
    });

    describe('Highlighter', () => {
        it('highlighter rendered by default', () => {
            const { queryByTitle } = render(TaskHeader);

            const toggleHighlighterButton = queryByTitle('Show highlighter');
            expect(toggleHighlighterButton).toBeInTheDocument();
        });
    });
});
