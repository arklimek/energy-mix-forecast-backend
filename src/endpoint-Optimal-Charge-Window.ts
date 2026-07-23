import { Router } from 'express';

import {
    fetchGenerationMix,
    formatDate,
    addDays,
    cleanEnergySources,
} from './functions.js';

import type {
    GenerationDate,
    OptimalChargeResult
} from './functions.js';


export function toWindowResults(intervals: GenerationDate[], hours: number): OptimalChargeResult {
    const buff: OptimalChargeResult[] = [];
    const time: number = hours * 2;
    let best: OptimalChargeResult | null = null;

    for (const interval of intervals) {
        let cleanEnergyPercentage = 0;

        for (const entry of interval.generationmix) {
            if (cleanEnergySources.includes(entry.fuel)) {
                cleanEnergyPercentage += entry.perc;
            }
        }

        buff.push({
            from: interval.from,
            to: interval.to,
            cleanEnergyPercentage: cleanEnergyPercentage,
        });
    }

    for (let i = 0; i + time <= buff.length; i++) {
        const buffer: OptimalChargeResult[] = buff.slice(i, time + i);
        const start: string = buffer[0].from;
        const end: string = buffer[time - 1].to;
        let avg: number = 0;

        for (const j of buffer) {
            avg += j.cleanEnergyPercentage;
        }

        avg = avg / time;

        if (!best || avg > best.cleanEnergyPercentage) {
            best = {
                from: start,
                to: end,
                cleanEnergyPercentage: avg,
            };
        }
    }

    if (!best) {
        throw new Error('Za mało danych, żeby znaleźć okno o takiej długości');
    }
    console.log(best);
    return best;
}

export const optimalWindowRouter = Router();

optimalWindowRouter.get('/api/optimal-window', async (req, res) => {
    const hours = Number(req.query.hours);

    if (!Number.isInteger(hours) || hours < 1 || hours > 6) {
        res.status(400).json({ error: 'Parametr "hours" musi być liczbą całkowitą 1-6' });
        return;
    }

    try {
        const jutro = addDays(new Date(), 1);
        const pojutrze = addDays(jutro, 1);

        const intervals = await fetchGenerationMix(formatDate(jutro), formatDate(pojutrze));
        const result = toWindowResults(intervals, hours);

        res.json(result);
    }

    catch (err) {
        res.status(502).json({ error: 'Nie udało się obliczyć optymalnego okna' });
    }
});