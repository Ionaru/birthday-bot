import { Birthday } from '@birthday-bot/entities';
import { utc } from 'moment';
import { FindConditions } from 'typeorm';

export class BirthdayService {

    private static birthdaySorter(left: Birthday, right: Birthday): -1 | 0 | 1 {
        const leftBirthday = utc(left.birthday).set('year', 2000);
        const rightBirthday = utc(right.birthday).set('year', 2000);

        if (leftBirthday.isBefore(rightBirthday)) {
            return -1;
        }

        if (leftBirthday.isAfter(rightBirthday)) {
            return 1;
        }

        return 0;
    }

    public async getBirthdays(): Promise<Birthday[]> {
        return Birthday.find();
    }

    public async getBirthdaysByQuery(query: FindConditions<Birthday>): Promise<Birthday[]> {
        return Birthday.find(query);
    }

    public async getBirthdayByQuery(query: FindConditions<Birthday>): Promise<Birthday | undefined> {
        return Birthday.findOne(query);
    }

    public async getBirthdayById(id: string): Promise<Birthday | undefined> {
        return Birthday.findOne(id);
    }

    public async createBirthday(user: string, channel: string, date: string): Promise<Birthday> {
        const birthday = new Birthday(user, channel, date);
        await birthday.save();
        return birthday;
    }

    public async deleteBirthday(birthday: Birthday): Promise<Birthday> {
        return birthday.remove();
    }

    public sortBirthdays(birthdays: Birthday[]): Birthday[] {
        return birthdays.sort(BirthdayService.birthdaySorter);
    }
}
