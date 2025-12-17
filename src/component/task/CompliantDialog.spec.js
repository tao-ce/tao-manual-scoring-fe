// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@oat-sa-private/ui-core/dom/dom.js', () => ({
    generateElementId: jest.fn(() => 'tao-option')
}));

import { fireEvent, render } from '@testing-library/svelte';
import ComplaintDialog from './ComplaintDialog';

describe('CompliantDialog', () => {
    it('should render correctly in closed state', () => {
        const props = {
            taskId: 1,
            item: 'Item1',
            scorerName: 'John Doe',
            note: 'Lorem ipsum dolar sit amet',
            open: false
        };

        const { container } = render(ComplaintDialog, props);
        expect(container).toMatchSnapshot();
    });

    it('should render correctly in opened state', () => {
        const props = {
            taskId: 2,
            item: 'Item2',
            scorerName: 'Jane Doe',
            note: 'Lorem ipsum dolar sit amet',
            open: true
        };

        const { container } = render(ComplaintDialog, props);
        expect(container).toMatchSnapshot();
    });

    it('should fire close event', async () => {
        const props = {
            taskId: 1,
            item: 'Item1',
            scorerName: 'John Doe',
            note: 'Lorem ipsum dolar sit amet',
            open: true
        };

        const { component, getByText } = render(ComplaintDialog, props);

        const onClose = jest.fn();
        component.$on('close', onClose);

        const button = getByText('Cancel');
        await button.click();

        expect(onClose).toHaveBeenCalled();
    });

    it('should fire action event', async () => {
        const props = {
            taskId: 1,
            item: 'Item1',
            scorerName: 'John Doe',
            note: 'Lorem ipsum dolar sit amet',
            open: true
        };

        const { container, component, getByText } = render(ComplaintDialog, props);

        const onAction = jest.fn();
        component.$on('action', onAction);

        const textArea = container.querySelector('textarea[name=complaint-note]');
        await fireEvent.input(textArea, { target: { value: 'test note' } });

        const button = getByText('Report and continue');
        await button.click();

        expect(onAction).toHaveBeenCalled();
    });
});
