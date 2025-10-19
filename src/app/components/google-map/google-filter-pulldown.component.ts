import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { TableInfo } from '../../class/TableInfo';
import { GoogleMapFilter } from '../../class/Filter/GoogleMapFilter';
import { Connect } from '../../services/connect';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../services/shared';

@Component({
    selector: 'google-filter-pulldown',
    templateUrl: './google-filter-pulldown.component.html',
})
export class GoogleFilterPulldownComponent implements OnInit {
    @Input() table_info: TableInfo;
    @Input() currentTable: string;
    @Input() googleMapFilter: GoogleMapFilter;
    @Output() onSelectFilter = new EventEmitter<GoogleMapFilter>();
    @Output() onDeleteFilter = new EventEmitter<number>();
    @Output() onEditFilter = new EventEmitter<GoogleMapFilter>();
    @Output() onResetFilter = new EventEmitter<void>();

    public filters: Array<any> = [];
    public user_id: number;
    public currentFilter: GoogleMapFilter | null = null;

    constructor(
        private _connect: Connect,
        private toastr: ToastrService,
        private _share: SharedService
    ) {}

    ngOnInit() {
        this.user_id = this._share?.user?.id;
    }

    ngOnChanges(changes: any) {
        if (this.googleMapFilter?.id !== this.currentFilter?.id || changes['currentTable']) {
            this.currentFilter = null;
            this.loadFilters();
        }
    }

    loadFilters() {
        const pathSegments = window.location.pathname.split(';');

        this._connect.get(`/admin/google-map-filters/${this.currentTable}`).subscribe(
            (response) => {
                if (response['filters']) {
                    this.filters = response['filters'].map(filterData => {
                        const params = JSON.parse(filterData.params_json || '{}');
                        const filterInstance = new GoogleMapFilter({
                            ...filterData,
                            ...params
                        });
                        filterInstance.editable = filterData.editable;
                        filterInstance.visible = filterData.visible;
                        return filterInstance;
                    });
                }
                if (this.googleMapFilter && this.googleMapFilter.name) {
                    this.selectFilter(this.googleMapFilter);
                }
            },
            (error) => {
                this.toastr.error('フィルターの読み込みに失敗しました。', 'エラー');
                console.error('Load filters error:', error);
            }
        );
    }

    getFilterDisplayName(): string {
        this.currentFilter = this.filters.find(filter => filter.id === this.googleMapFilter?.id);
        if (this.currentFilter && this.currentFilter.name) {
            return this.currentFilter.name;
        }
        return '色設定なし';
    }

    selectFilter(filter: GoogleMapFilter) {
        this.onSelectFilter.emit(filter);
        this.currentFilter = filter;
    }

    deleteFilter(id: number) {
        if (confirm('このフィルターを削除してもよろしいですか？')) {
            this._connect.post('/admin/delete-google-map-filter', { id }).subscribe(
                (response) => {
                    if (response['success']) {
                        this.toastr.success('フィルターを削除しました。', '成功');
                        this.loadFilters();
                        this.onDeleteFilter.emit(id);
                        if (this.currentFilter && this.currentFilter.id === id) {
                            this.resetFilter();
                        }
                    } else {
                        this.toastr.error(response['message'] || '削除に失敗しました。', 'エラー');
                    }
                },
                (error) => {
                    this.toastr.error('削除中にエラーが発生しました。', 'エラー');
                    console.error('Delete filter error:', error);
                }
            );
        }
    }

    editFilter() {
        this.onEditFilter.emit(this.currentFilter);
    }

    resetFilter() {
        this.currentFilter = null;
        this.onResetFilter.emit();
    }
} 
