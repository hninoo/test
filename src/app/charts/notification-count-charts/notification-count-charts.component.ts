import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Chart} from 'chart.js';

@Component({
    selector: 'app-notification-count-charts',
    templateUrl: './notification-count-charts.component.html',
})
export class NotificationCountChartsComponent {
    @Input() notify_num;
    @Input() notify_limit;

    @ViewChild('tableNumChart') userChart: ElementRef;

    constructor() {
    }

    ngOnChanges() {
        if (this.notify_num !== undefined) {
            const ctx = this.userChart.nativeElement;
            // tslint:disable-next-line: no-unused-expression
            new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: ['メール通知数'],
                    datasets: [{
                        label: 'メール通知数',
                        data: [this.notify_num],
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
                                labelString: 'メール通知数: ' + this.notify_num + ' / ' + this.notify_limit
                                //   labelString: '使用量 (GB)'
                            },
                            ticks: {
                                beginAtZero: true,
                                min: 0,
                                max: this.notify_limit,
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
