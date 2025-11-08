import { round, score } from './score.js';
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    let packs = [];
    try {
        packs = await fetchPacks();
    } catch {
        console.warn('Error loading packs with rewards');
    }

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier =
            Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === level.verifier.toLowerCase(),
            ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user =
                Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        let total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        const completedLevels = completed.map((l) => l.level);
        const verifiedLevels = verified.map((l) => l.level);
        const allCompletedLevels = [...new Set([...completedLevels, ...verifiedLevels])];

        const packsCompleted = [];
        for (const pack of packs) {
            if (pack.levels.every((lvl) => allCompletedLevels.includes(lvl))) {
                packsCompleted.push({
                    name: pack.name,
                    color: pack.color || 'var(--color-primary)',
                });
                if (pack.reward) total += pack.reward;
            }
        }

        return {
            user,
            total: round(total),
            packsCompleted,
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const res = await fetch(`${dir}/_packs.json`);
        if (!res.ok) throw new Error('Failed to load _packs.json');
        const packs = await res.json();

        const list = await fetchList();

        packs.forEach(pack => {
            let totalReward = 0;
            const ranks = [];
            let invalid = false;

            pack.levels.forEach(levelName => {
                const entry = list.find(([lvl]) =>
                    lvl.name.toLowerCase() === levelName.toLowerCase()
                );

                if (entry) {
                    const [lvl] = entry;
                    const rank = list.indexOf(entry) + 1;
                    ranks.push(rank);

                    if (rank > 200) invalid = true;

                    const levelScore = score(rank, 100, lvl.percentToQualify);
                    totalReward += levelScore;
                } else {
                    console.warn(`Nivel no encontrado en la lista: ${levelName}`);
                }
            });

            const avgRank = ranks.length > 0
                ? ranks.reduce((a, b) => a + b, 0) / ranks.length
                : 999;

            let multiplier = 1.0;
            if (avgRank <= 25) multiplier = 0.7;
            else if (avgRank <= 50) multiplier = 0.65;
            else if (avgRank <= 100) multiplier = 0.6;
            else if (avgRank <= 150) multiplier = 0.55;
            else multiplier = 0.5;

            if (invalid) {
                pack.reward = 0;
                pack.warning = "This pack does not grant points because it contains levels below Top 200.";
            } else {
                pack.reward = round(totalReward * multiplier);
            }
        });

        return packs;
    } catch (err) {
        console.error('Error fetching packs:', err);
        return [];
    }
}
