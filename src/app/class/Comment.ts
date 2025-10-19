import {User} from './User';
import {Base} from './Base';

export class Comment extends Base {

    private _content: string;
    private _data_id: number;
    private _table: string;
    private _user: User;
    private _date_str: string;
    private _log_id: number;
    private _workflow_status: string;


    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'view') {
                this._user = new User(hash['view']['admin']);
                this._date_str = hash['view']['date_str'];

            } else {
                this['_' + key] = hash[key];
            }
        }
    }


    get date_str(): string {
        return this._date_str;
    }

    get content(): string {
        return this._content;
    }

    get data_id(): number {
        return this._data_id;
    }

    get table(): string {
        return this._table;
    }

    get user(): User {
        return this._user;
    }

    get workflow_status(): string {
        return this._workflow_status;
    }

    get log_id(): number {
        return this._log_id;
    }
}
