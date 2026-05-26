export const site = {
  name: 'Erdem Köşk',
  fullName: 'Mustafa Erdem Köşk',
  title: 'Senior Backend Engineer',
  description:
    'Mustafa Erdem Köşk is a Senior Backend Engineer from İzmir. Personal site for software, open source, writing, and photography.',
  url: 'https://erdemkosk.com',
  email: 'erdemkosk@gmail.com',
  location: 'İzmir, Turkey',
  bio: 'Backend engineer who loves exploring new technologies and solid software patterns — building tools, side projects, and open source that others can actually use.',
  github: 'erdemkosk',
  githubBio: 'Senior Backender',
  publicRepos: 89,
  githubSince: '2014',
  keywords: [
    'Erdem Köşk',
    'Mustafa Erdem Köşk',
    'erdemkosk',
    'backend developer',
    'software engineer',
    'Go',
    'Node.js',
    'TypeScript',
  ],
  social: {
    github: 'https://github.com/erdemkosk',
    linkedin: 'https://www.linkedin.com/in/erdemkosk/',
    twitter: 'https://twitter.com/erdemkosk',
    medium: 'https://medium.com/@erdemkosk',
    instagram: 'https://instagram.com/erdemkosk',
    px500: 'https://500px.com/erdemkosk',
  },
  sameAs: [
    'https://github.com/erdemkosk',
    'https://www.linkedin.com/in/erdemkosk/',
    'https://twitter.com/erdemkosk',
    'https://medium.com/@erdemkosk',
    'https://instagram.com/erdemkosk',
    'https://500px.com/erdemkosk',
  ],
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/writing', label: 'Writing' },
  { href: '/open-source', label: 'Open Source' },
  { href: '/photography', label: 'Photography' },
  { href: '/contact', label: 'Contact' },
] as const;
