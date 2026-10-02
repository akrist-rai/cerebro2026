// Every word on the promo, transcribed from the CEREBRO '26 sponsorship deck
// (../content). Edit copy here; the components only lay it out.
//
// `*phrase*` marks the words the deck sets in red. `marks()` splits them out.

export const EVENT = {
  name: 'CEREBRO',
  year: '’26',
  tagline: 'Beyond the horizon',
  host: 'Technical Committee',
  institute: 'IIIT Vadodara',
};

export const SECTIONS = [
  { id: 'about', key: '1', label: 'About' },
  { id: 'cerebro', key: '2', label: 'Cerebro' },
  { id: 'events', key: '3', label: 'Events' },
  { id: 'sponsor', key: '4', label: 'Sponsor' },
  { id: 'contact', key: '5', label: 'Contact' },
];

export const ABOUT =
  'Founded in 2013 by MHRD, *IIIT Vadodara (IIIT-V)* is an Institute of National Importance. Currently operating from GEC Gandhinagar, it organizes *Cerebro*, an annual nationwide hybrid tech festival featuring workshops, talks, exhibitions, literary events, and gaming competitions.';

export const CEREBRO =
  'Cerebro is a national-level hybrid technical fest hosted by IIIT Vadodara, bringing together students from across India to participate in diverse inter-college technical events. The fest has witnessed growing *participation* over the past four years.';

// Participants per edition, exactly as the deck's chart gives them.
export const GROWTH = [
  { year: '2019-20', n: 700 },
  { year: '2020-21', n: 1000 },
  { year: '2021-22', n: 1500 },
  { year: '2022-23', n: 2500 },
  { year: '2023-24', n: 3600 },
  { year: '2025-26', n: 4600 },
];

// `art` names a scene in src/lib/ascii/scenes.js, or the loaded TECH HUNT
// hero grid. `lede` opens the entry, `more` carries the rest of the deck's
// copy, and `num` keeps the deck's running order.
export const EVENTS = [
  {
    id: 'enigma',
    num: 1,
    name: 'Enigma',
    track: 'Quiz',
    art: 'icosa',
    meta: ['2-member teams', '5 rounds'],
    lede: '*Equinox* is a five-round team quiz contest bringing together two-member teams in a battle of knowledge, speed, and strategy.',
    more: [
      'It opens with a fast-paced quiz round to narrow the field, followed by a scoring round where teams bank points for the challenges ahead. From there, the competition intensifies with *buzzer rounds testing reflexes* under pressure, a high-stakes game and finally, a story-driven finale where teams must solve interconnected puzzles to claim victory.',
      'Equinox promises a thrilling test of intellect, nerve, and teamwork.',
    ],
  },
  {
    id: 'retro-market',
    num: 2,
    name: 'Retro Market',
    track: 'Finance',
    art: 'candles',
    meta: ['Offline', 'Paper trading'],
    lede: 'Test Your *Trading Skills* Offline! Simulate stock market transactions with paper trading, using mock funds to practice strategies and make decisions without financial risk.',
    more: ['Sharpen your trading tactics and prepare for real-world challenges in this hands-on, offline event.'],
  },
  {
    id: 'prudentia',
    num: 3,
    name: 'Prudentia',
    track: 'Finance',
    art: 'ribbon',
    meta: ['₹10 lakh virtual portfolio'],
    lede: 'Dive into the Thrill of Mock Stock Market Competition! Manage 10 lakhs of *virtual money*, strategize investments, and navigate market fluctuations.',
    more: ['Showcase your financial acumen and compete to build the most successful portfolio in this high-stakes simulation.'],
  },
  {
    id: 'robo-race',
    num: 4,
    name: 'Robo Race',
    track: 'Robotics',
    art: 'track',
    meta: ['10 teams', 'Knockout format'],
    lede: '*Navigate. Control. Conquer.* Teams put their robots to the test on a challenging obstacle track, tackling twists, turns, ramps, and other hurdles with precision and speed.',
    more: [
      'The fastest and most skillful teams advance through the knockout rounds, pushing their engineering and control skills to the limit.',
    ],
  },
  {
    id: 'tech-hunt',
    num: 5,
    name: 'Tech-Hunt',
    track: 'CTF',
    art: 'techhunt',
    flagship: true,
    meta: ['13 challenges', 'Capture the flag'],
    lede: 'TechHunt 2025 is *a flagship immersive Capture The Flag (CTF)* competition that combines technology, problem-solving, storytelling, and suspense into one unforgettable experience.',
    more: [
      'Built around a gripping detective narrative, participants journey through 13 interconnected challenges involving cryptography, binary decoding, reverse engineering, web security, hidden clues, physical challenges, and logical puzzles. Each challenge unlocks a new chapter in the mysterious disappearance of Anaya.',
      'As the investigation unfolds, the story transforms into a psychological mystery filled with obsession, secrets, and unexpected revelations, culminating in a powerful final twist that redefines the entire investigation.',
      'With its unique blend of cybersecurity, coding, puzzle-solving, and immersive storytelling, TechHunt 2025 is designed to attract technology enthusiasts, programmers, cybersecurity learners, and problem-solvers while offering strong opportunities for sponsor visibility and engagement.',
    ],
  },
  {
    id: 'robo-soccer',
    num: 6,
    name: 'Robo Soccer',
    track: 'Robotics',
    art: 'pitch',
    meta: ['15 teams', 'Knockout format'],
    lede: 'Where robotics meets the beautiful game! Teams battle it out in an intense robotic soccer knockout, showcasing their bots’ agility, precision, control, strategy, and engineering.',
    more: [
      'Every match is a test of smart programming, mechanical design, quick decision-making, and teamwork.',
      'Outsmart the opposition, score crucial goals, adapt to challenging situations, and fight through every knockout round. Only the strongest teams will make it to the final and earn the title of champion.',
      '*15 teams. One battlefield. One champion.*',
    ],
  },
  {
    id: 'trio-codejam',
    num: 7,
    name: 'Trio-Codejam',
    track: 'Code',
    art: 'terminals',
    meta: ['Teams of 3', 'In person'],
    lede: 'Trio-Codejam brings together three minds, one challenge, and countless possibilities. In this high-intensity coding competition, teams of three collaborate under pressure to solve challenging problems within a limited time, testing their *programming skills, logical thinking, speed, and teamwork.*',
    more: [
      'Hosted in person at IIIT Vadodara - Gandhinagar Campus, the event creates an electrifying environment where participants compete, innovate, and push their problem-solving abilities to the limit.',
      'Trio-Codejam offers an exciting platform for brands to engage with passionate coders and the next generation of technology talent.',
    ],
  },
  {
    id: 'codeclash',
    num: 8,
    name: 'CodeClash',
    track: 'Code',
    art: 'clock',
    meta: ['3 hours', 'Codeforces'],
    lede: 'CodeClash is an intense, *3-hour competitive programming contest* hosted on Codeforces.',
    more: [
      'It tests participants’ algorithmic speed, strategy, and precision on a dynamic leaderboard while connecting brands directly with top global tech talent.',
    ],
  },
  {
    id: 'd2d',
    num: 9,
    name: 'D2D',
    track: 'Design',
    art: 'surface',
    meta: ['3-member teams', 'Front-end prototype'],
    lede: 'A Comprehensive Platform for Showcasing Skills in the Entire Design and Development Lifecycle.',
    more: [
      'In this event, 3-member teams will be challenged to conceptualize, design, and develop a fully-functional front-end prototype.',
      'It is an opportunity to *encourage creativity, innovation, and practical application of design principles* while fostering collaboration, enhancing presentation skills, and recognizing excellence in both design and development.',
    ],
  },
];

