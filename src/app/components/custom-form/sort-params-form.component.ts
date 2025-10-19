import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {SortParam} from '../../class/Filter/SortParam';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import { Connect } from '../../services/connect';

@Component({
    selector: 'sort-params-form',
    templateUrl: './sort-params-form.component.html'
})
export class SortParamsFormComponent implements OnChanges {


    @Input() sort_params: Array<SortParam> = [];
    @Input() form_a: TableInfo = null;

    @Input() table_info: TableInfo = null;
    @Input() table: string = null;


    //集計項目用
    @Input() filter: CustomFilter = null;

    @Output() onChangeValue: EventEmitter<Object> = new EventEmitter();


    constructor(private _shared: SharedService, private _connect: Connect) {
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (this.table) {
            this._connect.post('/admin/table/grant/' + this.table, {}).subscribe(
                (data) => {
                    if (data.view_grant == false) return
                    this._shared.getTableInfo(this.table).subscribe(_table_info => {
                        this.table_info = _table_info
                    })
                }
            )
        }

        if (!this.sort_params) {
            this.sort_params = [];
        }
    }


    onChange() {
        this.onChangeValue.emit({
            'value': this.sort_params
        })
    }

    public addSortParam(field: string, asc_desc: string = 'asc') {
        this.sort_params.push(new SortParam(field, asc_desc))
        this.onChange()
    }

    public deleteSortParam(index: number) {
        this.sort_params.splice(index, 1)
        this.onChange()
    }


    canOrder(field): boolean {
        const form = this.table_info.forms.byFieldName(field);
        if(form.field_name === 'id') return true;

        if(form.field_name === 'current_at') return false;
        if(form.field_name === 'google_calendar') return false;

        return form && form.original_type !== 'fixed_html' && form.original_type !== 'relation_table' && form.custom_field && !form.custom_field['is_multi_value_mode'];
    }
}
