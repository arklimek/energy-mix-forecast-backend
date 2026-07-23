import { Router } from 'express';

import {
    fetchGenerationMix,
    formatDate,
    addDays,
    cleanEnergySources,
} from './functions.js';

import type {
    GenerationDate,
    EnergyMixResult,
    GenerationMix
} from './functions.js';


export function categorizeByDay(input: GenerationDate[]): EnergyMixResult[] {
    const days: Record<string, GenerationMix[]> = {};
    const result: EnergyMixResult[] = [];

    for (const a of input) {
        const date = a.from.slice(0, 10);

        if (!days[date]) {
            days[date] = [];
        }

        days[date].push(...a.generationmix);
    }

    for (const date in days) {
        const dayMix = days[date];
        if (!dayMix) continue; // zabezpieczenie - w praktyce zawsze istnieje, ale TS tego nie wie

        const stats: Record<string, { sum: number; count: number }> = {};
        const averageMix: Record<string, number> = {};
        let cleanEnergyPercentage = 0;

        for (const mix of dayMix) {
            if (!stats[mix.fuel]) {
                stats[mix.fuel] = { sum: 0, count: 0 };
            }

            const fuelStats = stats[mix.fuel];
            if (!fuelStats) continue; // zabezpieczenie

            fuelStats.sum += mix.perc;
            fuelStats.count++;
        }

        for (const fuel in stats) {
            const fuelStats = stats[fuel];
            if (!fuelStats) continue;

            averageMix[fuel] = Number((fuelStats.sum / fuelStats.count).toFixed(1));
        }

        for (const fuel of cleanEnergySources) {
            cleanEnergyPercentage += averageMix[fuel] ?? 0;
        }

        result.push({ date, averageMix, cleanEnergyPercentage });
    }

    return result;
}

export const generationMixRouter = Router();

generationMixRouter.get('/api/generation-mix', async (_req, res) => {
    try {
        const dzisiaj = addDays(new Date(), 0);
        const koniec = addDays(dzisiaj, 2);

        const intervals = await fetchGenerationMix(formatDate(dzisiaj), formatDate(koniec));
        const days = categorizeByDay(intervals);

        res.json({ days });
    }
    catch (err) {
        res.status(502).json({ error: 'Nie udało się pobrać danych z zewnętrznego API' });
    }
});