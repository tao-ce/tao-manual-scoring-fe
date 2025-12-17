// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');

import { render } from '@testing-library/svelte';
import TotalScoreCell from './TotalScoreCell.svelte';

describe('TotalScoreCell', () => {
    it('renders correctly when not scored', () => {
        const { container } = render(TotalScoreCell, {
            props: {
                data: {
                    isScored: false,
                    totalScore: {
                        maximumValue: 5,
                        value: 0
                    }
                }
            }
        });
        expect(container).toMatchSnapshot();
    });

    it('renders correctly when scored', () => {
        const { container } = render(TotalScoreCell, {
            props: {
                data: {
                    isScored: true,
                    totalScore: {
                        maximumValue: 5,
                        value: 4
                    }
                }
            }
        });
        expect(container).toMatchSnapshot();
    });

    it('renders correctly when scored and with 0 value', () => {
        const { container } = render(TotalScoreCell, {
            props: {
                data: {
                    isScored: true,
                    totalScore: {
                        maximumValue: 5,
                        value: 0
                    }
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
});
