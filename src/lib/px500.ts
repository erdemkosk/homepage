import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type PxPhoto = {
  id: string;
  title: string;
  href: string;
  src: string;
};

type GraphQLPhotoNode = {
  name: string;
  canonicalPath: string;
  legacyId: string;
  images: { url: string; size: number }[];
};

const QUERY = `
  query UserPhotos($username: String!, $first: Int!) {
    userByUsername(username: $username) {
      photos(first: $first) {
        edges {
          node {
            name
            canonicalPath
            legacyId
            images(sizes: [33, 34, 35]) {
              url
              size
            }
          }
        }
      }
    }
  }
`;

type PhotoManifest = {
  updatedAt: string;
  photos: PxPhoto[];
};

const MANIFEST_FILENAME = 'manifest.json';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pickImageUrl(images: GraphQLPhotoNode['images']): string {
  const sorted = [...images].sort((a, b) => b.size - a.size);
  return sorted[0]?.url ?? images[0]?.url ?? '';
}

export async function fetch500pxPhotos(username: string, limit = 12): Promise<Omit<PxPhoto, 'src'>[]> {
  try {
    const response = await fetch('https://api.500px.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { username, first: limit },
      }),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      data?: {
        userByUsername?: {
          photos?: { edges?: { node: GraphQLPhotoNode }[] };
        };
      };
    };

    const edges = payload.data?.userByUsername?.photos?.edges ?? [];

    return edges
      .map(({ node }) => {
        const imageUrl = pickImageUrl(node.images);
        return {
          id: node.legacyId,
          title: node.name,
          href: `https://500px.com${node.canonicalPath}`,
          imageUrl,
        };
      })
      .filter((photo) => photo.imageUrl);
  } catch {
    return [];
  }
}

export async function loadCachedPhotos(
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  const { limit = 12, cacheDir = 'public/photos/500px' } = options;
  const manifestPath = path.resolve(process.cwd(), cacheDir, MANIFEST_FILENAME);

  try {
    const raw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw) as PhotoManifest;
    const verified: PxPhoto[] = [];

    for (const photo of manifest.photos.slice(0, limit)) {
      const filePath = path.resolve(process.cwd(), 'public', photo.src.replace(/^\//, ''));
      if (await fileExists(filePath)) verified.push(photo);
    }

    return verified;
  } catch {
    return [];
  }
}

export async function getPhotosForPage(
  username: string,
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  const cached = await loadCachedPhotos(options);
  if (cached.length > 0) return cached;

  return get500pxPhotos(username, options);
}

export async function get500pxPhotos(
  username: string,
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  const { limit = 12, cacheDir = 'public/photos/500px' } = options;
  const remotePhotos = await fetch500pxPhotos(username, limit);

  if (remotePhotos.length === 0) return [];

  const absoluteDir = path.resolve(process.cwd(), cacheDir);
  await mkdir(absoluteDir, { recursive: true });

  const photos: PxPhoto[] = [];

  for (const photo of remotePhotos) {
    const filename = `${photo.id}.jpg`;
    const filePath = path.join(absoluteDir, filename);
    const src = `/photos/500px/${filename}`;

    try {
      const alreadyCached = await fileExists(filePath);

      if (!alreadyCached) {
        const imageResponse = await fetch(photo.imageUrl);
        if (!imageResponse.ok) continue;
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        await writeFile(filePath, buffer);
      }

      photos.push({
        id: photo.id,
        title: photo.title,
        href: photo.href,
        src,
      });
    } catch {
      // skip failed downloads
    }
  }

  if (photos.length > 0) {
    const manifest: PhotoManifest = {
      updatedAt: new Date().toISOString(),
      photos,
    };
    await writeFile(path.join(absoluteDir, MANIFEST_FILENAME), JSON.stringify(manifest, null, 2));
  }

  return photos;
}
