// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

export default (controllerObject) => Object.assign({
    destroyed: false,
    component: {
        $set: jest.fn(),
        $on: jest.fn(),
        $destroy: jest.fn()
    },
    setPageTitle: jest.fn(),
    mount: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn().mockImplementation(function () {
        this.component.$destroy();
        this.destroyed = true;
    }),
    logout: jest.fn().mockResolvedValue(void 0)
}, controllerObject);