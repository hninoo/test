import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {Form} from '../../class/Form';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'admin-field-select',
    templateUrl: './field-select.component.html',
    styleUrls: ['./field-select.component.css']
})
export class FieldSelectComponent implements OnInit, OnChanges {
    @Input() table_info: TableInfo;
    @Input() field_name: string;
    @Input() multiValue: boolean = false;
    @Input() value: any = null;
    @Input() excludeFields: string[] = []; // 除外するフィールド
    @Input() selectedItems: any[] = []; // 選択済みのアイテム

    @Output() valueChanged: EventEmitter<any> = new EventEmitter();

    public fieldItems: any[] = [];

    constructor(public _share: SharedService) {
    }

    ngOnInit() {
        this.loadFieldItems();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.table_info || changes.excludeFields) {
            this.loadFieldItems();
        }
    }

    loadFieldItems() {
        if (!this.table_info || !this.table_info.forms) {
            return;
        }

        const forms: Form[] = this.table_info.forms.getArray();

        this.fieldItems = forms
            .filter(form => {
                const excludeDefault = ['id', 'created_at', 'updated_at', 'deleted_at', 'admin_id', 'admin_name'];
                const fieldsToExclude = [...excludeDefault, ...this.excludeFields];
                return form.field && !fieldsToExclude.includes(form.field_name) && form.getFieldId() != null;
            })
            .map(form => ({
                label: form.label || form.field_name,
                value: form.getFieldId()
            }));

        console.log('フィールドアイテムをロードしました:', this.fieldItems);
    }

    onChange() {
        console.log('選択値が変更されました:', this.value);
        this.valueChanged.emit({
            field_name: this.field_name,
            value: this.value
        });
    }

    getSelectedValue() {
        if (this.multiValue) {
            return Array.isArray(this.value) ? this.value : [];
        } else {
            return this.value;
        }
    }
}
