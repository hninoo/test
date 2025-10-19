import {Base} from './Base';

export class CommonGrant extends Base {

    private _dashboard_editable: boolean = false;
    private _table_create: boolean = false;
    private _invoice: boolean = false;


    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }


    get dashboard_editable(): boolean {
        return this._dashboard_editable;
    }


    get table_create(): boolean {
        return this._table_create;
    }

    get invoice(): boolean {
        return this._invoice;
    }
}
