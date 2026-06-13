export interface TierDef {
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

export const TIERS: Record<string, TierDef> = {
    S: {
        label: 'Tier S',
        emoji: '🏆',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400/30',
        description: 'Masterpieces'
    },
    A: {
        label: 'Tier A',
        emoji: '💎',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400/30',
        description: 'Bangers Only'
    },
    B: {
        label: 'Tier B',
        emoji: '🌟',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/30',
        description: 'Great Tracks'
    },
    C: {
        label: 'Tier C',
        emoji: '🎵',
        color: 'text-slate-400',
        bgColor: 'bg-slate-400/10',
        borderColor: 'border-white/10',
        description: 'Decent'
    },
    D: {
        label: 'Tier D',
        emoji: '💀',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/20',
        description: 'Forgotten'
    },
};

export function getDefaultTierBounds(total: number): Record<string, number> {
    return {
        S: 0,
        A: 3,
        B: 3 + Math.floor(Math.max(1, total - 3) * 0.15),
        C: 3 + Math.floor(Math.max(1, total - 3) * 0.45),
        D: 3 + Math.floor(Math.max(1, total - 3) * 0.75)
    };
}

export function getTierForRank(rank: number, total: number, customBounds?: Record<string, number> | null): string {
    const index = rank - 1;

    if (customBounds) {
        if (index >= customBounds.D) return 'D';
        if (index >= customBounds.C) return 'C';
        if (index >= customBounds.B) return 'B';
        if (index >= customBounds.A) return 'A';
        return 'S';
    }

    if (rank <= 3) return 'S';

    const p = (rank - 3) / Math.max(1, total - 3);

    if (p <= 0.15) return 'A';
    if (p <= 0.45) return 'B';
    if (p <= 0.75) return 'C';
    return 'D';
}

export function shiftBoundsForInsertion(
    bounds: Record<string, number>,
    insertIndex: number,
    removeIndex: number = -1
): Record<string, number> {
    const newBounds = { ...bounds };

    ['A', 'B', 'C', 'D'].forEach(tier => {
        let bound = bounds[tier] || 0;

        if (removeIndex !== -1 && removeIndex < bound) {
            bound -= 1;
        }
        if (insertIndex <= bound) {
            bound += 1;
        }

        newBounds[tier] = Math.max(0, bound);
    });

    newBounds.S = 0;
    newBounds.A = Math.max(newBounds.S, newBounds.A);
    newBounds.B = Math.max(newBounds.A, newBounds.B);
    newBounds.C = Math.max(newBounds.B, newBounds.C);
    newBounds.D = Math.max(newBounds.C, newBounds.D);

    return newBounds;
}
