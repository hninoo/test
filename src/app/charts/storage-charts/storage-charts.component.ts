import {Component, Input, ViewChild, ElementRef} from '@angular/core';
import {Chart} from 'chart.js';

@Component({
    selector: 'app-storage-charts',
    templateUrl: './storage-charts.component.html',
})
export class StorageChartsComponent {
    @Input() db_size;
    @Input() s3_size;
    @Input() total_size_GB;
    @Input() default_storage;
    @Input() db_gb;
    @Input() s3_gb;

    @ViewChild('storageChart') storageChart: ElementRef;

    constructor() {
    }

    ngOnChanges() {
        if (this.default_storage != undefined) {
            let ctx = this.storageChart.nativeElement;
            new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: ['使用量'],
                    datasets: [{
                        label: 'DB',
                        data: [this.db_gb],
                        backgroundColor: [
                            'rgba(51, 153, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(51, 153, 255, 1)'
                        ],
                        borderWidth: 1
                    },
                        {
                            label: '画像・ファイル',
                            data: [this.s3_gb],
                            backgroundColor: [
                                'rgba(255, 128, 0, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 128, 0, 1)'
                            ],
                            borderWidth: 1
                        }]
                },
                options: {
                    tooltips: {
                        mode: 'nearest',
                        callbacks: {
                            label: function (t, d) {
                                var dstLabel = d.datasets[t.datasetIndex].label;
                                var dstData = d.datasets[t.datasetIndex].data;
                                return `${dstLabel}  : ${dstData} GB`;
                            }
                        }
                    },
                    scales: {
                        xAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: '使用量: ' + (this.total_size_GB) + 'GB / ' + this.default_storage + 'GB'
                            },
                            ticks: {
                                beginAtZero: true,
                                min: 0,
                                max: this.default_storage
                            },
                            stacked: true
                        }],
                        yAxes: [{
                            stacked: true
                        }]
                    },
                    maintainAspectRatio: false,
                }
            });
        }
    }

}
