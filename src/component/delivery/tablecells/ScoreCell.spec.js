// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');

import { render } from '@testing-library/svelte';
import ScoreCell from './ScoreCell.svelte';

describe('ScoreCell', () => {
    it('it renders correctly for scorer', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    id: 'OUTCOME_1',
                    interpretation: null,
                    longInterpretation: null,
                    maximumValue: 5,
                    minimumValue: 0,
                    value: null
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
    it('it renders correctly for reviewer', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    id: 'OUTCOME_1',
                    interpretation: null,
                    longInterpretation: null,
                    maximumValue: 5,
                    minimumValue: 0,
                    value: 3,
                    previousValues: [2]
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
});
