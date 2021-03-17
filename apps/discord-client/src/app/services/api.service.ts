import { HandledError, IBirthday } from '@birthday-bot/interfaces';
import { IServerResponse } from '@ionaru/micro-web-service';
import { AxiosError, AxiosInstance } from 'axios';

export class ApiService {
    public constructor(
        private readonly client: AxiosInstance,
    ) { }

    public async createBirthday(user: string, channel: string, birthday: string): Promise<void> {
        const data = {user, channel, birthday};
        const response = await this.client.post<IServerResponse<IBirthday>>('storage', data)
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            if (response.response?.status === 409) { throw new HandledError('Duplicate birthday for user.'); }
            throw response;
        }
    }

    public async getBirthdays(): Promise<IBirthday[]> {
        const response = await this.client.get<IServerResponse<IBirthday[]>>(`storage`)
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            throw response;
        }

        if (!response.data.data) {
            throw new Error('Empty response');
        }

        return response.data.data;
    }

    public async getBirthday(id: string): Promise<IBirthday> {
        const response = await this.client.get<IServerResponse<IBirthday>>(`storage/${id}`)
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            throw response;
        }

        if (!response.data.data) {
            throw new Error('Empty response');
        }

        return response.data.data;
    }

    public async deleteBirthday(user: string, channel: string): Promise<void> {
        const response = await this.client.delete(`storage/${user}:${channel}`)
            .catch((error: AxiosError) => error);

        if (response instanceof Error) {
            if (response.response?.status === 404) { throw new HandledError('No birthday for user found.'); }
            throw response;
        }
    }
}
