export interface GenerationMix {
    fuel: string;
    perc: number;
}

export interface GenerationDate {
    from: string;
    to: string;
    generationmix: GenerationMix[];
}

export interface GenerationDateResponse {
    data: GenerationDate[];
}

export interface EnergyMixResult {
    date: string;
    averageMix: Record<string, number>;
    cleanEnergyPercentage: number;
}

export interface OptimalChargeResult {
    from: string;
    to: string;
    cleanEnergyPercentage: number;
}


export const cleanEnergySources = ['biomass', 'nuclear', 'hydro', 'wind', 'solar'];

export async function fetchGenerationMix(from: string, to: string): Promise<GenerationDate[]> {
    const api = await fetch(`https://api.carbonintensity.org.uk/generation/${from}/${to}`, { signal: AbortSignal.timeout(5000) });

    if (!api.ok) {
        throw new Error(`Error code: ${api.status}`);
    }

    const response = await api.json() as GenerationDateResponse;

    return response.data;
}

export function formatDate(date: Date): string {
    return date.toISOString().slice(0, 11) + "00:30Z";
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
