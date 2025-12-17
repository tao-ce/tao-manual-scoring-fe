// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@oat-sa-private/ui-core/dom/dom.js', () => ({
    generateElementId: () => 'input-id'
}));

import { render } from '@testing-library/svelte';
import CompliantNote from './CompliantNote';

describe('CompliantNote', () => {
    it('should render correctly', () => {
        const props = {
            note: 'Lotem ipsum dolar sit amet',
            itemTitle: 'Question 1',
            scorerName: 'John doe',
            scorerUsername: 'john_doe_1'
        };
        const { container } = render(CompliantNote, props);

        expect(container).toMatchSnapshot();
    });

    it('should show popup', async () => {
        const props = {
            note: 'Lotem ipsum dolar sit amet',
            itemTitle: 'Question 1',
            scorerName: 'John doe',
            scorerUsername: 'john_doe_1'
        };
        const { container, getByText } = render(CompliantNote, props);
        const button = getByText('Reported for non-compliance');

        await button.click();

        expect(container).toMatchSnapshot();
    });
});
