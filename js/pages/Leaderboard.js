import { fetchLeaderboard, fetchPacks } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        packs: [], // 🔹 añadimos packs aquí
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard" :key="i">
                            <td class="rank">
                                <p class="type-label-lg" :id="'rank-' + i">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg" :id="'total-' + i">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg" :id="'user-' + i">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="player-container">
                    <div class="player" v-if="entry">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>

                        <!-- 🏆 Packs completados con color -->
                        <h2 v-if="entry.packsCompleted && entry.packsCompleted.length > 0">
                            Packs Completed ({{ entry.packsCompleted.length }})
                        </h2>
     <ul v-if="entry.packsCompleted && entry.packsCompleted.length > 0" class="packs-list">
    <li
        v-for="pack in entry.packsCompleted"
        :key="pack.name"
        class="pack-tag"
        :style="{ '--pack-color': pack.color || 'var(--color-primary)' }"
    >
        {{ pack.name }}
    </li>
</ul>

                        <h2 v-if="entry.verified.length > 0">Verified ({{ entry.verified.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified" :key="score.level">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>

                        <h2 v-if="entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed" :key="score.level">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>

                        <h2 v-if="entry.progressed.length > 0">Progressed ({{ entry.progressed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed" :key="score.level">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.percent }}% {{ score.level }}
                                    </a>
                                </td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
        },
    },
    async mounted() {
        this.loading = true;

        // 🧮 Cargar leaderboard y packs
        const [leaderboard, err] = await fetchLeaderboard();
        const excludedUsers = ["None", "ribbonera", "Artimae", "KanyeWestOfficial", "Dino"];
        this.leaderboard = leaderboard.filter(player => !excludedUsers.includes(player.user));
        this.err = err;

        try {
            this.packs = await fetchPacks();
        } catch {
            console.warn("No se pudieron cargar los packs para aplicar colores.");
        }

        this.loading = false;
        this.applyRankEffects();
    },
    methods: {
        localize,
        /**
         * 🎨 Devuelve estilos CSS para cada pack usando su color definido en _packs.json
         */
        getPackStyle(packName) {
            const pack = this.packs.find(p => p.name === packName);
            return pack && pack.color
                ? { '--pack-color': pack.color, borderColor: pack.color }
                : {};
        },
        applyRankEffects() {
            this.$nextTick(() => {
                const ranks = [
                    { index: 0, color: '#FFD700' },
                    { index: 1, color: '#C0C0C0' },
                    { index: 2, color: '#CD7F32' },
                    { index: 3, color: '#4FD1C5' },
                    { index: 4, color: '#9F7AEA' },
                ];
                for (const { index, color } of ranks) {
                    const rank = document.querySelector(`#rank-${index}`);
                    const user = document.querySelector(`#user-${index}`);
                    const total = document.querySelector(`#total-${index}`);
                    if (rank) rank.style.color = color;
                    if (user) user.style.color = color;
                    if (total) total.style.color = color;
                }
            });
        },
    },
};
