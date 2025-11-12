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

export default {
    components: { Spinner, LevelAuthors },

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-list">

            <div class="list-container">

                <div class="search-container" style="padding: 0 0 1rem;">
                    <input 
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search levels..."
                        class="search-input"
                        style="
                            width: 100%;
                            padding: 10px 15px;
                            border-radius: 8px;
                            border: none;
                            background: var(--color-background-hover);
                            color: var(--color-on-background);
                            font-size: 1rem;
                            outline: none;
                        "
                    />
                </div>

                <table class="list" v-if="filteredList.length > 0">
                    <tr v-for="(item, i) in filteredList" :key="i">

                        <!-- rank -->
                        <td class="rank">
                            <p class="type-label-lg"
                                :style="{ color: item.originalIndex + 1 > 75 ? 'darkgrey' : 'inherit' }">
                                #{{ item.originalIndex + 1 }}
                            </p>
                        </td>

                        <!-- level button -->
                        <td class="level"
                            :class="{ 'active': selected === item.originalIndex, 'error': !item.data }">

                            <button @click="selected = item.originalIndex">
                                <span class="type-label-lg">
                                    {{ item.data?.name || \`Error (\${item.error}.json)\` }}
                                </span>
                            </button>
                        </td>

                    </tr>
                </table>

                <p v-else style="text-align:center; padding:1rem; opacity:0.7;">
                    No levels found.
                </p>
            </div>

            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>

                    <LevelAuthors :creators="level.creators" :verifier="level.verifier"></LevelAuthors>

                    <div style="display:flex;">
                        <div v-for="tag in level.tags" class="tag">{{ tag }}</div>
                    </div>

                    <iframe
                        v-if="video"
                        class="video"
                        id="videoframe"
                        :src="video"
                        frameborder="0">
                    </iframe>

                    <p v-else style="opacity:0.6; margin-top:1rem;">
                        No verification video available for this level.
                    </p>

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

                    <h2>Victors</h2>
                    <p v-if="selected + 1 > 75">
                        This level has fallen into the Legacy List and no longer accepts new records.
                    </p>

                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">
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
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>

                    <div class="og">
                        <p class="type-label-md">
                            Website layout made by
                            <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
                        </p>
                    </div>

                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" 
                                     :alt="editor.role">
                                <a v-if="editor.link" target="_blank" 
                                   class="type-label-lg link"
                                   :href="editor.link">
                                   {{ editor.name }}
                                </a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>

                    <h3>Level Rules</h3>
                    <p>The level has to be under 30 seconds.</p>
                    <p>For a level to place, it must be harder than #75.</p>
                    <p>Random Trigger cannot affect gameplay or difficulty.</p>
                    <p>Copying from outside the GDPS is NOT allowed.</p>
                    <p>15 CPS max.</p>

                    <h3>Submission Requirements</h3>
                    <p>Video proof required for Top 30.</p>
                    <p>Upload as YouTube video.</p>
                    <p>Cheat indicator required if mods used.</p>
                    <p>Show previous attempt unless first try.</p>
                    <p>No major shortcuts.</p>
                    <p>Show completion screen.</p>
                    <p>CBF & FPS/TPS bypass allowed; physics bypass NOT allowed.</p>
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
        store
    }),

    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },

        video() {
            if (!this.level) return null;

            if (!this.level.verification || this.level.verification.trim() === "")
                return null;

            if (!this.level.showcase)
                return embed(this.level.verification);

            return embed(
                this.toggledShowcase ? this.level.showcase : this.level.verification
            );
        },
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

            this.filteredList = this.list
                .map((entry, index) => ({
                    data: entry[0],
                    error: entry[1],
                    originalIndex: index
                }))
                .filter(item =>
                    item.data &&
                    item.data.name.toLowerCase().includes(q)
                );
        }
    }
};
