import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {TableInfo} from '../class/TableInfo';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import {Router} from '@angular/router';


@Component({
    selector: 'custom-filter-pulldown',
    templateUrl: './custom-filter-pulldown.html',
})

export class CustomFilterPulldownComponent {

    //index / view / edit
    @Input('filter_type') filter_type: string = 'filter';
    @Input('mode') mode: string = 'index';
    @Input('table_info') table_info: TableInfo;
    @Input('customFilter') customFilter: CustomFilter;
    @Input('has_filter_params') has_filter_params: boolean = false;

    @Input('confirmFilterOverwriteConfirmModal') confirmFilterOverwriteConfirmModal: any;


    @Output() onReset: EventEmitter<Object> = new EventEmitter();
    @Output() onSelectFilter: EventEmitter<Object> = new EventEmitter();
    @Output() onEditFilter: EventEmitter<Object> = new EventEmitter();
    @Output() onDeleteFilter: EventEmitter<Object> = new EventEmitter();
    @Output() onDuplicateFilter: EventEmitter<Object> = new EventEmitter();

    constructor(private _connect: Connect, private _shared: SharedService, private _router: Router) {
    }

    public dragMode: boolean = false;

    @HostListener('document:keydown.shift', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        this.dragMode = true

    }

    @HostListener('document:keyup.shift', ['$event']) onKeydownHandler2(event: KeyboardEvent) {
        this.dragMode = false

    }

    getFilterTypeName() {
        if (this.filter_type === 'filter') {
            return 'フィルター'
        }
        return 'ビュー'
    }

    getFilterDisplayName() {
        if (this.customFilter && this.customFilter.id) {
            if (this.has_filter_params && !this.customFilter.id) {
                return this.customFilter.name + '(カスタム)';
            }
            return this.customFilter.name;
        }

        if (this.isFilterMode()) {
            return '(カスタム)';
        }
        return '';
    }

    isFilterMode() {

        return this.customFilter && this.customFilter.id !== null;

    }

    getFilters() {

        return this.table_info.saved_filters.filter(_filter => {
            return ((this.mode === 'index' && _filter.list_use_show_fields) || (this.mode === 'view' && _filter.view_use_show_fields) || (this.mode === 'edit' && _filter.edit_use_show_fields)) && (_filter.filter_type === this.filter_type || (this.filter_type == 'filter' && _filter.filter_type === 'mix'))
        })

    }

    resetSearch() {
        this.onReset.emit()
    }

    selectFilter(_customFilter: CustomFilter) {
        if (this.customFilter && this.customFilter.id === _customFilter.id) {
            return false;
        }
        this.onSelectFilter.emit({'filter': _customFilter});
    }

    duplicateFilter() {
        this.onDuplicateFilter.emit();
    }

    editFilter() {
        this.onEditFilter.emit();
    }

    deleteFilter() {
        this.onDeleteFilter.emit();
    }


    dropMenu($event) {

        let filters = this.getFilters()
        console.log(filters)

        moveItemInArray(filters, $event.previousIndex, $event.currentIndex);
        console.log(filters)
        this.table_info.saved_filters = filters

        this._connect.post('/admin/save-filter-order', {'filter_id_a': filters.map(f => f.id), 'table': this.table_info.table}).subscribe(res => {
            this._shared.getTableInfo(this.table_info.table, false, null, false).subscribe(table_info => {
                this.table_info = table_info
            })

        })

    }
}
