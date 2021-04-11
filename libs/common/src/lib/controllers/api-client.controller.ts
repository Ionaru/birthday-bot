import axios, { AxiosInstance } from 'axios';
import { Debugger } from 'debug';

export class ApiClientController {

    private readonly debug: Debugger;
    private readonly client: AxiosInstance;

    public constructor(debug: Debugger) {
        this.debug = debug.extend(this.constructor.name);
        this.debug('Start');

        if (!process.env.BB_API_URL || !process.env.BB_API_PORT) {
            throw new Error('API client configuration error!');
        }

        this.debug('Configuration OK');

        const baseURL = `${process.env.BB_API_URL}:${process.env.BB_API_PORT}`;
        this.client = axios.create({baseURL});

        this.debug('Ready');
    }

    public init<T>(serviceClass: new(client: AxiosInstance) => T): T {
        this.debug('Init');
        return new serviceClass(this.client);
    }
}
