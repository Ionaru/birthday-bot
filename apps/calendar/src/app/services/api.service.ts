import { BirthdayNotificationType, IBirthday } from '@birthday-bot/interfaces';
import { IServerResponse } from '@ionaru/micro-web-service';
import { AxiosError, AxiosInstance } from 'axios';

export class ApiService {
    public constructor(
        private readonly client: AxiosInstance,
    ) { }

    public async getBirthdays(): Promise<IBirthday[]> {
        const response = await this.client.get<IServerResponse<IBirthday[]>>('storage')
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            throw response;
        }

        if (!response.data.data) {
            throw new Error('Empty response');
        }

        return response.data.data;
    }

    public async sendBirthdayNotification(id: string, notificationType: BirthdayNotificationType): Promise<void> {
        const data = {id, notificationType};
        const response = await this.client.post('discord-client', data)
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            throw response;
        }
    }
}
