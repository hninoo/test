import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {SimpleTableInfo} from '../../class/SimpleTableInfo';
import {Form} from '../../class/Form';
import {Conditions} from '../../class/Conditions';
import {Data} from '../../class/Data';
import {FormAndValue} from '../../class/FormAndValue';

@Component({
    selector: 'select-field-and-value',
    templateUrl: './select-field-and-value.component.html',
    styleUrls: ['./select-field-and-value.component.scss']
})

export class SelectFieldAndValueComponent implements OnInit, OnChanges {

    //required
    @Input() table_info: TableInfo = null;
    @Input() include_multi: boolean = true;
    @Input() add_default: boolean = true;

    @Output() valueChange: EventEmitter<Object> = new EventEmitter();

    public is_select_open: boolean = false;
    public data: Data = null
    @Input() form_and_values: Array<FormAndValue> = []
    error_a: any = {};


    constructor(public _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {

    }


    ngOnInit() {
        console.log('NG INIT')

    }

    ngOnChanges(changes: SimpleChanges): void {
        this.data = new Data(this.table_info);
        if (this.form_and_values.length == 0 && this.add_default) {
            this.form_and_values = [];
            this.addField();
            if (this.table_info) {
                this.form_and_values[0].form = this.table_info.getEditableFormArray(true)[0]
            }
        }

        this.form_and_values.forEach(form_and_value => {
            if (form_and_value.value) {
                this.data.setRawData({[form_and_value.form.field['Field']]: form_and_value.value})
            } else if (form_and_value.value_a.length > 0) {
                this.data.setMultiData(form_and_value.form.field['Field'], form_and_value.value_a)
            }
        });
    }


    addField() {
        this.form_and_values.push(new FormAndValue())

    }

    /**
     * 選択可能なフィールドを取得（重複除外、lookup/calc除外）
     */
    getAvailableFields(): Array<Form> {
        if (!this.table_info) {
            return [];
        }

        // 既に選択されているフィールドIDを取得
        const selectedFieldIds = this.form_and_values
            .filter(fv => fv.form && fv.form.field)
            .map(fv => fv.form.field['Field']);

        // 編集可能なフィールドから重複とlookup/calcを除外
        return this.table_info.getEditableFormArray(true, this.include_multi)
            .filter(form => {
                // 重複フィールドを除外
                const isDuplicate = selectedFieldIds.indexOf(form.field['Field']) !== -1;

                // lookup/calcフィールドを除外
                const isReadOnlyType = ['lookup', 'calc', 'auto_increment'].indexOf(form.original_type) !== -1;

                return !isDuplicate && !isReadOnlyType;
            });
    }

    /**
     * 特定のインデックスで選択可能なフィールドを取得（そのインデックスの現在選択フィールドは含む）
     */
    getAvailableFieldsForIndex(currentIndex: number): Array<Form> {
        if (!this.table_info) {
            return [];
        }

        // 他のインデックスで選択されているフィールドIDを取得
        const selectedFieldIds = this.form_and_values
            .filter((fv, index) => index !== currentIndex && fv.form && fv.form.field)
            .map(fv => fv.form.field['Field']);

        // 編集可能なフィールドから重複とlookup/calcを除外
        return this.table_info.getEditableFormArray(true, this.include_multi)
            .filter(form => {
                // 他のフィールドとの重複を除外
                const isDuplicate = selectedFieldIds.indexOf(form.field['Field']) !== -1;

                // lookup/calcフィールドを除外
                const isReadOnlyType = ['lookup', 'calc', 'auto_increment'].indexOf(form.original_type) !== -1;

                return !isDuplicate && !isReadOnlyType;
            });
    }

    change() {
        this.valueChange.emit({
            form_and_values: this.form_and_values
        })
    }

    delete(index: number) {
        this.form_and_values.splice(index, 1);
        this.change()
    }


    onValueChanged($event, form_value: FormAndValue) {
        console.log($event)
        if (form_value.form.is_multi_value_mode) {
            let raw_data = this.data.getRawDataIncludeChild()
            form_value.value_a = raw_data[form_value.form.field['Field']]
        } else {
            form_value.value = $event.value
        }
        console.log(form_value)
        this.change();
    }
}

