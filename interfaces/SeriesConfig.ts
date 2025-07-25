import path from 'path';

export interface SeriesConfig {
    name: string;
    fixturePrefix: string;
    totalImages: number;
    fixturePath: string;
}

export const SERIES_CONFIG: SeriesConfig[] = [
    {
        name: 'Series 1',
        fixturePrefix: 'series_1',
        totalImages: 7,
        fixturePath: path.resolve('fixture', 'series1')
    },
    {
        name: 'Series 2',
        fixturePrefix: 'series_2',
        totalImages: 6,
        fixturePath: path.resolve('fixture', 'series2')
    }
]; 