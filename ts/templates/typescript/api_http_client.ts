import type { AbstractLogger, ClientOptions, ProcedureRequest, Request, Response } from './common.ts';
import { ConsoleLogger, LogLevel } from './common.ts';
import type * as Resource from './resources.ts';

export class HTTPClient {
    private logger: AbstractLogger;

    private apiVersion = '${apiVersion}';

    private procedures: ProcedureRequest[] = [];

    private serverUrl: string = '';

    constructor(
        private host: string,
        private port: number,
        options?: {
            logger?: AbstractLogger;
        },
    ) {
        this.serverUrl = 'http://' + this.host + ':' + this.port;
        this.logger = options?.logger ?? new ConsoleLogger(LogLevel.INFO);
    }
    // replace: proceduresCode
    public async send(options?: ClientOptions): Promise<Response> {
        const payload = this.buildRequestPayload([...this.procedures], options);
        this.procedures = [];

        this.logger.debug('Sending payload to ' + this.serverUrl, { payload: payload });

        let response;

        try {
            response = await fetch(this.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            this.logger.debug('Response payload received', { payload: json });

            return json;
        } catch (error) {
            this.logger.error('Request error', { error });

            throw error;
        }
    }

    private addProcedure(name: string, id: string, input?: unknown) {
        const procedure: ProcedureRequest = { id, name };

        if (input) {
            procedure.input = input;
        }

        this.procedures.push(procedure);
    }

    private buildRequestPayload(procedures: ProcedureRequest[], options?: ClientOptions): Request {
        const request: Request = {
            protocol: 'v1',
            api: this.apiVersion,
            procedures,
        };

        if (options) {
            request.options = {};

            if (options.authentication) {
                request.options.authentication = options.authentication;
            }

            if (options.execution) {
                request.options.execution = options.execution;
            }
        }

        return request;
    }
}
