import {Component, OnInit} from '@angular/core';
import {CopyBlock, CopyFromToField, CopyOtherTableBlock} from '../flow.component';
import {CopyOtherTableBlockComponent} from '../copy-other-table-block/copy-other-table-block.component';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {cloneDeep} from 'lodash';
import {Table} from '@fullcalendar/daygrid';
import {TableInfo} from '../../class/TableInfo';
import {FormAndValue} from '../../class/FormAndValue';
import {Data} from '../../class/Data';

@Component({
    selector: 'app-copy-other-table-block-edit-modal',
    templateUrl: './copy-other-table-block-edit-modal.component.html',
    styleUrls: ['./copy-other-table-block-edit-modal.component.scss']
})
export class CopyOtherTableBlockEditModalComponent extends BlockModalBaseComponent implements OnInit {

    public block: CopyOtherTableBlock;
    public can_copy_fields_by_from = {};

    public target_table_info: TableInfo;

    public target_table_a = [];

    public updateData: Data = null;
    public child_data_a_by_fieldname: { [key: string]: Array<Data> } = {};

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == 'COPY_OTHER_TABLE') {
            if (changes.srcBlock) {
                this.block = cloneDeep(this.srcBlock) as CopyOtherTableBlock;
                this.targetTableChanged();
            }
        }
        this.target_table_a = [];
        this._shared.exist_table_a.forEach(_table => {
            this.target_table_a.push(_table);
        });
    }

    targetTableChanged($event = null) {
        console.log($event)
        console.log(this.block.target_table)
        if (this.block.target_table) {
            this._shared.getTableInfo(this.block.target_table).subscribe(_table_info => {
                this.target_table_info = _table_info;
                this.updateData = new Data(this.target_table_info);

                //load update_fields
                this.block.update_fields.forEach(_update_field => {
                    if (_update_field.form) {
                        if (_update_field.form.is_multi_value_mode) {
                            this.updateData.setMultiData(_update_field.form.field['Field'], _update_field.value_a)
                        } else {
                            this.updateData.setRawData({[_update_field.form.field['Field']]: _update_field.value})
                        }
                    }
                });


                //load can_copy_fields_by_from
                console.log(this.block.copy_from_to_fields)
                this.block.copy_from_to_fields.forEach(_copy_from_to_field => {
                    if (_copy_from_to_field.from) {
                        this.copyFromSelected(_copy_from_to_field);
                    }
                })


                if ($event) {
                    //clear copy_from_to_fields and update fields
                    this.block.copy_from_to_fields = [];
                    this.block.update_fields = [];
                }

            })
        }

    }

    addCopyField() {
        this.block.addCopyField();
    }


    delCopyField(i) {
        this.block.copy_from_to_fields.splice(i, 1);
    }

    public save() {
        let raw_data_hash = this.updateData.getRawDataIncludeChild();
        this.block.update_fields.forEach(_update_field => {
            if (raw_data_hash[_update_field.form.field['Field']] != null) {
                if (_update_field.form.is_multi_value_mode) {
                    _update_field.value_a = raw_data_hash[_update_field.form.field['Field']];
                } else {
                    _update_field.value = raw_data_hash[_update_field.form.field['Field']];
                }
            }
        });
        console.log(this.block.update_fields)

        if (this.validate()) {
            super.save(this.block);
        } else {
            this.toasterService.error(this.errors.join('<br>'));

        }

    }


    public copyFromSelected(copy_field: CopyFromToField) {
        this._shared.getForm(this.table_info.table, copy_field.from).subscribe(_form => {
            this.can_copy_fields_by_from[copy_field.from] = []
            this.checkSame(_form, copy_field.from);
        })
    }


    public checkSame(_form, from_field) {
        this.target_table_info.forms.getArray().forEach(_form2 => {
            this._shared.isSameType(_form, _form2, true).subscribe(_is_same => {
                if (_is_same) {
                    console.log(_form2)
                    this.can_copy_fields_by_from[from_field].push({
                        'label': _form2.label,
                        'value': _form2.field['Field']
                    })
                }
            })
        })
        console.log(this.can_copy_fields_by_from)
    }

    public isCopyTargetTableFieldExist(from: string): boolean {
        let _ret = false;
        this.block.copy_from_to_fields.forEach(_copy_from_to_field => {
            if (_copy_from_to_field.from == from) {
                _ret = true;
            }
        })
        return _ret;
    }


    check() {
        console.log(this.block);

    }


    hasError() {
        return this.errors.length > 0;
    }

    public errors: Array<string> = [];
    child_error_a: any = {};

    validate() {
        this.errors = [];
        if (this.block.copy_from_to_fields.length == 0) {
            this.errors.push('最低一つのコピーする項目を選択してください');
        }
        this.target_table_info.forms.getArray().forEach(_form => {
            if (_form.required && !this.block.copy_from_to_fields.find(_copy_from_to_field => _copy_from_to_field.to == _form.field['Field'])) {
                if (this.updateData.raw_data[_form.field['Field']] == null || this.updateData.raw_data[_form.field['Field']] == '') {
                    this.errors.push(_form.label + 'は必須です');
                }
            }
        });

        //check not duplicate copy_to
        let _copy_to_a = [];
        this.block.copy_from_to_fields.forEach(_copy_from_to_field => {
            if (_copy_to_a.includes(_copy_from_to_field.to)) {
                this.errors.push('コピー先の項目が重複しています');
            } else {
                _copy_to_a.push(_copy_from_to_field.to);
            }
        });

        //check not duplicate update_fields
        let _update_field_a = [];
        this.block.update_fields.forEach(_update_field => {
            if (_update_field.form && _update_field.form.field) {
                const fieldName = _update_field.form.field['Field'];
                if (_update_field_a.includes(fieldName)) {
                    this.errors.push('更新フィールドの項目が重複しています');
                } else {
                    _update_field_a.push(fieldName);
                }
            }
        });

        //check not duplicate between copy_to and update_fields
        this.block.update_fields.forEach(_update_field => {
            if (_update_field.form && _update_field.form.field) {
                const fieldName = _update_field.form.field['Field'];
                if (_copy_to_a.includes(fieldName)) {
                    this.errors.push('コピー項目と更新項目で同じフィールドが選択されています: ' + _update_field.form.label);
                }
            }
        });

        return this.errors.length == 0;
    }

    addUpdateField() {
        this.block.addUpdateField();
    }

    delUpdateField(i: number) {
        this.block.update_fields.splice(i, 1);

    }

    updateFieldSelected(selectedForm, update_field: FormAndValue) {
        update_field.set(selectedForm, '');
        console.log(update_field)

    }

    addChildDatafromformsfield($event: Object) {
        console.log($event)

    }

    onValueChanged($event: Object) {

    }

    delUpdateFieldChildData(field_name: string, i: number) {

        this.child_data_a_by_fieldname[field_name].splice(i, 1);
    }

    onChangeUpdateValue($event) {
        console.log($event)
        this.block.update_fields = $event.form_and_values;
    }
}
