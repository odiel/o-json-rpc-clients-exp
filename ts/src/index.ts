import { exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';

import { generateTSClient } from './ts_client.ts';

export async function generateClients(
    definition: APIDefinition,
    clients: { language: 'typescript'; path: string }[],
) {
    for (const client of clients) {
        if (client.language === 'typescript') {
            const isDir = await exists(client.path, { isDirectory: true });

            if (!isDir) {
                throw new Error(`Path ${client.path} is not a directory.`);
            }

            await generateTSClient(definition, client.path);
        }
    }
}
