import {Base} from './Base';

export class Ledger extends Base {

    private _name: string;
    private _table: string;
    private _file_info_id: number;
    private _download_pdf: boolean;

    private _reflect_field: string;

    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'download_pdf') {
                this._download_pdf = hash[key] == 'true'
            } else {
                this['_' + key] = hash[key];
            }
        }
    }


    get name(): string {
        return this._name;
    }

    get table(): string {
        return this._table;
    }

    get file_info_id(): number {
        return this._file_info_id;
    }


    get download_pdf(): boolean {
        return this._download_pdf;
    }


    get reflect_field(): string {
        return this._reflect_field;
    }
}
