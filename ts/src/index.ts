import { exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';

import { generateTypeScriptClient } from './typescript/index.ts';

export enum Technology {
    TYPESCRIPT = 'typescript',
    GODOT = 'godot',
}
export type Clients = { technology: Technology; path: string }[];

export async function generateClients(
    definition: APIDefinition,
    clients: Clients,
) {
    for (const client of clients) {
        if (client.technology === Technology.TYPESCRIPT) {
            const isDir = await exists(client.path, { isDirectory: true });

            if (!isDir) {
                throw new Error(`Failed while generating [${client.technology}] client; path ${client.path} is not a directory.`);
            }

            await generateTypeScriptClient(definition, client.path);
        }
    }
}
