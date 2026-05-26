import type { AbstractLogger, ProcedureRequest, Request, SubscriptionRequest } from './common.ts';
import { ClientNotConnected, ConsoleLogger, LogLevel } from './common.ts';
import type * as Resource from './resources.ts';

export class WSClient {
    private logger: AbstractLogger;

    private apiVersion = '${apiVersion}';

    private websocket?: WebSocket;

    private onConnectedFn?: () => void;
    private onDisconnectFn?: () => void;
    private onMessageFn?: (message: unknown) => void;

    private subscriptionHandlers: {
        resource: string;
        onMessage: (message: unknown) => void | Promise<void>;
    }[] = [];

    constructor(
        private host: string,
        private port: number,
        options?: {
            logger?: AbstractLogger;
        },
    ) {
        this.logger = options?.logger ?? new ConsoleLogger(LogLevel.INFO);
    }

    public connect() {
        this.websocket = new WebSocket('ws://' + this.host + ':' + this.port);

        this.websocket.onopen = (_) => {
            if (this.onConnectedFn) {
                this.onConnectedFn();
            }

            const subscriptions: SubscriptionRequest[] = [];

            for (const handler of this.subscriptionHandlers) {
                subscriptions.push({
                    id: 'subscribe_to_' + handler.resource,
                    resource: handler.resource,
                });
            }

            const payload: Request = {
                protocol: 'v1',
                api: this.apiVersion,
                subscriptions,
            };

            this.logger.debug('Websocket: sending initial request', { payload: payload });

            this.websocket && this.websocket.send(JSON.stringify(payload));
        };

        this.websocket.onclose = (_) => {
            this.logger.info('Websocket connection closed.');

            if (this.onDisconnectFn) {
                this.onDisconnectFn();
            }

            this.websocket = undefined;
        };

        let firstMessageReceived = false;

        this.websocket.onmessage = async (websocketMessage) => {
            const data = JSON.parse(websocketMessage.data);

            if (!firstMessageReceived) {
                firstMessageReceived = true;
                this.logger.debug('Websocket: response payload received', { payload: data });
                return;
            } else {
                this.logger.debug('Websocket: message received', { payload: data });

                for (const handler of this.subscriptionHandlers) {
                    if ('resource_name' in data && handler.resource == data.resource_name) {
                        await handler.onMessage(data.resource);
                    }
                }

                if (this.onMessageFn) {
                    this.onMessageFn(data);
                }
            }
        };

        this.websocket.onerror = (error) => {
            this.logger.error('Connection error', { error });
        };
    }

    public subscribeToResource(resource: string, onMessage: (message: unknown) => void | Promise<void>) {
        this.subscriptionHandlers.push({ resource, onMessage });
        return this;
    }

    public disconnect(status: number = 1000, reason: string = 'Normal Closure') {
        if (this.websocket) {
            this.websocket.close(status, reason);
        }
    }

    public isConnected(): boolean {
        return this.websocket ? this.websocket.readyState === WebSocket.OPEN : false;
    }

    public onConnected(fn: () => void) {
        this.onConnectedFn = fn;
    }

    public onMessage(fn: (data: unknown) => void) {
        this.onMessageFn = fn;
    }

    public onDisconnect(fn: () => void) {
        this.onDisconnectFn = fn;
    }

    // replace: proceduresCode
}
