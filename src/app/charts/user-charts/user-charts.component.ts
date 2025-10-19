import {Component, Input, ViewChild, ElementRef} from '@angular/core';
import {Chart} from 'chart.js';

@Component({
    selector: 'app-user-charts',
    templateUrl: './user-charts.component.html',
})
export class UserChartsComponent {
    @Input() total_user;
    @Input() current_user;

    @ViewChild('userChart') userChart: ElementRef;

    constructor() {
    }

    ngOnChanges() {
        if (this.total_user !== undefined) {
            const ctx = this.userChart.nativeElement;
            // tslint:disable-next-line: no-unused-expression
            new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: ['ユーザー数'],
                    datasets: [{
                        label: '有効ユーザー数',
                        data: [this.current_user],
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
                                labelString: 'ユーザー数: ' + this.current_user + ' / ' + this.total_user
                                //   labelString: '使用量 (GB)'
                            },
                            ticks: {
                                beginAtZero: true,
                                min: 0,
                                max: this.total_user,
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
