import {SummarizeFilterField} from './SummarizeFilterField';
import {SummarizeFilterSummary} from './SummarizeFilterSummary';
import {Objectable} from '../../Objectable';
import {SummarizeFilterOptions} from './SummarizeFilterOptions';
import {TableInfo} from '../../TableInfo';

export class SummarizeFilter extends Objectable {
    get max_field_num(): number {
        return this._max_field_num;
    }

    protected array_ignore_fields = ['CHART_TYPES'];

    //for summarize

    // chart or table or lineChart
    private _type: string = null;
    private _fields: Array<SummarizeFilterField> = [];
    private _summary_a: Array<SummarizeFilterSummary> = [];
    private _options: SummarizeFilterOptions;

    //for croww table
    //クロス集計
    private _cross_table: boolean = false;

    //for chart
    private _size: string = null;
    private _color: string = null;

    private _max_field_num: number = 1;

    public CHART_TYPES: Array<Object> = [
        {
            'name': '線グラフ',
            'value': 'line',
            'field_num': 2
        },
        {
            'name': '棒グラフ',
            'value': 'bar',
            'field_num': 2
        },
        {
            'name': '横棒グラフ',
            'value': 'horizontalBar',
            'field_num': 2
        },
        {
            'name': 'パイチャート',
            'value': 'pie',
            'field_num': 1
        },
        {
            'name': 'ドーナツチャート',
            'value': 'doughnut',
            'field_num': 1
        },
        {
            'name': 'レーダーチャート',
            'value': 'radar',
            'field_num': 1
        },
        {
            'name': '鶏頭図',
            'value': 'polarArea',
            'field_num': 1
        },
        {
            'name': '散布図',
            'value': 'scatter',
            'field_num': 2
        },
    ];

    isStacked(): boolean {
        return !!this._options['stacked'];
    }

    isStacked100per(): boolean {
        return !!this._options['stacked_100per'];
    }

    get type(): string {
        return this._type;
    }

    getGraphType(): string {
        if (this.summary_a.length == 0) {
            return null;
        }
        return this.summary_a[0].graph_type
    }


    set options(value: SummarizeFilterOptions) {
        this._options = value;
    }

    get color(): string {
        return this._color;
    }

    set type(value: string) {
        this._type = value;
        let option = this.CHART_TYPES.find((type) => type['value'] === value);
        if (option) {
            this._fields = this._fields.slice(0, option['field_num'])
            this._max_field_num = option['field_num'];
        }

    }

    set color(value: string) {
        this._color = value;
    }

    set size(value: string) {
        this._size = value;
    }

    get size(): string {
        return this._size;
    }

    get fields(): Array<SummarizeFilterField> {
        return this._fields;
    }

    get summary_a(): Array<SummarizeFilterSummary> {
        return this._summary_a;
    }

    get options(): SummarizeFilterOptions {
        return this._options;
    }


    get cross_table(): boolean {
        return this._cross_table;
    }

    set cross_table(value: boolean) {
        this._cross_table = value;
    }

    public setFieldMaxNum(max_num: number) {
        this._fields = this._fields.slice(0, max_num);
    }

    addFieldFilter(hash) {
        this._fields.push(new SummarizeFilterField(hash))
    }

    addSummaryFilter(hash) {
        this._summary_a.push(new SummarizeFilterSummary(hash))
    }

    constructor(hash = null) {
        super();
        if (!hash) {
            return;
        }
        //default
        this.type = 'line'
        this.size = 'medium'
        this.color = 'office.Habitat6'

        this.options = new SummarizeFilterOptions({})
        for (const key of Object.keys(hash)) {
            if (key == 'fields') {
                hash[key].forEach(field_hash => {
                    this._fields.push(new SummarizeFilterField(field_hash))
                })


            } else if (key == 'summary_a') {
                hash[key].forEach(summary_hash => {
                    this._summary_a.push(new SummarizeFilterSummary(summary_hash))
                })
            } else if (key == 'summary') {
                this._summary_a.push(new SummarizeFilterSummary({'summary_field': hash['summary_field'], 'summary_type': hash['summary']}))
            } else if (key == 'options') {
                this.options = new SummarizeFilterOptions(hash[key])
            } else {
                this['_' + key] = hash[key];
            }
        }
    }

    getXterm(): string {
        if (!this.fields || this.fields.length == 0) {
            return null;
        }
        return this.fields[0].term;
    }

    getStepSize(table_info: TableInfo): number {
        return null
        if (this._summary_a.length == 0) {
            return null;
        }
        if (this._summary_a[0].summary_type === 'avg') {
            return null;
        }
        if (this._summary_a[0].summary_type === 'count') {
            return 1;
        }
        /*
        let form = table_info.forms.byFieldName(this._summary_a[0].summary_field)
        if (form) {
            if (form.field['Field'] === 'id' || form.isInteger()) {
                return 1;
            }
        }
         */

        return null;
    }

    getCrossTableSummaryType(): string {
        return this._summary_a[0].summary_type;

    }
}
