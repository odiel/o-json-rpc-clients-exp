import type { AbstractLogger, ClientOptions, ProcedureRequest, Request, Response, SubscriptionRequest } from './common.ts';
import { ConsoleLogger, LogLevel } from './common.ts';
import * as Resource from './resources.ts';

export class HTTPClient {
    private logger: AbstractLogger;

    private apiVersion = '${apiVersion}';

    private procedures: ProcedureRequest[] = [];

    constructor(
        private host: string,
        private port: number,
        options?: {
            logger?: AbstractLogger;
        },
    ) {
        this.logger = options?.logger ?? new ConsoleLogger(LogLevel.INFO);
    }
    // replace: proceduresCode
    public async send(options?: ClientOptions): Promise<Response> {
        const url = 'http://' + this.host + ':' + this.port;
        const payload = this.buildRequestPayload({ procedures: [...this.procedures], subscriptions: [] }, options);
        this.procedures = [];

        this.logger.debug('Sending payload to ' + url, { payload: payload });

        let response;

        try {
            response = await fetch(url, {
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

    private buildRequestPayload(operations: { procedures: ProcedureRequest[]; subscriptions: SubscriptionRequest[] }, options?: ClientOptions): Request {
        const request: Request = {
            protocol: 'v1',
            api: this.apiVersion,
            procedures: operations.procedures,
        };

        if (operations.subscriptions.length > 0) {
            request.subscriptions = operations.subscriptions;
        }

        if (options) {
            request.options = {};

            if (options.authentication) {
                request.options.authentication = {
                    scheme: options.authentication.scheme,
                    token: options.authentication.token,
                    token_format: options.authentication.token_format,
                };
            }

            if (options.execution) {
                request.options.execution = options.execution;
            }
        }

        return request;
    }
}
