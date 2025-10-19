import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { SharedService } from '../../services/shared';

interface Breadcrumb {
    name: string;
}

@Component({
    selector: 'breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent implements OnInit, OnChanges {
    @Input() breadcrumbs: Breadcrumb[];
    constructor(public _share: SharedService) {
    }
    ngOnInit() {
        console.log('breadcrumbs init');
        console.log(this.breadcrumbs);
    }
    ngOnChanges(): void {
        if (this.breadcrumbs && this.breadcrumbs.length > 0) {
            let tabTitle = '';

            if (this.breadcrumbs.length == 1) {
                tabTitle = `${this.breadcrumbs[0].name}一覧 - PigeonCloud`;
            } else {
                const lastBreadcrumb = this.breadcrumbs[this.breadcrumbs.length - 1]?.name || '';
                const secondLastBreadcrumb = this.breadcrumbs[this.breadcrumbs.length - 2]?.name || '';

                const matchResult = lastBreadcrumb.match(/(.+)\s\(ID:\s(\d+)\)/);

                if (matchResult) {
                    const formattedString = `${matchResult[1]}-${matchResult[2]}`;
                    tabTitle = `${secondLastBreadcrumb} ${formattedString} - PigeonCloud`;
                } else {
                    tabTitle = `${lastBreadcrumb}一覧 - PigeonCloud`;
                }
            }

            const dynamicTabTitle = document.getElementById('dynamic-tab-title');
            if (dynamicTabTitle) {
                dynamicTabTitle.innerText = tabTitle;
            }
        }
    }
}
