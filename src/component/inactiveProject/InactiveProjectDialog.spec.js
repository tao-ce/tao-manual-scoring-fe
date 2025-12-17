// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env');

import { render, fireEvent } from '@testing-library/svelte';
import InactiveProjectDialog from './InactiveProjectDialog.svelte';

const props = { open: true };

jest.mock('@oat-sa-private/ui-core/dom/dom.js', () => ({
    generateElementId: id => id
}));

describe('InactiveProjectDialog', () => {
    it('it renders correctly', () => {
        const { container } = render(InactiveProjectDialog, { props });
        expect(container).toMatchSnapshot();
    });

    it('it fires events by clicking on `Ok` button', async () => {
        const { getByText, component } = render(InactiveProjectDialog, { props });

        const button = getByText('Ok');

        const spy = jest.fn();
        component.$on('confirm-inactive', spy);

        expect(spy).toHaveBeenCalledTimes(0);

        await fireEvent.click(button);

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
