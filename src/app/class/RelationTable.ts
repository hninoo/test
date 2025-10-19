import {Base} from './Base';
import {Data} from './Data';
import {TableInfo} from './TableInfo';

export class RelationTable extends Base {

    private _label: string;
    private _sub_label: string;
    private _table: string;
    private _data_a: Array<Data>
    private _view_mode: boolean = false;

    private _view_fieldname_a:Array<string>;
    private _total_count: number;

    constructor(hash, _table_info: TableInfo) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'data_a') {
                this._data_a = hash[key].map((_datahash) => {
                    let _data = new Data(_table_info);
                    _data.setInstanceData(_datahash)
                    return _data
                })
                continue;

            }
            this['_' + key] = hash[key];
        }
    }

    get label(): string {
        return this._label;
    }

    get total_count(): number {
        return this._total_count;
    }

    get sub_label(): string {
        return this._sub_label;
    }

    get data_a(): Array<Data> {
        return this._data_a;
    }

    get table_info(): TableInfo {
        return this._table_info;
    }

    get table(): string {
        return this._table;
    }

    get view_mode(): boolean {
        return this._view_mode;
    }

    getViewFields(_table_info: TableInfo): Array<any> {
        if (!_table_info) {
            return []
        }

        const forms = _table_info.forms
        // 関連レコードに固定値と子テーブルは表示しない
        return _table_info.fields.filter((field) => {
            const form = forms.byFieldName(field['Field']);
            if(form.original_type !== 'fixed_html' && !(form.original_type === 'select_other_table' && form.is_child_form)) {
                return this._view_fieldname_a.includes(field['Field']);
            }
        }).sort((fieldA, fieldB) => {
            // Get the index of fieldA and fieldB in this._view_fieldname_a
            const indexA = this._view_fieldname_a.indexOf(fieldA['Field']);
            const indexB = this._view_fieldname_a.indexOf(fieldB['Field']);

            // Compare the indices to determine the sorting order
            return indexA - indexB;
        });
    }
}
