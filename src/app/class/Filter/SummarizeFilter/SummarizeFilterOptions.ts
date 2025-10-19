import {Objectable} from '../../Objectable';

export class SummarizeFilterOptions extends Objectable {
    //塗りつぶし
    private _fill: boolean = false;
    //累積
    private _sum: boolean = false;

    private _sum_previous: boolean = false;
    private _compare_previous: boolean = false;
    private _enable_totaling_start_month: boolean = false;
    //set minimum value setting for Y-axis 
    private _y_min_start: number = 0;
    private _hide_zero_data: boolean = false;
    private _do_not_show_legend_if_over_6_more: boolean = false;
    //積み上げ棒グラフ
    private _stacked: boolean = false;
    private _stacked_100per: boolean = false;

    // パイチャート％表示
    private _percent_label: boolean = false;

    // 平均NPSドーナッツチャート表示
    private _nps_flg: boolean = false;
    private _nps_color: string = 'Lignt Pink';

    constructor(hash) {
        super();
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }


    get fill(): boolean {
        return this._fill;
    }

    set fill(value: boolean) {
        this._fill = value;
    }

    get sum(): boolean {
        return this._sum;
    }

    set sum(value: boolean) {
        this._sum = value;
        if( value ) this.hide_zero_data = false;
    }

    get sum_previous(): boolean {
        return this._sum_previous;
    }

    set compare_previous(value: boolean) {
        this._compare_previous = value;
    }
    get compare_previous(): boolean {
        return this._compare_previous;
    }

    set enable_totaling_start_month(value: boolean) {
        this._enable_totaling_start_month = value;
    }
    get enable_totaling_start_month(): boolean {
        return this._enable_totaling_start_month;
    }

    set y_min_start(value: number) {
        this._y_min_start = value;
    }
    get y_min_start(): number {
        return this._y_min_start;
    }

    set hide_zero_data(value: boolean) {
        this._hide_zero_data = value;
    }
    get hide_zero_data(): boolean {
        return this._hide_zero_data;
    }

    set do_not_show_legend_if_over_6_more(value: boolean) {
        this._do_not_show_legend_if_over_6_more = value;
    }
    get do_not_show_legend_if_over_6_more(): boolean {
        return this._do_not_show_legend_if_over_6_more;
    }

    set sum_previous(value: boolean) {
        this._sum_previous = value;
    }

    get stacked(): boolean {
        return this._stacked;
    }

    set stacked(value: boolean) {
        this._stacked = value;
    }

    get stacked_100per(): boolean {
        return this._stacked_100per;
    }

    set stacked_100per(value: boolean) {
        this._stacked_100per = value;
    }

    get percent_label(): boolean {
        return this._percent_label;
    }

    set percent_label(value: boolean) {
        this._percent_label = value;
    }

    get nps_flg(): boolean {
        return this._nps_flg;
    }

    set nps_flg(value: boolean) {
        this._nps_flg = value;
    }

    get nps_color(): string {
        return this._nps_color;
    }

    set nps_color(colors: string) {
        this._nps_color = colors;
    }
}
