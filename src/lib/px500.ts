import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

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

type RemotePhoto = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
};

type PhotoManifest = {
  updatedAt: string;
  photos: PxPhoto[];
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

const MANIFEST_FILENAME = 'manifest.json';
const MANIFEST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DISPLAY_WIDTH = 1400;
const JPEG_QUALITY = 82;
const TARGET_MAX_BYTES = 320_000;

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

async function optimizePhotoFile(filePath: string): Promise<void> {
  const info = await stat(filePath);
  if (info.size <= TARGET_MAX_BYTES) return;

  const optimized = await sharp(filePath)
    .rotate()
    .resize({
      width: MAX_DISPLAY_WIDTH,
      height: MAX_DISPLAY_WIDTH,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  await writeFile(filePath, optimized);
}

async function saveRemotePhoto(imageUrl: string, filePath: string): Promise<boolean> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) return false;

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const optimized = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DISPLAY_WIDTH,
      height: MAX_DISPLAY_WIDTH,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  await writeFile(filePath, optimized);
  return true;
}

export async function fetch500pxPhotos(username: string, limit = 12): Promise<RemotePhoto[]> {
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

async function readManifest(cacheDir: string): Promise<PhotoManifest | null> {
  const manifestPath = path.resolve(process.cwd(), cacheDir, MANIFEST_FILENAME);

  try {
    const raw = await readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as PhotoManifest;
  } catch {
    return null;
  }
}

function isManifestFresh(manifest: PhotoManifest): boolean {
  const age = Date.now() - new Date(manifest.updatedAt).getTime();
  return age >= 0 && age < MANIFEST_MAX_AGE_MS;
}

async function verifyCachedPhotos(
  photos: PxPhoto[],
  limit: number,
): Promise<PxPhoto[]> {
  const verified: PxPhoto[] = [];

  for (const photo of photos.slice(0, limit)) {
    const filePath = path.resolve(process.cwd(), 'public', photo.src.replace(/^\//, ''));
    if (!(await fileExists(filePath))) continue;

    await optimizePhotoFile(filePath);
    verified.push(photo);
  }

  return verified;
}

export async function loadCachedPhotos(
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  const { limit = 12, cacheDir = 'public/photos/500px' } = options;
  const manifest = await readManifest(cacheDir);
  if (!manifest) return [];

  return verifyCachedPhotos(manifest.photos, limit);
}

export async function getPhotosForPage(
  username: string,
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  const { limit = 12, cacheDir = 'public/photos/500px' } = options;
  const manifest = await readManifest(cacheDir);
  const cached = manifest ? await verifyCachedPhotos(manifest.photos, limit) : [];

  if (cached.length > 0 && manifest && isManifestFresh(manifest)) {
    return cached;
  }

  const synced = await sync500pxPhotos(username, options, cached);
  if (synced.length > 0) return synced;

  return cached;
}

async function sync500pxPhotos(
  username: string,
  options: { limit?: number; cacheDir?: string },
  fallback: PxPhoto[],
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
        const saved = await saveRemotePhoto(photo.imageUrl, filePath);
        if (!saved) continue;
      } else {
        await optimizePhotoFile(filePath);
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
    return photos;
  }

  return fallback;
}

/** @deprecated Use getPhotosForPage instead. */
export async function get500pxPhotos(
  username: string,
  options: { limit?: number; cacheDir?: string } = {},
): Promise<PxPhoto[]> {
  return getPhotosForPage(username, options);
}
