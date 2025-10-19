import {Base} from './Base';
import {Data} from './Data';
import {TableInfo} from './TableInfo';

export class OptionItem extends Base {

    private _label: string;
    private _value: string;
    private _view_label: string;
    private _csv_label: string;
    private _hash: Object;


    private _raw_data: Object;

    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'data_a') {
                this._data_a = hash[key].map((_datahash) => {
                    let _data = new Data(new TableInfo(hash['table_info']));
                    _data.setInstanceData(_datahash)
                    return _data
                })
                continue;

            }
            this['_' + key] = hash[key];
        }
    }


    get hash(): Object {
        return this._hash;
    }

    get label(): string {
        return this._label;
    }

    get value(): string {
        return this._value;
    }

    get view_label(): string {
        return this._view_label;
    }

    get csv_label(): string {
        return this._csv_label;
    }

    get raw_data(): Object {
        return this._raw_data;
    }
}
