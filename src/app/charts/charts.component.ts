import {Component, Input, OnInit, ViewChild} from '@angular/core';

@Component({
    selector: 'charts',
    templateUrl: './charts.component.html',
})

export class ChartsComponent implements OnInit {
    @Input('chart') chart;

    public display: string;
    public data_all: Array<any>;
    public chart_labels: Array<any>;

    ngOnInit() {
        this.display = '30';
        this.data_all = this.chart['lineChartData'][0]['data'].slice();
        this.set(-30);
    }

    onChange(e) {
        if (this.display === '30') {
            this.set(-30);
        } else {
            this.set(0);
        }
    }

    set(num) {
        this.chart['lineChartData'][0]['data'] = this.data_all.slice(num);
        this.chart_labels = this.chart['lineChartLabels'].slice(num);
    }

}
