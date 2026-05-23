import {fetchHTTPClientFileContent} from "../utils.ts";

export async function generateHttpClient(
    api: string,
    apiPath: string,
    procedures: Record<string, {
        input?: string;
        output?: string;
    }>,
) {
    let templateFile = await fetchHTTPClientFileContent();
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
    public ${name}(${inputType}, options?: { procedureId?: string; }) {
        this.addProcedure('${name}', options?.procedureId || '${name}', input);
        return this;
    }
`;
    }

    templateFile = templateFile.replaceAll('// replace: proceduresCode', proceduresCode);
    templateFile = templateFile.replaceAll('${apiVersion}', api);

    await Deno.writeTextFile(`${apiPath}/HTTPClient.ts`, templateFile);
}
