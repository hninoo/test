import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Chart} from 'chart.js';

@Component({
    selector: 'app-table-num-charts',
    templateUrl: './table-num-charts.component.html',
})
export class TableNumChartsComponent {
    @Input() table_num;
    @Input() max_table_num;

    @ViewChild('tableNumChart') userChart: ElementRef;

    constructor() {
    }

    ngOnChanges() {
        if (this.table_num !== undefined) {
            const ctx = this.userChart.nativeElement;
            // tslint:disable-next-line: no-unused-expression
            new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: ['テーブル数'],
                    datasets: [{
                        label: 'テーブル数',
                        data: [this.table_num],
                        backgroundColor: [
                            'rgba(76, 153, 0, 0.2)'
                        ],
                        borderColor: [
                            'rgba(76, 153, 0, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        xAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: 'テーブル数: ' + this.table_num + ' / ' + this.max_table_num
                                //   labelString: '使用量 (GB)'
                            },
                            ticks: {
                                beginAtZero: true,
                                min: 0,
                                max: this.max_table_num,
                                callback: (value) => {
                                    let intvalue=Number(value);
                                    if (Math.floor(intvalue) === value) {
                                        return value;
                                    }
                                }
                            },
                            stacked: true
                        }]
                    },
                    maintainAspectRatio: false,
                }
            });
        }
    }
}
