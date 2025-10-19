import {Component, EventEmitter, Input, KeyValueDiffers, OnInit, Output, ViewChild} from '@angular/core';
import * as cloneDeep from 'lodash/cloneDeep';
import {Data} from '../class/Data';
import {TableInfo} from '../class/TableInfo';
import {Form} from '../class/Form';
import {Forms} from '../class/Forms';

@Component({
    selector: 'form-field-edit-modal',
    templateUrl: './form-field-edit-modal.component.html',
    styles: ['.modal { z-index: 1050}']
})
export class FormFieldEditModalComponent implements OnInit {

    @ViewChild('editFormFieldModal') public editModal: any;
    @Input() table_info: TableInfo;
    @Input() form: Form;
    @Input() field;
    @Input() data: Data;
    @Input() selectChange;
    @Input() grant_menu_a: Array<any>;
    @Input() is_setting: boolean;
    @Input() data_index: number;


    //editing data
    /*
    private editting_data:Object;
    private editting_view_data:Object;
    private editting_child_a:Object;
     */
    private base_data: Data = null;

    @Output() onHide: EventEmitter<Object> = new EventEmitter();
    @Output() onEditEnd: EventEmitter<Object> = new EventEmitter();

    public error_a:Object = {}
    constructor(private differs: KeyValueDiffers) {
    }

    show = () => {
        this.base_data = this.data;
        this.data = cloneDeep(this.data)
        this.editModal.show();
    }
    hide = () => {
        this.editModal.hide();
    }

    isShown = () => {
        return this.editModal.isShown();
    }

    onChange($event) {
        if ($event.child_table != undefined) {
            let child_index = null;
            this.data.child_a.forEach((child_table_info: TableInfo, i) => {
                if (child_table_info.table == $event.child_table) {
                    child_index = i;
                }
            })
            this.data.setChildData(this.data.child_a[child_index], {'value': $event.value}, $event.data_index)
            //this.editting_child_a[$event.child_index].data_a[$event.data_index]['value'] = $event.value;
            //this.editting_data[$event.field_name][$event.data_index] = $event.value;

        } else {
            let hash = {};
            hash[$event.field_name] = $event.value;
            this.data.setRawData(hash);
            //this.editting_data[$event.field_name] = $event.value;
        }
    }

    getForms() {
        let field_name = this.field.Field;
        var forms = new Forms({});
        forms.add(field_name, this.form)
        return forms;
    }

    ngOnInit(): void {
        console.log('field-edit-modal-oninit')
        this.data = cloneDeep(this.data)
        //this.setEditingValue()
    }

    onhide() {
        this.onHide.emit()
    }

    complete() {
        this.onEditEnd.emit({
            'field': this.field,
            'form': this.form,
            'data': cloneDeep(this.data),
            'child_a': cloneDeep(this.data.child_a),
            'data_index': this.data_index
        });

    }

    cancel() {
        //back
        this.data = this.base_data;
        this.editModal.hide();
    }

    /*
    private paramsDiffer: KeyValueDiffer<string, any>;
    ngDoCheck(): void {console.log("NG Do Check==========");
        let params = [this.data.raw_data,this.data.view_data,this.child_a];
        if (this.paramsDiffer === undefined) {
            this.paramsDiffer = this.differs.find(params).create();
        }
        const changes = this.paramsDiffer.diff(params);
        if (changes) {
            this.setEditingValue()
        }
    }
     */
}
