import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragMove, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {ViewportRuler} from '@angular/cdk/overlay';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Connect} from '../services/connect';
import {Router} from '@angular/router';
import {RecordListService} from '../services/RecordListService';
import {CrossTableHeader} from '../class/CrossTableHeader';
import {DashboardContent} from '../class/DashboardContent';
import {Dashboard} from '../class/Dashboard';

@Component({
    selector: 'dashboard-chart',
    templateUrl: './dashboard-chart.component.html',
    styleUrls: ['./dashboard-chart.component.css'],
})

export class DashboardChartComponent implements OnInit, OnChanges, AfterViewInit {
    public target: CdkDropList;
    public targetIndex: number;
    public source: CdkDropList;
    public sourceIndex: number;
    public dragIndex: number;
    public activeContainer;


    private delete_filter: CustomFilter;
    private table_label_by_table: Object = {}
    private loading_by_filter_id: Object = {}
    public LIST_IDS: Array<any>;

    public crossTableHeader_by_filter_id: Object = {};

    public data_a_by_filter_id: Object = {}

    public _filter: CustomFilter;
    public sort_params: { field: string; asc_desc: 'asc' | 'desc', cross_tab: boolean } = {
        'field': '',
        'asc_desc': 'desc',
        'cross_tab': false
    };

    @Input() dashboard: Dashboard;
    @Input() dashboard_content: DashboardContent;
    @Input() editting_id: number = null;
    @Input() customFilter: CustomFilter;
    @Input() parentComponent;
    @Input() _share;

    @Output() reordering = new EventEmitter<string>();
    @Output() reordering_done = new EventEmitter<string>();

    @Output() onClickDelete = new EventEmitter<string>();
    @Output() onClickEdit = new EventEmitter<string>();

    @ViewChild(CdkDropListGroup, {static: false}) listGroup: CdkDropListGroup<CdkDropList>;
    @ViewChild(CdkDropList, {static: false}) placeholder: CdkDropList;
    @ViewChild('chartModal', {static: false}) chartModal: any;
    @ViewChild('deleteModal', {static: false}) deleteModal: any;

    constructor(private viewportRuler: ViewportRuler, private _connect: Connect, private _router: Router) {
        this.target = null;
        this.source = null;
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges): void {
        this._filter = this.dashboard_content.customFilter
        if (!this._filter.isChart()) {

            this._share.getTableInfo(this._filter.table).subscribe(_table_info => {
                this.table_label_by_table[this._filter.table] = _table_info.getLabel()
            })
        }
        if (this._filter) {
            this.reload(this._filter)
        }
    }

    ngAfterViewInit() {
        if (this.placeholder) {
            let phElement = this.placeholder.element.nativeElement;

            phElement.style.display = 'none';
            phElement.parentElement.removeChild(phElement);
        }
    }

    addId(i, j) {
        this.LIST_IDS.push('cdk-drop-list-' + i + '' + j);
        return i + '' + j;
    }

    // drop(event: CdkDragDrop<string[]>) {
    //     let previousIndex = event.previousContainer.data['index'];
    //     let currentIndex = event.container.data['index']
    //     if(event.container.data['item']['size'] != 'large') {
    //         this.cloud_charts[previousIndex] = event.container.data['item']
    //         this.cloud_charts[currentIndex] = event.previousContainer.data['item']
    //     } else {
    //         moveItemInArray(this.cloud_charts, previousIndex, currentIndex);
    //     }
    // 	this._connect.post(`/admin/reorder-chart`, { 'id': this.currentDragItem, "old_order": previousIndex+1, "new_order": currentIndex+1 }).subscribe(() => {
    // 	}).add(() => {
    // 		this.reordering_done.emit();
    // 	})
    // }


    showEditModal(id, customFilter: CustomFilter = null) {
        this.editting_id = id;
        console.log(customFilter)
        if (customFilter) {
            this.customFilter = customFilter;
        } else {
            this.customFilter = null;
        }
        this.chartModal.show();
    }

    deleteChartModal(delete_filter: CustomFilter) {
        this.delete_filter = delete_filter
        this.deleteModal.show();

    }


    goList(_filter: CustomFilter, is_edit: boolean = false) {
        let params = {'_filter_id': _filter.id};
        if (is_edit) {
            params['_filter_edit'] = 'true'
        }
        this._router.navigate([this._share.getAdminTable(), _filter.table, params]);

    }

    getDataList(_filter: CustomFilter) {
        this._share.getTableInfo(_filter.table).subscribe(_table_info => {
            _filter.loadDataList(_table_info)
        })
    }

    sort(field: string) {
        this.sort_params['asc_desc'] = (this.sort_params['asc_desc'] === 'asc') ? 'desc' : 'asc';
        this.sort_params['field'] = field;
        this.sort_params['cross_tab'] = this.sort_params['cross_tab'] || false;

        const params = {sort_params: JSON.stringify(this.sort_params)};
        this.reload(this._filter, params);
    }

    reload(_filter: CustomFilter, params?: Record<string, any>) {
        this.loading_by_filter_id[_filter.id] = true;
        this._connect.get(this._connect.getApiUrl() + '/admin/dashboard-filter-data/' + _filter.id, params, null, false).subscribe(res => {
            this._share.getTableInfo(_filter.table).subscribe(_table_info => {
                let recordListService = new RecordListService(res, _filter, _table_info)
                this.crossTableHeader_by_filter_id[_filter.id] = recordListService.crossTableHeader;
                if (recordListService.data) {
                    //summarize mode
                    this.data_a_by_filter_id[_filter.id] = recordListService.data;

                } else {
                    this.data_a_by_filter_id[_filter.id] = recordListService.data_a;
                }
                this.loading_by_filter_id[_filter.id] = false;
            })
        }, (error) => {
            console.log(error)
            this.loading_by_filter_id[_filter.id] = false;
        })

    }

}
