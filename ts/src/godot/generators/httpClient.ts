import { fetchTemplateHTTPClient } from '../utils.ts';
import {apiSlug, snakeCase} from '../../utils.ts';

export async function generateHttpClient(
    api: string,
    apiPath: string,
    procedures: Record<string, {
        input?: string;
        output?: string;
    }>,
) {
    const api_slug = apiSlug(api);

    let templateFile = await fetchTemplateHTTPClient();

    let proceduresCode = '';

    for (const [name, options] of Object.entries(procedures)) {
        let inputType = 'input:Variant = null';
        // let _outputType = 'undefined';

        if (options.input) {
            // const inputResource = options.input.replace('#/resources/', '');

            // const inputTypeName = `${inputResource}`;

            inputType = `input: Variant`;
        }
        //
        // if (options.output) {
        //     const outputResource = options.output.replace('#/resources/', '');
        //
        //     _outputType = `${outputResource}`;
        // }

        proceduresCode += `
func ${snakeCase(name)}(${inputType}, id: String = "") -> ORPC_HTTP_Client_${api_slug}:
    self.add_procedure("${name}", id, input)
    return self
`;
    }

    templateFile = templateFile.replaceAll('# replace: proceduresCode', proceduresCode);
    templateFile = templateFile.replaceAll('${apiSlug}', api_slug);
    templateFile = templateFile.replaceAll('${api}', api);

    await Deno.writeTextFile(`${apiPath}/orpc_http_client.gd`, templateFile);
}
