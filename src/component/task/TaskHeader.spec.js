// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
jest.mock('module');

import { fireEvent, render } from '@testing-library/svelte';
import TaskHeader from './TaskHeader.svelte';
import { highlighterToolStore, markingSymbolsToolStore, resetAllToolStores } from '@/store/deliverToolsStore.js';

describe('TaskHeader', () => {
    beforeEach(() => {
        highlighterToolStore.set({
            installed: true,
            disabled: false
        });
        markingSymbolsToolStore.set({
            installed: true,
            disabled: false
        });
    });
    afterAll(() => {
        resetAllToolStores();
    });

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

    it('shows Send scores button as disabled when isReadOnly as true', () => {
        const { container } = render(TaskHeader, {
            isReadOnly: true
        });

        expect(container.querySelector('.pill')).toBeDisabled();
    });

    it('shows Send scores button as enabled when isReadOnly as false and isScoringCompleted as true', () => {
        const { container } = render(TaskHeader, {
            isReadOnly: false,
            isScoringCompleted: true
        });

        expect(container.querySelector('.pill')).not.toBeDisabled();
    });

    it('shows back breadcrumbs based on property', () => {
        const { container } = render(TaskHeader, {
            taskHeaderBreadcrumbItems: [{ label: 'test', href: 'https://example.com' }, { label: 'item' }]
        });

        expect(container.querySelector('.breadcrumbs')).toMatchSnapshot();
    });

    it('sets correct label after LTI launch', () => {
        const { getByLabelText } = render(TaskHeader, {
            isLTI: true
        });

        expect(getByLabelText('Back')).not.toBeNull();
    });

    it('exits directly when back button is clicked without unsaved changes', async () => {
        const onExit = jest.fn();
        const { getByLabelText } = render(TaskHeader, {
            onExit,
            hasUnsavedChanges: false
        });

        await fireEvent.click(getByLabelText('Back'));

        expect(onExit).toHaveBeenCalledWith('');
    });

    it('opens exit dialog when back button is clicked with unsaved changes', async () => {
        const onExit = jest.fn();
        const { getByLabelText, getByText } = render(TaskHeader, {
            onExit,
            hasUnsavedChanges: true
        });

        await fireEvent.click(getByLabelText('Back'));

        expect(onExit).not.toHaveBeenCalled();
        expect(getByText('Are you sure you want to leave?')).toBeInTheDocument();
    });

    describe('Tool buttons', () => {
        it('renders tool buttons when installed', () => {
            const { queryByTitle, queryByLabelText } = render(TaskHeader);

            expect(queryByTitle('Show highlighter')).toBeInTheDocument();
            expect(queryByTitle('Show highlighter')).not.toBeDisabled();
            expect(queryByLabelText('Marking symbols')).toBeInTheDocument();
            expect(queryByLabelText('Marking symbols')).not.toBeDisabled();
        });

        it('renders tool buttons as disabled', () => {
            highlighterToolStore.set({
                installed: true,
                disabled: true
            });
            markingSymbolsToolStore.set({
                installed: true,
                disabled: true
            });
            const { queryByTitle, queryByLabelText } = render(TaskHeader);

            expect(queryByTitle('Show highlighter')).toBeInTheDocument();
            expect(queryByTitle('Show highlighter')).toBeDisabled();
            expect(queryByLabelText('Marking symbols')).toBeInTheDocument();
            expect(queryByLabelText('Marking symbols')).toBeDisabled();
        });

        it('renders no tools buttons when not installed', () => {
            highlighterToolStore.set({
                installed: false
            });
            markingSymbolsToolStore.set({
                installed: false
            });
            const { queryByTitle, queryByLabelText } = render(TaskHeader);

            expect(queryByTitle('Show highlighter')).not.toBeInTheDocument();
            expect(queryByLabelText('Marking symbols')).not.toBeInTheDocument();
        });
    });
});
