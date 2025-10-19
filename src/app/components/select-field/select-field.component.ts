import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {SimpleTableInfo} from '../../class/SimpleTableInfo';
import {Form} from '../../class/Form';
import {Conditions} from '../../class/Conditions';

@Component({
    selector: 'select-field',
    templateUrl: './select-field.component.html',
})

export class SelectFieldComponent implements OnInit, OnChanges {

    //required
    @Input() table_name: string = null;
    // @ts-ignore
    @Input() field_name: string = null;
    @Input() filter_id: number = null;

    //arbitrary
    @Input() exclude_table_name_a: Array<string> = [];
    @Input() condition_target_form_a: Array<Form>;
    @Input() conditions: Conditions;
    @Input() is_select_field: boolean = true;
    @Input() id_prefix: string = '';
    @Input() use_condition: boolean = true;
    @Input() disabled: boolean = false;

    @Output() valueChange: EventEmitter<Object> = new EventEmitter();


    public selected_table_info: TableInfo = null
    public table_info_a: Array<SimpleTableInfo> = [];


    constructor(public _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {

    }


    onSelectTable() {
        if (this.table_name) {
            this._share.getTableInfo(this.table_name).subscribe(_table_info => {
                this.selected_table_info = _table_info
                console.log(this.selected_table_info.getLabel())
                this.change()
            })


        }
    }

    ngOnInit() {
        console.log('NG INIT')
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('NG change')
        //表示しないテーブル
        this._share.getExistTableArray().subscribe(_exist_table_a => {
            this.table_info_a = _exist_table_a.filter(_simple_table_info => {
                return this.exclude_table_name_a.indexOf(_simple_table_info.table) == -1
            });
            if (!this.conditions) {
                this.conditions = new Conditions()
            }
            this.onSelectTable()
        });
    }

    change() {
        if (this.selected_table_info) {
            this.valueChange.emit({
                table_info: this.selected_table_info,
                form: !!this.field_name ? this.selected_table_info.forms.byFieldName(this.field_name) : null,
                filter: null,
                conditions: this.conditions,
            })
        }
    }

    conditionChanged($event) {
        this.conditions = $event.conditions;
        this.change()
    }
}
