const writingRedirects = [
  '/posts',
  '/posts/convert-medium-to-md',
  '/posts/file_cop',
  '/posts/first_post',
  '/posts/medium-makalenizi-md-dosyasina-cevir',
  '/posts/microservicesor',
  '/posts/microservicesormonolith',
  '/tags',
  '/tags/blog',
  '/tags/information',
  '/tags/medium',
  '/tags/tool',
  '/categories',
];

const openSourceRedirects = [
  '/projects',
  '/projects/bludhaven',
  '/projects/filecop',
  '/projects/first_post',
  '/projects/gri-makina',
  '/projects/gri-makine',
  '/projects/hydra',
  '/projects/jet-file-transfer',
  '/projects/quiz-it',
  '/projects/rabbitmq-mail-consumer-server',
  '/projects/streamle',
  '/projects/tatooine',
  '/projects/uıuı',
];

function withTrailingSlashVariants(paths: string[]): Record<string, string> {
  const redirects: Record<string, string> = {};

  for (const path of paths) {
    redirects[path] = path.startsWith('/projects') ? '/open-source/' : '/writing/';
    if (!path.endsWith('/')) {
      redirects[`${path}/`] = redirects[path];
    }
  }

  return redirects;
}

export const legacyRedirects = {
  '/about': '/',
  '/index-about': '/',
  '/index-about/': '/',
  ...withTrailingSlashVariants(writingRedirects),
  ...withTrailingSlashVariants(openSourceRedirects),
};
