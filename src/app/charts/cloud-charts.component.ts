import {interval} from 'rxjs';
import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import 'chartjs-plugin-stacked100';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import {Chart} from 'chart.js';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Router} from '@angular/router';
import {Dashboard} from '../class/Dashboard';

@Component({
    selector: 'cloud-charts',
    templateUrl: './cloud-charts.component.html',
})

export class CloudChartsComponent implements OnChanges, AfterViewInit {
    @Input() dashboard: Dashboard;
    @Input() customFilter: CustomFilter;
    @Input() type; // table or chart
    @Input() add_link: boolean = false; // table or chart
    @Output() onClickDelete = new EventEmitter<string>();
    @Output() onClickEdit = new EventEmitter<string>();

    private chart: Object = {};

    public page = 0;
    public is_date = false;
    public chart_labels: Array<any>;

    public date_str = '';


    @ViewChild('myChart')
    private myChart: ElementRef;
    public chartJsObj: any = null;

    public display_text: string = null;

    public title: string = null;


    constructor(private _connect: Connect, private _share: SharedService, private changeDetectionRef: ChangeDetectorRef, private _router: Router) {
        this.chartJsObj = null;

    }

    ngAfterViewInit(): void {
        this.page = 0;
        if (this.customFilter) {
            this.loadChartData()
            this._share.getTableInfo(this.customFilter.table).subscribe(_table_info => {
                this.title = '【' + _table_info.getLabel() + '】 '
            })
        }
        this.changeDetectionRef.detectChanges();
        console.log('[CloudChartsComponent] ngAfterViewInit() 完了');
    }

