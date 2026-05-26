export type MediumPost = {
  title: string;
  url: string;
  date: string;
  categories: string[];
  excerpt: string;
  image?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xml: string): MediumPost[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.map((match) => {
    const block = match[1];
    const pick = (tag: string) => block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1] ?? '';
    const link = block.match(/<link>([^<]+)<\/link>/)?.[1]?.split('?')[0] ?? '';
    const pubDate = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? '';
    const categories = [...block.matchAll(/<category><!\[CDATA\[([^\]]+)\]\]><\/category>/g)].map((c) => c[1]);
    const content = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ?? '';
    const image = content.match(/src="(https:\/\/cdn-images[^"]+)"/)?.[1];
    const excerpt = stripHtml(content).slice(0, 200);

    return {
      title: pick('title'),
      url: link,
      date: pubDate,
      categories,
      excerpt: excerpt.length === 200 ? `${excerpt}...` : excerpt,
      image,
    };
  });
}

export async function fetchMediumPosts(username: string): Promise<MediumPost[]> {
  try {
    const response = await fetch(`https://medium.com/feed/@${username}`, {
      headers: { 'User-Agent': 'erdemkosk-portfolio' },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

export function formatPostDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
