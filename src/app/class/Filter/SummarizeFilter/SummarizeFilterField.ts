import {Objectable} from '../../Objectable';

export class SummarizeFilterField extends Objectable {


    private _field: string;
    private _label: string;
    private _term: string;
    private _term_month_start: number;
    private _term_year_start: number;
    private _is_date: boolean = false;
    private _term_field: boolean = false;

    //別のテーブルの項目を持ってくる場合
    private _table: string;


    constructor(hash) {
        super();
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }

    }

    get term_field(): boolean {
        return this._term_field;
    }

    set term_field(value: boolean) {
        this._term_field = value;
    }


    get field(): string {
        return this._field;
    }

    set field(value: string) {
        this._field = value;
    }

    get label(): string {
        return this._label;
    }

    set label(value: string) {
        this._label = value;
    }

    get is_date(): boolean {
        return this._is_date;
    }

    set is_date(value: boolean) {
        this._is_date = value;
    }

    get term(): string {
        return this._term;
    }

    set term(value: string) {
        this._term = value;
    }

    get term_month_start(): number {
        return this._term_month_start;
    }

    set term_month_start(value: number) {
        this._term_month_start = value;
    }

    get term_year_start(): number {
        return this._term_year_start;
    }

    set term_year_start(value: number) {
        this._term_year_start = value;
    }

    get table(): string {
        return this._table;
    }


    set table(value: string) {
        this._table = value;
    }

}
