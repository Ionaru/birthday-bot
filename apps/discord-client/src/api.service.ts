import { type ApiClient } from '@birthday-bot/common';
import { HandledError, type IBirthday } from '@birthday-bot/interfaces';

/**
 * The discord-client's view of the storage service, through the gateway.
 *
 * The two statuses the commands report back to the user, 409 and 404, become
 * HandledError; anything else is a genuine fault and is thrown as one.
 */
export class ApiService {

    private readonly client: ApiClient;

    public constructor(client: ApiClient) {
        this.client = client;
    }

    public async createBirthday(user: string, channel: string, birthday: string): Promise<void> {
        const { ok, status } = await this.client.request('POST', 'storage', { birthday, channel, user });
        if (ok) {
            return;
        }
        if (status === 409) {
            throw new HandledError('Duplicate birthday for user.');
        }
        throw new Error(`Storage returned ${status}`);
    }

    public async deleteBirthday(user: string, channel: string): Promise<void> {
        const { ok, status } = await this.client.request('DELETE', `storage/${user}:${channel}`);
        if (ok) {
            return;
        }
        if (status === 404) {
            throw new HandledError('No birthday for user found.');
        }
        throw new Error(`Storage returned ${status}`);
    }

    public async getBirthday(id: string): Promise<IBirthday | undefined> {
        const { data, ok, status } = await this.client.request<IBirthday>('GET', `storage/${id}`);
        if (status === 404) {
            return undefined;
        }
        if (!ok) {
            throw new Error(`Storage returned ${status}`);
        }
        if (!data) {
            throw new Error('Empty response');
        }
        return data;
    }

    public async getBirthdays(): Promise<IBirthday[]> {
        const { data, ok, status } = await this.client.request<IBirthday[]>('GET', 'storage');
        if (!ok) {
            throw new Error(`Storage returned ${status}`);
        }
        if (!data) {
            throw new Error('Empty response');
        }
        return data;
    }
}
