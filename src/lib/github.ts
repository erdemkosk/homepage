export type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  fork: boolean;
};

const EXCLUDED = new Set(['erdemkosk', 'awesome-personal-blogs']);

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'erdemkosk-portfolio',
        },
      },
    );

    if (!response.ok) return [];

    const repos = (await response.json()) as GitHubRepo[];

    return repos
      .filter((repo) => !repo.fork && !EXCLUDED.has(repo.name))
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
  } catch {
    return [];
  }
}

export function languageColor(language: string | null): string {
  const colors: Record<string, string> = {
    Go: '#00ADD8',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Java: '#b07219',
    Vue: '#41b883',
    Ruby: '#701516',
    CSS: '#663399',
  };

  return colors[language ?? ''] ?? '#94a3b8';
}
