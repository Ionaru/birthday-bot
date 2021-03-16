import { BirthdayNotificationType } from '@birthday-bot/interfaces';
import { CronJob } from 'cron';
import { utc } from 'moment';

import { debug } from '../../debug';
import { ApiService } from '../services/api.service';

export class SendBirthdayNotificationsTask {
    private static readonly debug = debug.extend('SendBirthdayNotificationsTask');
    private readonly cronJob: CronJob;

    public constructor(
        private readonly apiService: ApiService,
    ) {
        this.cronJob = new CronJob({
            cronTime: '0 0 18 * * *',
            onTick: () => this.tick(),
            runOnInit: true,
            timeZone: 'UTC',
        });
    }

    public start(): void {
        SendBirthdayNotificationsTask.debug('Start');
        this.cronJob.start();
    }

    public async tick(): Promise<void> {
        SendBirthdayNotificationsTask.debug('Tick');

        const birthdays = await this.apiService.getBirthdays();

        for (const birthday of birthdays) {
            const birthdayDate = utc(birthday.birthday);
            birthdayDate.year(new Date().getUTCFullYear());

            let notificationType: BirthdayNotificationType | undefined;
            if (utc().isSame(birthdayDate, 'day')) {
                notificationType = BirthdayNotificationType.TODAY;
            }

            birthdayDate.subtract(1, 'day');
            if (utc().isSame(birthdayDate, 'day')) {
                notificationType = BirthdayNotificationType.DAY;
            }

            birthdayDate.subtract(6, 'day');
            if (utc().isSame(birthdayDate, 'day')) {
                notificationType = BirthdayNotificationType.WEEK;
            }

            birthdayDate.subtract(7, 'day');
            if (utc().isSame(birthdayDate, 'day')) {
                notificationType = BirthdayNotificationType.FORTNIGHT;
            }

            if (notificationType) {
                try {
                    await this.apiService.sendBirthdayNotification(birthday.id, notificationType);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            }
        }
    }
}
