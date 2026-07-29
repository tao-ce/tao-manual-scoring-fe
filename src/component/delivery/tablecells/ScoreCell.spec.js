// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
jest.mock('module');

import { render } from '@testing-library/svelte';
import ScoreCell from './ScoreCell.svelte';

describe('ScoreCell', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('it renders correctly for scorer', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    outcomeDeclaration: {
                        id: 'OUTCOME_1',
                        interpretation: null,
                        longInterpretation: null,
                        maximumValue: 5,
                        minimumValue: 0,
                        value: null
                    },
                    isReadOnly: false,
                    isAdministrative: false
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
    it('it renders correctly for reviewer', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    outcomeDeclaration: {
                        id: 'OUTCOME_1',
                        interpretation: null,
                        longInterpretation: null,
                        maximumValue: 5,
                        minimumValue: 0,
                        value: 3,
                        previousValues: [2]
                    },
                    isReadOnly: false,
                    isAdministrative: false
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
    it('it renders correctly with scoring scale', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    outcomeDeclaration: {
                        id: 'OUTCOME_1',
                        interpretation: null,
                        longInterpretation: null,
                        maximumValue: 'B2',
                        minimumValue: 0,
                        value: 'A2',
                        previousValues: [2],
                        scoringScale: {
                            scale: {
                                1: 'Under A1',
                                2: 'A1',
                                3: 'A2',
                                4: 'B1',
                                5: 'B2'
                            }
                        }
                    },
                    isReadOnly: false,
                    isAdministrative: false
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
    it('it renders correctly for administrative readonly', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    outcomeDeclaration: {
                        id: 'OUTCOME_1',
                        interpretation: null,
                        longInterpretation: null,
                        maximumValue: 5,
                        minimumValue: 0,
                        value: 3,
                        previousValues: [2]
                    },
                    isReadOnly: true,
                    isAdministrative: true
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
    it('it renders correctly with scoring scale for administrative readonly', () => {
        const { container } = render(ScoreCell, {
            props: {
                data: {
                    outcomeDeclaration: {
                        id: 'OUTCOME_1',
                        interpretation: null,
                        longInterpretation: null,
                        maximumValue: 'B2',
                        minimumValue: 0,
                        value: 'A2',
                        previousValues: [2],
                        scoringScale: {
                            scale: {
                                1: 'Under A1',
                                2: 'A1',
                                3: 'A2',
                                4: 'B1',
                                5: 'B2',
                            }
                        }
                    },
                    isReadOnly: true,
                    isAdministrative: true
                }
            }
        });
        expect(container).toMatchSnapshot();
    });
});