export const TRACKS = ['Robotics', 'Code', 'Finance', 'Quiz', 'Design', 'CTF'];

// `terms` is the deck's wording above each price, word for word.
export const TIERS = [
  {
    id: 'title',
    name: 'Title Sponsor',
    pitch: 'Front-row access to the next generation of builders. Own the spotlight, shape the conversation & make your brand impossible to ignore on stage, online & everywhere in between.',
    terms: 'For contribution of',
    price: 799,
    perks: [
      'Event title naming rights',
      'Seminar / interactive session',
      'Logo on selected goodies',
      'Main stage + entry branding',
      'Dedicated branded stall',
      'Digital & offline promotions',
      'Press + post-event recognition',
    ],
  },
  {
    id: 'event',
    name: 'Event Sponsor',
    pitch: 'High-impact visibility without sharing the throne. Be everywhere that matters and remembered long after the event ends.',
    terms: 'For contribution upto',
    price: 349,
    perks: ['Selected flagship events will be hosted in collaboration with your brand'],
  },
  {
    id: 'experience',
    name: 'Experience Centre Sponsor',
    pitch: 'Strong presence. Solid recall. Real impact. Perfect for brands that want visibility without overdoing it.',
    terms: 'For contribution exceeding',
    price: 269,
    perks: [
      'Stage / banner branding',
      'Digital promotions',
      'Social media shout-outs',
      'Stalls like graffiti walls, photo booths, gaming arcade etc will be hosted in collaboration with your entity',
    ],
  },
  {
    id: 'goodies',
    name: 'Goodies Sponsor',
    pitch: 'As the goodies sponsor, put your brand in every hacker’s hands, and earn instant clout for backing the brightest tech minds.',
    terms: 'For contribution exceeding',
    price: 200,
    perks: [
      'Prominent website logo placement',
      'Full poster and social media visibility',
      'Exclusive main-banner recognition at Cerebro',
    ],
  },
];

export const CONTACT = {
  intro: 'For any inquiries, please feel free to contact us. We look forward to hearing from you.',
  groups: [
    {
      label: 'Sponsorships',
      people: [
        { name: 'Aryan', phone: '+91-8451982327' },
        { name: 'Tirth', phone: '+91-8097031445' },
      ],
    },
    {
      label: 'Organizers',
      people: [{ name: 'Pratham', phone: '+91-7383695552' }],
    },
  ],
};

// '*a* b' -> [['a', true], [' b', false]]
export function marks(text) {
  return text.split('*').map((t, i) => [t, i % 2 === 1]).filter(([t]) => t);
}

export const tel = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`;
