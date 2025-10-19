import {CustomFilter} from './Filter/CustomFilter';

export class UserTableSetting {
    private _table: string = null;
    private _refer_ids: Array<any> = [];
    private _sort_params: Object = {};
    private _filter_id: number = null;
    private _current_page: number = null;
    private _total_page: number = null;
    private _view_id: number = null;
    private _open_memo: boolean = true;
    private _toggle_filter_content_area: boolean = false;


    //clear when reload
    private _tmp_filter: CustomFilter = null;


    constructor(table: string) {
        this._table = table;
    }

    setByHash(hash = null) {
        if (!hash) {
            return;
        }
        for (const key of Object.keys(hash)) {
            if (!key.match(/^_tmp/)) {
                this[key] = hash[key];
            }
        }
    }

    private hasProperty<K extends string>(
        x: unknown,
        name: K
    ): x is { [M in K]: unknown } {
        return x instanceof Object && name in x;
    }

    get filter_id(): number {
        return this._filter_id;
    }

    set filter_id(value: number) {
        this._filter_id = value;
        this.save();
    }

    get current_page(): number {
        return this._current_page;
    }

    set current_page(value: number) {
        this._current_page = value;
        this.save();
    }
    get total_page(): number {
        return this._total_page;
    }

    set total_page(value: number) {
        this._total_page = value;
        this.save();
    }


    get view_id(): number {
        return this._view_id;
    }

    set view_id(value: number) {
        this._view_id = value;
    }

    get refer_ids(): Array<any> {
        return this._refer_ids;
    }

    set refer_ids(value: Array<any>) {
        this._refer_ids = value;
        this.save();
    }

    get sort_params(): object {
        return this._sort_params;
    }

    set sort_params(value: object) {
        this._sort_params = value;
        this.save();
    }

    get open_memo(): boolean {
        return this._open_memo;
    }

    set open_memo(value: boolean) {
        this._open_memo = value;
        this.save();
    }

    get toggle_filter_content_area(): boolean {
        return this._toggle_filter_content_area;
    }

    set toggle_filter_content_area(value: boolean) {
        this._toggle_filter_content_area = value;
        this.save();
    }


    get tmp_filter(): CustomFilter {
        return this._tmp_filter;
    }

    set tmp_filter(value: CustomFilter) {
        this._tmp_filter = value;
    }

    private save() {
        try {
            localStorage.setItem(this._table, JSON.stringify(this));
        } catch (e) {
            console.log('localstorage error')
        }
    }
}
