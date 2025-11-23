import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

function getRankColor(rank) {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (rank === 4) return '#4FD1C5';
    if (rank === 5) return '#9F7AEA';
    if (rank > 75) return 'var(--color-legacy)';
    return null;
}

export default {
    components: { Spinner, LevelAuthors },

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-list">

            <div class="list-container">
            
                <div class="search-container">
                    <input 
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search levels..."
                        class="search-input"
                    />
                </div>

                <div class="list-scroll">

                    <table class="list" v-if="filteredList.length > 0">
                        <template v-for="(item, i) in filteredList" :key="i">

                            <tr v-if="item.originalIndex + 1 === 1" class="separator-row">
                                <td colspan="2">
                                    <div class="separator-text">MAIN</div>
                                </td>
                            </tr>

                            <tr v-if="item.originalIndex + 1 === 76" class="separator-row">
                                <td colspan="2">
                                    <div class="separator-text">LEGACY</div>
                                </td>
                            </tr>

                            <tr>
                                <td class="rank">
                                    <p class="type-label-lg"
                                       :style="{ color: getRankColor(item.originalIndex + 1) || 'inherit' }">
                                        #{{ item.originalIndex + 1 }}
                                    </p>
                                </td>

                                <td class="level"
                                    :class="{ 'active': selected === item.originalIndex, 'error': !item.data }">

                                    <button 
                                        @click="selected = item.originalIndex"
                                        :style="{ color: getRankColor(item.originalIndex + 1) || 'inherit' }"
                                    >
                                        <span class="type-label-lg">
                                            {{ item.data?.name || \`Error (\${item.error}.json)\` }}
                                        </span>
                                    </button>
                                </td>
                            </tr>

                        </template>
                    </table>

                    <p v-else style="text-align:center; padding:1rem; opacity:0.7;">
                        No levels found.
                    </p>
                </div>
            </div>

            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>

                    <LevelAuthors 
                        :creators="level.creators" 
                        :verifier="level.verifier">
                    </LevelAuthors>

                    <div style="display:flex;">
                        <div v-for="tag in level.tags" class="tag">{{ tag }}</div>
                    </div>

                    <div v-if="level.showcase" class="tabs">
                        <button 
                            class="tab" 
                            :class="{selected: !toggledShowcase}" 
                            @click="toggledShowcase = false"
                        >
                            <span class="type-label-lg">Verification</span>
                        </button>

                        <button 
                            class="tab" 
                            :class="{selected: toggledShowcase}" 
                            @click="toggledShowcase = true"
                        >
                            <span class="type-label-lg">Showcase</span>
                        </button>
                    </div>


                    <iframe
                        v-if="video"
                        class="video"
                        id="videoframe"
                        :src="video"
                        frameborder="0">
                    </iframe>

                    <div class="no-video" v-if="!video && !toggledShowcase">
                        <p style="opacity:0.6; margin:1rem 0 1rem;">
                            No verification video available for this level.
                        </p>
                    </div>

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>

                    <h2>Victors ({{ level.records?.length || 0 }})</h2>

                    <p v-if="selected + 1 > 75">
                        This level has fallen into the Legacy List and no longer accepts new records.
                    </p>

                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link"
                                   target="_blank"
                                   class="type-label-lg">
                                    {{ record.user }}
                                </a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile"
                                     :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`"
                                     alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>

                <div v-else class="level"
                     style="height:100%; display:flex; justify-content:center; align-items:center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">

                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">
                            {{ error }}
                        </p>
                    </div>

                    <div class="og">
                        <p class="type-label-md">
                            Website layout made by
                            <a href="https://tsl.pages.dev/" target="_blank">
                                TheShittyList
                            </a>
                        </p>
                    </div>

                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" 
                                     :alt="editor.role">
                                <a v-if="editor.link"
                                   target="_blank"
                                   class="type-label-lg link"
                                   :href="editor.link">
                                   {{ editor.name }}
                                </a>
                                <p v-else>
                                    {{ editor.name }}
                                </p>
                            </li>
                        </ol>
                    </template>

                    <h3>Submission Rules</h3>
                    <p>Verifications must be uploaded in the format of a youtube video.</p>
                    <p>Cheat indicator is required if a modmenu with the feature is being used.</p>
                    <p>The level complete endscreen must be shown.</p>
                    <p>Physics Bypass is NOT allowed.</p>
                    <p>Click Between Frames and FPS/TPS bypass are allowed, however, Physics Bypass is NOT allowed. </p>

                </div>
            </div>

        </main>
    `,

    data: () => ({
        list: [],
        filteredList: [],
        editors: [],
        loading: true,
        selected: 0,
        searchQuery: "",
        errors: [],
        roleIconMap,
        store,
        toggledShowcase: false,
    }),

    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },

        video() {
            if (!this.level) return null;

            if (this.toggledShowcase) {
                if (
                    this.level.showcase &&
                    this.level.showcase.trim() !== "" &&
                    this.level.showcase.trim() !== "#"
                ) {
                    return embed(this.level.showcase);
                }
                return null;
            }

            if (
                this.level.verification &&
                this.level.verification.trim() !== "" &&
                this.level.verification.trim() !== "#"
            ) {
                return embed(this.level.verification);
            }

            return null;
        }
    },

    watch: {
        searchQuery() {
            this.applyFilter();
        }
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) {
            this.errors = ["Failed to load list."];
            this.loading = false;
            return;
        }

        this.filteredList = this.list.map((entry, index) => ({
            data: entry[0],
            error: entry[1],
            originalIndex: index
        }));

        this.loading = false;
    },

    methods: {
        embed,
        score,
        getRankColor,

        applyFilter() {
            const q = this.searchQuery.trim().toLowerCase();

            if (!q) {
                this.filteredList = this.list.map((entry, index) => ({
                    data: entry[0],
                    error: entry[1],
                    originalIndex: index
                }));
                return;
            }

            const isNumberSearch = /^\d+$/.test(q);
            const isHashSearch = /^#\d+$/.test(q);

            let desiredExactIndex = null;

            if (isHashSearch) {
                desiredExactIndex = parseInt(q.slice(1), 10) - 1;
            }

            this.filteredList = this.list
                .map((entry, index) => ({
                    data: entry[0],
                    error: entry[1],
                    originalIndex: index
                }))
                .filter(item => {

                    if (desiredExactIndex !== null) {
                        return item.originalIndex === desiredExactIndex;
                    }

                    if (isNumberSearch) {
                        const pos = (item.originalIndex + 1).toString();
                        if (pos.includes(q)) return true;
                    }

                    return (
                        item.data &&
                        item.data.name.toLowerCase().includes(q)
                    );
                });
        }
    }
};
