import {Objectable} from '../../Objectable';
import {Conditions} from '../../Conditions';

export class SummarizeFilterSummary extends Objectable {
    //sum, avg , max, min
    private _label: string = null;
    private _summary_field: string;
    private _summary_type: string = 'count';

    private _is_edit_mode: boolean = false;


    //extend
    private _summary_table: string;

    private _conditions: Conditions = null;

    protected array_ignore_fields = ['conditions']

    private _summary_field_type: string = 'table_field';

    private _calc_value: string = null;

    //for chart
    private _graph_type: string = 'line'

    constructor(hash) {
        super();
        this._conditions = new Conditions()
        delete hash['conditions']
        for (const key of Object.keys(hash)) {
            if (key == 'condition_json') {

                this.conditions.setByJson(hash[key])
            } else {
                this['_' + key] = hash[key];
            }
        }
        /*
        if(this._summary_table){
            this._summary_field_type = 'other_table_field'
        }
         */
    }

    set label(value: string) {
        this._label = value;
    }

    get label(): string {
        return this._label;
    }

    get summary_type(): string {
        return this._summary_type;
    }

    set summary_type(value: string) {
        this._summary_type = value;
    }

    get summary_field(): string {
        return this._summary_field;
    }

    set summary_field(value: string) {
        this._summary_field = value;
    }

    get is_edit_mode(): boolean {
        return this._is_edit_mode;
    }

    set is_edit_mode(value: boolean) {
        this._is_edit_mode = value;
    }


    get summary_table(): string {
        return this._summary_table;
    }

    set summary_table(value: string) {
        this._summary_table = value;
    }


    get use_other_table(): boolean {
        return this._summary_field_type === 'other_table_field'
    }


    get conditions(): Conditions {
        return this._conditions;
    }

    set conditions(value: Conditions) {
        this._conditions = value;
    }

    get summary_field_type(): string {
        return this._summary_field_type;
    }

    set summary_field_type(value: string) {
        this._summary_field_type = value;
        if (value != 'other_table_field') {
            this._summary_table = null;
            this._conditions = null;
            this.summary_field = 'id'
        }
    }


    get calc_value(): string {
        return this._calc_value;
    }

    set calc_value(value: string) {
        this._calc_value = value;
    }


    get graph_type(): string {
        return this._graph_type;
    }

    set graph_type(value: string) {
        this._graph_type = value;
    }

    getLabel(i: number) {
        return this._label ? this._label : '集計項目' + (i + 1);
    }

    toArray(): any {
        let ary = super.toArray();
        if (this.conditions) {
            ary['condition_json'] = this.conditions.getSearchParamJson()
        }
        return ary;
    }
}
