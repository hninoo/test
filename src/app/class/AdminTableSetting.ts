import {Base} from './Base';

export class AdminTableSetting extends Base {
    private _table: string;


    constructor(hash) {
        super(hash)
    }

    get table(): string {
        return this._table;
    }

}
