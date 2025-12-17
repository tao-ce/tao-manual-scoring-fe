// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

export default jest.fn().mockResolvedValue();

export const getEndpointUrl = jest.fn().mockResolvedValue();

export const jwtTokenHandler = {
    clearStore: jest.fn().mockResolvedValue(),
    getEndpointUrl: jest.fn().mockResolvedValue(),
    storeAccessToken: jest.fn().mockResolvedValue(),
    storeRefreshToken: jest.fn().mockResolvedValue(),
    // A dummy JWT with `tenant_id` in the body
    getToken: jest.fn().mockResolvedValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiJ0ZW5hbnRJZCJ9.7k4GPBCd7q_qX4jIcpu5ObOczdfcG3S5FQJmun2cWUw')
};
