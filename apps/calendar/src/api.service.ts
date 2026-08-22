import { type ApiClient } from '@birthday-bot/common';
import { type BirthdayNotificationType, type IBirthday } from '@birthday-bot/interfaces';

export class ApiService {

    private readonly client: ApiClient;

    public constructor(client: ApiClient) {
        this.client = client;
    }

    public async getBirthdays(): Promise<IBirthday[]> {
        const { data, ok, status } = await this.client.request<IBirthday[]>('GET', 'storage');
        if (!ok) {
            throw new Error(`Could not fetch birthdays, storage returned ${status}`);
        }
        if (!data) {
            throw new Error('Empty response');
        }
        return data;
    }

    public async sendBirthdayNotification(
        id: string,
        notificationType: BirthdayNotificationType,
    ): Promise<void> {
        const { ok, status } = await this.client.request('POST', 'discord-client', { id, notificationType });
        if (!ok) {
            throw new Error(`Could not send notification for ${id}, discord-client returned ${status}`);
        }
    }
}
