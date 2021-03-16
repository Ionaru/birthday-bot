import axios, { AxiosInstance } from 'axios';

import { debug } from '../../debug';
import { ApiService } from '../services/api.service';

export class ApiClientController {

    private static readonly debug = debug.extend('ApiClientController');

    private readonly client: AxiosInstance;

    public constructor() {
        ApiClientController.debug('Start');

        if (!process.env.BB_API_URL || !process.env.BB_API_PORT) {
            throw new Error('API client configuration error!');
        }

        const baseURL = `${process.env.BB_API_URL}:${process.env.BB_API_PORT}`;

        if (!baseURL) {
            throw new Error('API client configuration error!');
        }

        ApiClientController.debug('Configuration OK');

        this.client = axios.create({baseURL});

        ApiClientController.debug('Ready');
    }

    public init(): ApiService {
        ApiClientController.debug('Init');
        return new ApiService(this.client);
    }
}
