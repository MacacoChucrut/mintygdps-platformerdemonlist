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
                    These packs are picked by the list staff team. You can unlock them by completing all the levels in a pack, and once you do, they’ll show up on your profile.
                </p>
                <h3>How do I get these packs?</h3>
                <p>
                    Just beat every level in a pack and submit your records. Once your completions have been accepted, the pack will automatically appear on your profile.
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

            <section class="packs-container">
                <div class="packs-grid">
                    <div class="pack-card" 
                        v-for="(pack, i) in packs" 
                        :key="i"
                        :style="{ borderColor: pack.color }"
                    >
                        <div class="pack-meta">
                            <h2 :style="{ color: pack.color }">{{ pack.name }}</h2>
                            <p class="type-label-sm" style="color: #aaa;">{{ pack.description }}</p>

                            <div class="pack-levels">
                                <ul>
                                    <li v-for="level in pack.levelObjects" class="level-item">
                                        <div class="level-content">
                                        
                                            <div class="level-thumb-wrapper">
                                            <img 
                                                :src="level.thumbnail" 
                                                :alt="level.name" 
                                                class="level-thumb" 
                                                loading="lazy" 
                                            />
                                        </div>

                                            <span class="level-name">{{ level.name }}</span>
                                        </div>
                                        <span class="level-rank">(#{{ level.rank }})</span>

                                    </li>
                                </ul>
                            </div>

                            <div class="pack-reward" v-if="pack.reward > 0">
                                <p><strong>Points when completed:</strong> {{ pack.reward }}</p>
                            </div>
                            <div class="pack-reward warning" v-else>
                                <p>This pack does not grant points<br>because it contains Legacy levels</p>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </section>

            <div class="meta-container"></div>
        </main>
    `,

    data: () => ({
        loading: true,
        packs: [],
        list: [],
    }),

    async mounted() {
        this.loading = true;

        // Cargar lista y packs
        this.list = await fetchList();
        const packs = await fetchPacks();

        if (!packs || packs.length === 0) {
            console.error('No packs found.');
            this.loading = false;
            return;
        }

        // Vincular niveles con su información visual
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

            return {
                ...pack,
                levelObjects,
            };
        });

        this.loading = false;

        // 🖱️ Permitir desplazamiento horizontal arrastrando
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
