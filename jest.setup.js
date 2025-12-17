// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
global.fetch = fetchMock;

Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn()
});
jest.mock('@oat-sa-private/ui-elements/richTextEditor/ckeditor.js', () => ({
    __esModule: true,
    default: {
        builtinPlugins: {
            push: jest.fn(() => {})
        },
        create: jest.fn().mockImplementation(() =>
            // eslint-disable-next-line
            Promise.resolve({
                model: {
                    document: {
                        on: jest.fn(() => {})
                    }
                },
                editing: {
                    view: {
                        document: {
                            on: jest.fn(() => {})
                        }
                    }
                },
                ui: {
                    element: {
                        style: {}
                    }
                },
                setData: jest.fn(() => {}),
                destroy: jest.fn().mockImplementation(() => Promise.resolve('success'))
            })
        )
    }
}));