    ngOnInit() {
        this.page = 0;
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes.customFilter) {
            this.loadChartData()

        }
        console.log('[CloudChartsComponent] ngOnChanges() 開始', changes);
        // loadChartData()はngAfterViewInit()で呼び出すため、ここでは呼び出さない
        console.log('[CloudChartsComponent] ngOnChanges() 完了');
    }


    loadChartData() {
        if (!this.customFilter.summarizeFilter || !this.customFilter.summarizeFilter.summary_a || this.customFilter.summarizeFilter.fields.length == 0) {
            return;
        }
        this.is_date = this.customFilter.summarizeFilter.fields[0].is_date;
        if (this.customFilter.summarizeFilter.type == 'horizontalBar') {
            this.is_date = false;
        }
        // validate
        const validated = this.customFilter.summarizeFilter.type !== '';

        if (!validated) {
            return false;
        }

        this.chart = {
            'type': this.customFilter.summarizeFilter.getGraphType(),
            'title': this.customFilter.name,
        }
        let color = this._share.chartColorSchemas[0];
        if (this.customFilter.summarizeFilter.color) {
            color = this.customFilter.summarizeFilter.color;

        }
        this.chart['options'] = {
            onResize: (chart, size) => {
                this.resizeChartBasedOnLegendItems(chart);
            },
            plugins: {
                colorschemes: {
                    scheme: color,
                },
                stacked100: {enable: this.customFilter.summarizeFilter.options.stacked_100per},
            },
        }

        this.chart['options']['use_comma_x'] = true;
        this.chart['options']['use_comma_y'] = true;

        if (this.is_date) {
            const unit = this.customFilter.summarizeFilter.fields[0].term;
            this.chart['options']['scales'] = {
                xAxes: [{
                    stacked: this.customFilter.summarizeFilter.isStacked(),
                    type: 'time',
                    time:
                        {
                            unit: unit,
                            displayFormats: {
                                year: 'YYYY年',
                                month: 'M月',
                                day: 'M月D日',
                            },
                        },
                    offset: true

                }],
                yAxes: [
                    {
                        id: 'A',
                        stacked: this.customFilter.summarizeFilter.isStacked(),
                        ticks: {
                            callback: function (value, index, values) {
                                return (typeof value === 'number' && this.chart.options['use_comma_y'] == true)
                                    ? value.toLocaleString()
                                    : value; // Apply comma separator only for numeric values
                            }
                        }
                    }
                ]
            };

        } else {
            this.chart['options']['scales'] = {
                xAxes: [
                    {
                        stacked: this.customFilter.summarizeFilter.isStacked(),
                        ticks: {
                            callback: function (value, index, values) {
                                return (typeof value === 'number' && this.chart.options['use_comma_x'] == true)
                                    ? value.toLocaleString()
                                    : value; // Apply comma separator only for numeric values
                            }
                        }
                    }
                ],
                yAxes: [
                    {
                        stacked: this.customFilter.summarizeFilter.isStacked(),
                        ticks: {
                            beginAtZero: true,
                            userCallback: function (label, index, labels) {
                                if (Math.floor(label) === label) {
                                    return (typeof label === 'number' && this.chart.options['use_comma_y'] == true)
                                        ? label.toLocaleString()
                                        : label; // Apply comma separator only for numeric values
                                }
                            }
                        }
                    }
                ]

            }
            if (this.chart['type'] === 'scatter') {
                //X,Yのラベルを付ける
                this._share.getTableInfo(this.customFilter.table).subscribe(_table_info => {
                    let field_x = this.customFilter.summarizeFilter.fields[0].field;
                    let field_y = this.customFilter.summarizeFilter.fields[1].field;

                    this.chart['options']['scales']['xAxes'][0]['scaleLabel'] = {labelString: _table_info.forms.byFieldName(field_x).label, display: true};
                    this.chart['options']['scales']['yAxes'][0]['scaleLabel'] = {labelString: _table_info.forms.byFieldName(field_y).label, display: true};
                })

            }
        }
        //change Scales xAxes Type
        if (this.customFilter.summarizeFilter.options.compare_previous && ['month', 'day'].includes(this.customFilter.summarizeFilter.fields[0].term)){
            this.chart['options']['scales']['xAxes'][0].type = "category";
        }
        //Set Scales yAxes min start value
        this.chart['options']['scales']['yAxes'][0].ticks.min = this.customFilter.summarizeFilter.options.y_min_start;

        this.customFilter.getStepSize(this._share).subscribe(stepSize => {
            if (stepSize) {
                this.chart['options']['scales']['yAxes'][0]['ticks']['stepSize'] = stepSize;
            }
            if (this.customFilter.summarizeFilter.type == 'horizontalBar') {
                //横棒チャートの場合
                //convert X and Y
                let _tmp = this.chart['options']['scales']['xAxes'];
                this.chart['options']['scales']['xAxes'] = this.chart['options']['scales']['yAxes'];
                this.chart['options']['scales']['yAxes'] = _tmp;
            }
            if (this.chartJsObj) {
                this.chartJsObj.destroy();
                this.chartJsObj = null;
            }
            if (this.customFilter && this.customFilter.data) {
                this.setChartData(this.customFilter.data)
            } else {
                const params = this.customFilter.getFilterParam();
                params['page'] = this.page;
                this._connect.post('/admin/chart-data', params, {}, false).subscribe((result) => {
                    if (result['data'] === null || result['data'] === undefined) {
                        return;
                    }
                    this.setChartData(result['data'])
                }, (error) => {
                    this.display_text = 'NO TABLE'
                    console.log('chart error')
                });
            }
        })


    }

    setChartData(data: Object) {
        this.chart['data'] = data['data'];
        if (this.is_date) {
            this.chart['data']['datasets'].forEach(dataset => {
                if (dataset['data'] !== null) {
                    dataset['data'].map((data) => {
                        if (data['x'] !== undefined && (typeof data['x'] === 'string' || data['x'] instanceof String)) {
                            // datetimeの場合
                            data['x'] = new Date(data['x'].replace(/-/g, '/'));
                            return data
                        }
                    });
                }
            });
        }
        if (this.customFilter.summarizeFilter.options.hide_zero_data) {

            if (this.is_date) {
                //skip invalid date error in pie chart
                if (this.chart['type'] == 'pie') {
                    if (this.chart['data']['datasets'][0]['data'].length == 0) this.chart['options']['scales']['xAxes'][0]['distribution'] = 'series'
                } else {
                    this.chart['options']['scales']['xAxes'][0]['distribution'] = 'series'
                }
            }
        }

        // パイチャートでパーセント表示をする場合
        if (this.chart['type'] == 'pie' && this.customFilter.summarizeFilter.options.percent_label) {
            this.withPercent();
        }
        // NPS平均のドーナットチャーっと
        if(this.customFilter.summarizeFilter.options.nps_flg){
            this.showNps();
        }
        // if( this._share.admin_setting ){
        //     this.chart['options']['use_comma_x'] = this._share.admin_setting['use_comma'];
        //     this.chart['options']['use_comma_y'] = this._share.admin_setting['use_comma'];
        // }
        this._share.getTableInfo(this.customFilter.table).subscribe(_table_info => {
            // Extract the field name for the x-axis
            let field_x = this.customFilter.summarizeFilter.fields[0].field;

            // Check if 'num_separator' exists in the custom fields for the x-axis
            if (_table_info.forms.byFieldName(field_x) && 'num_separator' in _table_info.forms.byFieldName(field_x).custom_field) {
                this.chart['options']['use_comma_x'] = !_table_info.forms.byFieldName(field_x).custom_field['num_separator'];
            }

            // Filter and extract y-axis fields that are not of type 'count' and have a summary field
            let y_fields = this.customFilter.summarizeFilter.summary_a.filter(summary => summary.summary_type != 'count' && summary.summary_field);

            if (y_fields.length > 0) {
                // Extract the first y-axis field
                let field_y = y_fields[0].summary_field;

                // Check if 'num_separator' exists in the custom fields for the y-axis
                if (_table_info.forms.byFieldName(field_y) && 'num_separator' in _table_info.forms.byFieldName(field_y).custom_field) {
                    this.chart['options']['use_comma_y'] = !_table_info.forms.byFieldName(field_y).custom_field['num_separator'];
                }
            }
        });


        this.date_str = data['date_str'];
        this.reloadChart()
    }

    reloadChart() {
        // console.time('reload_chart');


        if (this.chartJsObj) {
            this.chartJsObj.destroy();
            this.chartJsObj = null;
        }
        if (this.myChart === undefined) {
            console.log('myChart not found')
        }
        const canvas = this.myChart.nativeElement;
        const ctx = canvas.getContext('2d');

        // datetime
        //const chart_data = {...this.chart}

        /*
        chart_data['data']['datasets'][0]['data'].map((data)=>{data['x'] = new Date(data['x']);return data});
        console.log(this.chart)
         */

        console.log(this.chart)

        this.chartJsObj = new Chart(ctx, this.chart)
        // Display the legend if the number of legend items is less than or equal to 6
        if( this.chartJsObj.legend.legendItems.length >= 6 && this.customFilter.summarizeFilter.options.do_not_show_legend_if_over_6_more ){
            // Hide the legend
            this.chartJsObj.legend.options.display = false;

            // Update the chart
            this.chartJsObj.update();
        }


        // Call the function to resize the chart based on the number of legend items
        this.resizeChartBasedOnLegendItems();
    }

    // Function to resize the chart based on the number of legend items
    resizeChartBasedOnLegendItems( chart = this.chartJsObj ) {
        const canvasParent = chart.canvas.parentNode;
        const grandParent = canvasParent.parentNode;
        let   isDashboard =  document.querySelector('dashboard-chart') as HTMLElement;

        if (chart.legend.legendItems.length > 10) {

            chart.options.maintainAspectRatio = false;

            // Base height of the chart canvas
            const baseHeight = 250; // Base height of the parent element
            // Calculate the new height of the chart canvas
            const newHeight = chart.legend.minSize.height + baseHeight;

            // Update the height of the canvas and its parent container
            if (grandParent && isDashboard) {
                grandParent.style.height = `347px`;
                grandParent.style.overflowY = `scroll`;
            }

            if (canvasParent) {
                canvasParent.style.height = `${newHeight}px`;
            }

            // Resize the chart
            chart.resize();
        } else {
            // Reset the chart to its original size
            chart.options.maintainAspectRatio = true;

            if (grandParent && isDashboard) {
                grandParent.style.height = `auto`;
                grandParent.style.overflowY = `auto`;
            }

            if (canvasParent) {
                canvasParent.style.height = `auto`;
            }

            chart.resize();
        }

    }

    changePage(page) {
        this.page = page;
        this.loadChartData();
    }

    isShowPaging() {
        if (!this.customFilter || !this.customFilter.summarizeFilter) {
            return false;
        }
        if (this.customFilter.summarizeFilter.getXterm() === 'year' && !this.is_date) {
            // ｘ軸が日付でない時は、yearは動かせる
            return true;
        }

        let xterm = this.customFilter.summarizeFilter.getXterm();
        return ['year', 'all'].indexOf(xterm) === -1;
    }

    goToTable() {
        this._router.navigate([this._share.getAdminTable(), this.customFilter.table, {'_filter_id': this.customFilter.id}]);
    }

    withPercent() {
        // プラグイン設定
        this.chart['plugins'] = [ChartDataLabels]
        this.chart['options']['plugins']['datalabels'] = {
            display: true,
            color: 'white',
            font: {
                weight: 'bold',
                size: 16
            },
            formatter: (value, ctx) => {
                return value + '%';
            },
        }

        // パーセント計算
        var dataSum = 0;
        this.chart['data']['datasets'][0]['data'].forEach(function (element) {
            dataSum += element;
        });
        const sum = this.chart['data']['datasets'][0]['data'].reduce((total, value) => total + value, 0);
        const percentages = this.chart['data']['datasets'][0]['data'].map(value => ((value / sum) * 100).toFixed(1))
        this.chart['data']['datasets'][0]['data'] = percentages;
    }

    // NPS集計テーブルで平均NPSを表示する場合専用
    showNps() {
        const color = {
            'Lignt Pink':'#F5CEC7',
            'Moderate Pink':'#E79796',
            'Light Salmon':'#FFB284',
            'Light Orange':'#FFC98B',
            'Muted Green':'#C6C09C',
        }

        // 汎用的にする場合、selectboxでレコードと項目名(数値限定)を選択できるようにする
        // レコードをループして、chartの値と一致するときの[data]のindexを取ればいけるか?
        const value = this.chart['data']['datasets'][0]['data'][0]
        // 汎用的にする場合、平均NPSの部分をレコード名に変える?
        this.chart['data']['labels'] = ['平均NPS', ' ']
        this.chart['data']['datasets'][0]['data'].push(100 - value);
        this.chart['data']['datasets'][0]['backgroundColor'] = [color[this.customFilter.summarizeFilter.options.nps_color], '#D3D3D3'];

        this.chart['plugins'] = [{
            beforeDraw: function (chart) {
                const ctx = chart.chart.ctx;
                const width = chart.chart.width;
                const height = chart.chart.height;
                const valuePercent = value ? value.toFixed(1) + '%' : 0;
                const fontSize = (height / 130).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                const text = valuePercent,
                    textX = Math.round((width - ctx.measureText(text).width) / 2),
                    textY = height / 2;

                ctx.fillText(text, textX, textY);
            }
        }];
    }
}

