import {Objectable} from '../Objectable';

export class SortParam extends Objectable {
    private _field: string = null;
    private _asc_desc: string = 'asc';

    constructor(field: string, asc_desc: string = 'asc') {
        super();

        this._field = field;
        this._asc_desc = asc_desc;
    }


    get field(): string {
        return this._field;
    }

    set field(value: string) {
        this._field = value;
    }

    get asc_desc(): string {
        return this._asc_desc;
    }

    set asc_desc(value: string) {
        this._asc_desc = value;
    }
}
