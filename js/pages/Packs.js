import { fetchPacks, fetchList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-packs">

    <div class="packs-header">
        <h3>About Packs</h3>
        <p>
            Beat every level in a pack and submit your records, once your completions have been accepted, they’ll automatically show up on your profile.
        </p>

        <div class="packs-suggest">
            <a 
                href="https://forms.gle/rTFFLUat1cmPyjZz5" 
                target="_blank" 
                class="submit-btn"
            >
                Suggest Pack
            </a>
        </div>
    </div>

    <!-- PACK TABS -->
    <div class="packs-tabs">
        <button
            v-for="(pack, i) in packs"
            :key="i"
            :class="['pack-tab', { active: selectedPack === i }]"
            :style="{ borderColor: pack.color, color: selectedPack === i ? pack.color : '#fff' }"
            @click="selectedPack = i"
        >
            {{ pack.name }}
        </button>
    </div>

    <!-- PACK CONTENT -->
    <section class="pack-view" v-if="packs[selectedPack]">
        <div 
            class="pack-card big"
            :style="{ borderColor: packs[selectedPack].color }"
        >
            <h2 :style="{ color: packs[selectedPack].color }">
                {{ packs[selectedPack].name }}
            </h2>

            <p class="type-label-sm" style="color: #fff;">{{ packs[selectedPack].description }}</p>

            <div class="pack-levels">
                <ul>
                    <li v-for="level in packs[selectedPack].levelObjects" :key="level.name">
                        <a 
                            class="level-item"
                            :href="level.video"
                            target="_blank"
                        >
                            <div class="level-content">
                                <div class="level-thumb-wrapper">
                                    <img 
                                        :src="level.thumbnail"
                                        class="level-thumb"
                                        :alt="level.name"
                                    >
                                </div>

                                <span class="level-name">{{ level.name }}</span>
                            </div>

                            <span class="level-rank">(#{{ level.rank }})</span>
                        </a>
                    </li>
                </ul>
            </div>

            <div class="pack-reward" v-if="packs[selectedPack].reward > 0">
                <p><strong>Points when completed:</strong> {{ packs[selectedPack].reward }}</p>
            </div>

            <div class="pack-reward warning" v-else>
                <p>This pack does not grant points<br>because it contains Legacy levels</p>
            </div>
        </div>
    </section>
</main>
    `,

    data: () => ({
        loading: true,
        packs: [],
        list: [],
        selectedPack: 0,
    }),

    async mounted() {
        this.loading = true;

        this.list = await fetchList();
        const packs = await fetchPacks();

        if (!packs || packs.length === 0) {
            console.error('No packs found.');
            this.loading = false;
            return;
        }

        this.packs = packs.map(pack => {
            const levelObjects = pack.levels
                .map(ref => {
                    const entry = this.list.find(([lvl]) =>
                        lvl.id === ref || lvl.name.toLowerCase() === String(ref).toLowerCase()
                    );

                    if (!entry) {
                        console.warn(`Level not found in list: ${ref}`);
                        return null;
                    }

                    const [lvl] = entry;
                    return {
                        name: lvl.name,
                        rank: this.list.indexOf(entry) + 1,
                        id: lvl.id,
                        video: lvl.verification,
                        thumbnail: getThumbnailFromId(getYoutubeIdFromUrl(lvl.verification)),
                    };
                })
                .filter(Boolean);

        levelObjects.sort((a, b) => a.rank - b.rank);

            return {
                ...pack,
                levelObjects,
            };
        });

        this.loading = false;

        this.$nextTick(() => {
            const slider = document.querySelector('.packs-grid');
            let isDown = false;
            let startX;
            let scrollLeft;

            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.classList.add('active');
                document.body.classList.add('no-select');
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.classList.remove('active');
                document.body.classList.remove('no-select');
            });
            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.classList.remove('active');
                document.body.classList.remove('no-select');
            });
            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 1.2;
                slider.scrollLeft = scrollLeft - walk;
            });
        });
    },

    methods: {
        getThumbnailFromId,
        getYoutubeIdFromUrl,
    },
};
