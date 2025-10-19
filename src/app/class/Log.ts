import {Base} from './Base';
import {User} from './User';

export class Log extends Base {
    get diff_a(): Array<any> {
        return this._diff_a;
    }

    private _action: string;
    private _action_text: string;
    private _diff_a: Array<any>;
    private _user: User;
    private _date_str: User;


    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'admin') {
                this._user = new User(hash['admin']);
            } else {
                this['_' + key] = hash[key];
            }
        }
    }


    get action(): string {
        return this._action;
    }

    get action_text(): string {
        return this._action_text;
    }

    get user(): User {
        return this._user;
    }

    get date_str(): User {
        return this._date_str;
    }


}
