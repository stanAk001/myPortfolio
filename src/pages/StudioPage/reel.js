import { CLIPS } from '../../sections/Studio/Studio'

/*
  The edit suite's reel: the films in play order, and what each layer of a launch adds, second by
  second. Each track is a service. Times come from the edit lists the ads were rendered from (the
  scene grid and the voiceover cue sheet), so a lit clip is exactly what's on screen or audible then.
*/

export const TRACKS = [
  {
    id: 'ui',
    lane: 'V1',
    name: 'Product UI',
    service: 'Product & UI design',
    gets: ['Interfaces designed and built as the real product', 'Screens and flows recorded live for the films', 'Case-study shots and device mockups'],
  },
  {
    id: 'motion',
    lane: 'V2',
    name: 'Motion & type',
    service: 'Motion design',
    gets: ['Kinetic type cut to the beat', 'Camera moves, highlights and callouts on real screens', 'Openers, end cards and 9:16 re-cuts'],
  },
  {
    id: 'social',
    lane: 'V3',
    name: 'Flyers & social',
    service: 'Flyers & social creatives',
    gets: ['Pinterest and Instagram flyer packs', 'Vertical cuts for Reels and TikTok', 'One look across every post'],
  },
  {
    id: 'score',
    lane: 'A1',
    name: 'Original score',
    service: 'Music & sound',
    gets: ['An original score composed for each film', 'Cut to the edit, ducked under the voice', 'Mixed to streaming loudness (−15 LUFS)'],
    audio: true,
  },
  {
    id: 'voice',
    lane: 'A2',
    name: 'Voiceover',
    service: 'Script & voiceover',
    gets: ['The script, written to the picture', 'Voice cast, recorded, cleaned and timed', 'Every word placed on its beat'],
    audio: true,
  },
]

// A clip on a track: [start, length, words]. Social clips also say what they open and whether
// they're in the film or delivered alongside it.
const vo = (sheet, tempo = 1) => sheet.map(([at, len, text]) => [at, len / tempo, text])
const spans = (list) => list.map(([a, b]) => [a, b - a])
const clip = (id) => CLIPS.find((c) => c.id === id)

const KS = 60 / 88 * 4
const TH = 60 / 112 * 4

export const REEL = [
  {
    ...clip('ks'),
    stems: { score: '/studio/stems/ks-score.m4a', voice: '/studio/stems/ks-voice.m4a' },
    layers: {
      ui: spans([[2 * KS, 7 * KS], [9 * KS, 10 * KS]]),
      motion: spans([[0, 2 * KS], [3 * KS, 7 * KS], [9 * KS, 11.5 * KS]]),
      social: [[7 * KS, 2 * KS, 'Pinterest flyers, cut into the film', 'KeemStore', true]],
      score: [[0, 11.5 * KS]],
      voice: vo([
        [2.86, 1.79, 'Endless scrolling. Still guessing?'],
        [5.55, 2.6, 'Meet KeemStore. Smart finds, honestly noted.'],
        [8.38, 2.7, 'Every pick tells you who it’s for — and who should skip it.'],
        [13.94, 1.37, 'Gifts people actually use.'],
        [19.39, 1.41, 'Fresh edits, all season long.'],
        [24.75, 1.5, 'Small price. Big difference.'],
        [27.42, 2.22, 'KeemStore. Good finds. No endless scrolling.'],
      ]),
    },
  },
  {
    ...clip('th'),
    stems: { score: '/studio/stems/th-score.m4a', voice: '/studio/stems/th-voice.m4a' },
    layers: {
      ui: spans([[7 * TH, 25 * TH]]),
      motion: spans([[0, 8 * TH], [11 * TH, 15.5 * TH], [18 * TH, 29 * TH]]),
      social: [[0, 29 * TH, 'Pinterest flyer pack, delivered with the film', 'Toolhaven', false]],
      score: [[0, 29 * TH]],
      voice: vo(
        [
          [5.36, 4.26, 'Ten tabs. Ten “best tools” lists.'],
          [9.79, 5.58, 'All of them quietly ads. So I built an honest one.'],
          [15.1, 2.13, 'This is Toolhaven.'],
          [17.29, 6.76, 'Every review tells you what a tool is good at — and what it’s bad at.'],
          [23.72, 5.97, 'ChatGPT. Claude. Midjourney. Head to head.'],
          [29.13, 3.36, 'Every AI tool, judged the same way.'],
          [33.41, 1.87, 'Built a tool yourself?'],
          [35.41, 2.96, 'Submit it to Toolhaven. It’s free.'],
          [38.82, 8.37, 'Every tool is judged on the same eight questions. Paying us never buys a better score.'],
          [47.39, 5.85, 'Promotion is clearly labelled. The rankings stay honest.'],
          [53.77, 4.23, 'Toolhaven. Ten minutes, not ten tabs.'],
          [57.97, 3.8, 'Find your tool — or submit yours.'],
        ],
        1.1,
      ),
    },
  },
  {
    ...clip('sa'),
    stems: { score: '/studio/stems/sa-score.m4a', voice: '/studio/stems/sa-voice.m4a' },
    layers: {
      ui: spans([[5, 22.5], [25, 52.5], [57.5, 61.25]]),
      motion: spans([[0, 5], [20, 25], [35, 37.5], [47.5, 50], [52.5, 65]]),
      social: [],
      score: [[0, 65]],
      voice: vo([
        [0.3, 1.46, 'Every chart looks like a guess.'],
        [3.05, 0.99, 'Until it doesn’t.'],
        [5.2, 3.83, 'StockAcademia. Any stock, analysed — then watched for you.'],
        [10.3, 4.41, 'Start at zero. Short lessons, from “what’s a stock?” to reading a chart.'],
        [15.25, 4.56, 'Then practise with virtual money. Real prices, no real risk.'],
        [20.25, 1.74, 'Stuck? Ask the community.'],
        [22.65, 2.52, 'When you’re ready, the AI does the heavy lifting.'],
        [25.4, 3.99, 'Pick any stock — say, MTN Nigeria — and ask for the verdict.'],
        [30.25, 4.36, 'Seconds later: what the company is, what’s strong, what to watch, and the bottom line.'],
        [35.15, 2.0, 'Entry. Stop. Targets. A plan.'],
        [37.9, 2.35, 'Or let the AI find the opportunities for you.'],
        [42.0, 3.83, 'Every setup is scored, with why it surfaced — and what could go wrong.'],
        [47.8, 1.29, 'Then it keeps watching for you.'],
        [50.25, 2.17, 'And every visit starts with what changed.'],
        [52.6, 4.57, 'Plain-English analysis — in English, Pidgin, Yorùbá, Hausa and Igbo.'],
        [57.8, 2.11, 'Free to learn. Premium to stop guessing.'],
        [61.4, 2.87, 'StockAcademia. Stop guessing. Start analysing.'],
      ]),
    },
  },
  {
    ...clip('tff'),
    // A client edit cut to a licensed track: the sound is the film's own, no stems.
    stems: null,
    layers: {
      ui: [[0, 66.6]],
      motion: [],
      social: [[0, 66.6, 'Re-cut 9:16 for Reels and TikTok', 'tff-v', false]],
      score: [[0, 66.6, 'Music in the edit']],
      voice: [],
    },
  },
]

// Where each clip starts on the master timeline.
let at = 0
for (const c of REEL) {
  c.start = at
  at += c.dur
}
export const REEL_LENGTH = at

export const VERTICAL = clip('tff-v')
