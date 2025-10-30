// src/figma-api/app-builder/services/utils/mappingsManager.ts

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

type BundleType = 'esbuild' | 'expo' | 'expo_server';

interface BuildConfig {
    figmaFileId: string;
    figmaFileName: string;
    figmaPageName: string;
    appName: string;
    fullAppConfig: any;
    bundleType?: BundleType;
}

interface PrototypeMapping {
    path: string;
    figmaFileId: string;
    figmaPageId?: string;
    createdAt: string;
    views?: number;
    lastViewed?: string;
    bundleType?: BundleType;
}

const PROTOTYPES_PATH = path.join(__dirname, '../../../../../public/prototypes');
const MAPPINGS_FILE = path.join(PROTOTYPES_PATH, 'mappings.json');

/**
 * Find existing UUID by build path (to reuse on updates)
 */
async function findUuidByPath(buildPath: string): Promise<string | null> {
    if (!await fs.pathExists(MAPPINGS_FILE)) {
        return null;
    }

    const mappings = await fs.readJson(MAPPINGS_FILE);
    const relativePath = path.relative(PROTOTYPES_PATH, buildPath);

    // Find UUID with matching path
    for (const [uuid, mapping] of Object.entries(mappings)) {
        if ((mapping as PrototypeMapping).path === relativePath) {
            return uuid;
        }
    }

    return null;
}

/**
 * Update UUID mappings (reuses existing UUID if found)
 */
export async function updateMappings(
    config: BuildConfig,
    buildPath: string,
    bundleType: BundleType
): Promise<string> {
    // Check for existing UUID
    let uuid = await findUuidByPath(buildPath);
    const isUpdate = !!uuid;

    if (!uuid) {
        uuid = `proto-${uuidv4()}`;
    }

    const relativePath = path.relative(PROTOTYPES_PATH, buildPath);

    const mapping: PrototypeMapping = {
        path: relativePath,
        figmaFileId: config.figmaFileId,
        createdAt: isUpdate ?
            (await getExistingCreatedAt(uuid)) :
            new Date().toISOString(),
        views: isUpdate ? (await getExistingViews(uuid)) : 0,
        bundleType
    };

    let mappings: Record<string, PrototypeMapping> = {};
    if (await fs.pathExists(MAPPINGS_FILE)) {
        mappings = await fs.readJson(MAPPINGS_FILE);
    }

    mappings[uuid] = mapping;

    await fs.ensureDir(PROTOTYPES_PATH);
    await fs.writeJson(MAPPINGS_FILE, mappings, { spaces: 2 });

    console.log(isUpdate ? `♻️  Reusing UUID: ${uuid}` : `🆕 Created UUID: ${uuid}`);

    return uuid;
}

/**
 * Get existing created date
 */
async function getExistingCreatedAt(uuid: string): Promise<string> {
    if (!await fs.pathExists(MAPPINGS_FILE)) {
        return new Date().toISOString();
    }

    const mappings = await fs.readJson(MAPPINGS_FILE);
    return mappings[uuid]?.createdAt || new Date().toISOString();
}

/**
 * Get existing view count
 */
async function getExistingViews(uuid: string): Promise<number> {
    if (!await fs.pathExists(MAPPINGS_FILE)) {
        return 0;
    }

    const mappings = await fs.readJson(MAPPINGS_FILE);
    return mappings[uuid]?.views || 0;
}

/**
 * Get prototype by UUID
 */
export async function getPrototype(uuid: string): Promise<PrototypeMapping | null> {
    if (!await fs.pathExists(MAPPINGS_FILE)) {
        return null;
    }

    const mappings = await fs.readJson(MAPPINGS_FILE);
    return mappings[uuid] || null;
}

/**
 * Increment view count for prototype
 */
export async function incrementViews(uuid: string): Promise<void> {
    if (!await fs.pathExists(MAPPINGS_FILE)) {
        return;
    }

    const mappings = await fs.readJson(MAPPINGS_FILE);
    if (mappings[uuid]) {
        mappings[uuid].views = (mappings[uuid].views || 0) + 1;
        mappings[uuid].lastViewed = new Date().toISOString();
        await fs.writeJson(MAPPINGS_FILE, mappings, { spaces: 2 });
    }
}