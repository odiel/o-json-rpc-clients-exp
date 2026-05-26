import { fetchWSClientFileContent } from '../utils.ts';

export async function generateWSClient(
    api: string,
    apiPath: string,
    procedures: Record<string, {
        input?: string;
        output?: string;
    }>,
) {
    let templateFile = await fetchWSClientFileContent();
    let proceduresCode = '';

    for (const [name, options] of Object.entries(procedures)) {
        let inputType = 'input?: undefined';
        let _outputType = 'undefined';

        if (options.input) {
            const inputResource = options.input.replace('#/resources/', '');

            const inputTypeName = `${inputResource}`;

            inputType = `input: Resource.${inputTypeName}`;
        }

        if (options.output) {
            const outputResource = options.output.replace('#/resources/', '');

            _outputType = `${outputResource}`;
        }

        proceduresCode += `
    /**
     * Method for calling procedure ${name}.
     * Note: the request is sent immediately
     */
    public ${name}(${inputType}, options?: { procedureId?: string; }) {
        if (this.isConnected()) {
            const procedure: ProcedureRequest = {
                id: options?.procedureId || '${name}',
                name: '${name}'
            }

            if (input) {
                procedure.input = input;
            }
        
            const payload: Request = {
                protocol: 'v1',
                api: this.apiVersion,
                procedures: [
                    procedure
                ],
            }
    
            this.logger.debug('Websocket: sending request', { payload: payload })
    
            this.websocket && this.websocket.send(JSON.stringify(payload));
        } else {
            throw new ClientNotConnected('Request for procedure [${name}] not sent; client is not connected.')
        }
    }
`;
    }

    templateFile = templateFile.replaceAll('// replace: proceduresCode', proceduresCode);
    templateFile = templateFile.replaceAll('${apiVersion}', api);

    await Deno.writeTextFile(`${apiPath}/WSClient.ts`, templateFile);
}
