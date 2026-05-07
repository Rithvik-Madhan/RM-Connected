export type PostCategory =
  | 'Marine Biology'
  | 'Diving'
  | 'Conservation'
  | 'Scouting'
  | 'Backpacking'
  | 'Environmental Science';

export interface PostMeta {
  slug: string;
  title: string;
  lede: string;
  category: PostCategory;
  /** ISO date — sorted reverse-chronologically. */
  date: string;
  /** Cover image, displayed in hero block on the post page and in index cards. */
  image: string;
  imageAlt: string;
  imageCaption?: string;
  tags: string[];
}

export const posts: PostMeta[] = [
  {
    slug: '1',
    title: 'The True Disparities of Light Pollution',
    lede: 'The silent crisis of light pollution and over-lighting has illuminated my interest in environmental science — from childhood night walks to the impact on human health and wildlife.',
    category: 'Environmental Science',
    date: '2025-04-02',
    image: 'https://darksky.org/app/uploads/2020/03/light-pollution-sea-turtles-web-824x549-1.jpg',
    imageAlt: 'Sea turtle hatchlings disoriented by artificial light pollution',
    imageCaption: 'Sea turtle hatchlings following artificial light sources instead of moonlight, leading them away from the ocean.',
    tags: ['light-pollution', 'environmental-science', 'wildlife-conservation', 'dark-sky', 'astronomy', 'public-health'],
  },
  {
    slug: '2',
    title: 'Finding Light After Dark',
    lede: 'My first night dive terrified me, but discovering bioluminescence in the dark waters transformed my fear into a lifelong passion for the ocean.',
    category: 'Diving',
    date: '2024-01-10',
    image: '/night-diving-light.jpg',
    imageAlt: 'Night diver with flashlight exploring underwater bioluminescence',
    imageCaption: "Night diving reveals the ocean's hidden wonders, including the magical world of bioluminescence.",
    tags: ['night-diving', 'bioluminescence', 'personal-story', 'marine-life', 'ocean-exploration', 'scuba-diving'],
  },
  {
    slug: '3',
    title: 'A Day in the Life at Camp Emerald Bay',
    lede: 'My first day earning the Advanced Open Water certification at fourteen — anticipation, underwater navigation, and the alien-like world beneath the kelp forests.',
    category: 'Diving',
    date: '2024-08-15',
    image: '/emerald-bay-diving.jpg',
    imageAlt: 'Divers practicing underwater navigation with compass at Camp Emerald Bay',
    imageCaption: 'Underwater navigation training with diving instructors at Camp Emerald Bay — learning compass skills beneath the surface.',
    tags: ['camp-emerald-bay', 'diving-certification', 'advanced-open-water', 'personal-story', 'underwater-navigation', 'kelp-forest'],
  },
  {
    slug: '4',
    title: 'My First Backpacking Trip',
    lede: 'I went backpacking for the first time in Sequoia, and boy, did I learn a lot. Here is everything I picked up about gear, prep, and the experience itself.',
    category: 'Backpacking',
    date: '2025-11-24',
    image: '/sequoia-backpacking-cover.jpg',
    imageAlt: 'Scenic view of a lake in Sequoia National Park',
    imageCaption: 'The breathtaking views in Sequoia made every step of the journey worth it.',
    tags: ['backpacking', 'sequoia', 'hiking-gear', 'outdoor-adventure', 'first-time'],
  },
  {
    slug: '5',
    title: 'My Scouting Journey',
    lede: 'Scouting is still a new journey for me, but it already feels like home — like something I was always meant to be a part of.',
    category: 'Scouting',
    date: '2025-11-24',
    image: '/scouting-journey-cover.jpg',
    imageAlt: 'Scouting America logo',
    tags: ['scouting', 'adventure', 'outdoors', 'personal-growth'],
  },
];

export const postsByDate = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAdjacent(slug: string): { prev?: PostMeta; next?: PostMeta } {
  const i = postsByDate.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return {
    next: postsByDate[i - 1],
    prev: postsByDate[i + 1],
  };
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
