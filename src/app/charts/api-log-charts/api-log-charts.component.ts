import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Chart} from 'chart.js';

@Component({
    selector: 'app-api-log-charts',
    templateUrl: './api-log-charts.component.html',
})
export class ApiLogChartsComponent {
    @Input() apiLogData: { [key: string]: any } = {};

    @ViewChild('apiLogChart') userChart: ElementRef;

    constructor() {
    }

    ngOnChanges() {
        if (this.apiLogData) {
            const ctx = this.userChart.nativeElement;
            // tslint:disable-next-line: no-unused-expression
            new Chart(ctx, {
                type: 'horizontalBar', // Change to 'bar' for vertical bar chart
                data: {
                    labels: [this.apiLogData.ym],
                    datasets: [{
                        label: 'API ログ数',
                        data: [this.apiLogData.count],
                        backgroundColor: 'rgba(76, 153, 0, 0.2)',
                        borderColor: 'rgba(76, 153, 0, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        xAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: 'API ログ数'
                            },
                            ticks: {
                                beginAtZero: true,
                                min: 0,
                                max: this.apiLogData.count,
                                callback: (value) => {
                                    let intvalue = Number(value);
                                    if (Math.floor(intvalue) === value) {
                                        return value;
                                    }
                                }
                            },
                            stacked: true
                        }],
                        // yAxes: [{
                        //     scaleLabel: {
                        //         display: true,
                        //         labelString: '月'
                        //     }
                        // }]
                    },
                    maintainAspectRatio: false,
                }
            });
        }
    }

    getTotalCount(): number {
        if ( ! this.apiLogData ) return 0;
        return this.apiLogData.reduce((sum, item) => sum + item.count, 0);
    }
}
