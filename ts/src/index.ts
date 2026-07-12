import { exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';

import { generateTypeScriptClient } from './typescript/index.ts';
import { generateGodotClient } from './godot/index.ts';

export enum Technology {
    TYPESCRIPT = 'typescript',
    GODOT = 'godot',
}
export type Clients = { technology: Technology; path: string; apis?: string[] }[];

export async function generateClients(
    definition: APIDefinition,
    clients: Clients,
) {
    for (const client of clients) {
        const isDir = await exists(client.path, { isDirectory: true });

        if (!isDir) {
            throw new Error(`Failed while generating [${client.technology}] client; path ${client.path} is not a directory.`);
        }

        if (client.technology === Technology.TYPESCRIPT) {
            await generateTypeScriptClient(definition, client.path, client.apis);
        }

        if (client.technology === Technology.GODOT) {
            await generateGodotClient(definition, client.path, client.apis);
        }
    }
}
