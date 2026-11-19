/*
  The whole easter egg script in one place: where each choice leads and every line of dialogue.
  Events a phase doesn't list are ignored, which is why double clicks and late timers can't break it.
*/
const EXIT = { LEFT: 'escaped', CLOSE: 'goodbye' }

export const FLOW = {
  hidden: { NOTICE: 'intro' },
  intro: { WHOSE: 'whose', BACK: 'back', LEFT: 'away', DISMISS: 'closed' },
  whose: { BUTTON: 'taunt', LEFT: 'away', DISMISS: 'closed' },
  back: { BUTTON: 'taunt', LEFT: 'away', DISMISS: 'closed' },
  away: { END: 'perched' },
  perched: { OPEN: 'taunt' },
  taunt: { PRESS: 'falling', REFUSE: 'refused', ...EXIT },
  refused: { PRESS: 'falling', REFUSE: 'respect', ...EXIT },
  falling: { FELL: 'void', ...EXIT },
  void: { FIX: 'fixing', BLAME: 'blamed', ...EXIT },
  blamed: { FIX: 'fixing', ...EXIT },
  fixing: { DONE: 'wrong', ...EXIT },
  wrong: { NOTICED: 'caught', ...EXIT },
  caught: { REVEAL: 'reveal', ...EXIT },
  reveal: { BACKTO: 'signoff', REPLAY: 'taunt', LEFT: 'closed', CLOSE: 'signoff' },
  respect: { END: 'closed' },
  escaped: { END: 'closed' },
  goodbye: { END: 'closed' },
  signoff: { END: 'closed' },
  closed: {},
}

export const ON_PERCH = ['intro', 'whose', 'back', 'perched']
export const K_GONE = ['intro', 'whose', 'back', 'taunt', 'refused', 'falling', 'void', 'blamed', 'fixing']
export const LIVE = ['taunt', 'refused', 'falling', 'void', 'blamed', 'fixing', 'wrong', 'caught', 'reveal']
// Phases that happen on the black screen.
export const DARK = ['void', 'blamed', 'fixing', 'reveal']

export const MOOD = {
  intro: 'smug',
  whose: 'suspicious',
  back: 'embarrassed',
  perched: 'curious',
  taunt: 'smug',
  refused: 'suspicious',
  falling: 'surprised',
  void: 'embarrassed',
  blamed: 'suspicious',
  fixing: 'surprised',
  wrong: 'bye',
  caught: 'surprised',
  reveal: 'bye',
  away: 'surprised',
  respect: 'surprised',
  escaped: 'embarrassed',
  goodbye: 'bye',
  signoff: 'bye',
}

export const REPLY = {
  whose: 'What k? There was never a k. It’s pronounced “A eem”.',
  back: 'Okay. Relax. But first, come and look at this.',
}

export const TAUNT = {
  taunt: 'Whatever you do, don’t press this.',
  refused: 'Good. Very mature. It’s only holding up the entire website.',
}

export const BEATS = {
  void: ['…', 'That was the load-bearing button.', 'He spent months on this.', 'And you’re the last person who was here.'],
  blamed: ['I don’t have hands.', 'Legally, I was never here.'],
}

export const REPAIR = [
  { text: '$ npm run fix-everything' },
  { text: 'Looking for the website... found some of it.' },
  { text: 'Reattaching navigation... somewhere.' },
  { text: 'Restoring all text from memory...' },
  { text: 'Memory contains: one developer who needs work.', found: true },
  { text: 'ERROR  CREATIVITY OVERFLOW  0xFUNNY', bad: true },
  { text: 'Please hire this developer to resolve the issue.', bad: true },
  { text: 'Ignoring error.' },
  { text: 'Done. Probably.', found: true },
]

export const TOAST = {
  away: 'Leaving already? I haven’t even shown you my bugs yet.',
  respect: 'Nobody ever does that. You’d make a terrible developer. Here’s your k.',
  escaped: 'Escape successful. Your dignity remains intact.',
  goodbye: 'Fair enough. Back to pretending I’m a serious portfolio.',
  signoff: 'Tell no one.',
}
