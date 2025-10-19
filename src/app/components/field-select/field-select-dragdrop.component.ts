import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {TableInfo} from '../../class/TableInfo';
import {Data} from '../../class/Data';


@Component({
    selector: 'field-select-dragdrop',
    templateUrl: './field-select-dragdrop.component.html'
})
export class FieldSelectDragdropComponent implements OnChanges {


    @Input() table_info: TableInfo;
    //OR
    @Input() dataset_fields: Array<any> = [];
    @Input() type: string = 'display' // display or duplicate

    @Input() selected_field_name_a: Array<string> = [];

    // not required
    @Input() unselected_header: string = '非表示'
    @Input() selected_header: string = '表示'
    @Input() ignore_field_a: Array<string> = [];
    @Input() maxSelectionLimit: number = null; // 追加：最大選択数の制限（nullの場合は制限なし）


    @Output() onChangeValue: EventEmitter<Object> = new EventEmitter();

    public dd_selected_fields: Array<any> = []
    public dd_unselected_fields: Array<any> = [];

    public fields: Array<any>;

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            // 制限がある場合のみチェック
            if (this.maxSelectionLimit && 
                event.container.data === this.dd_selected_fields && 
                this.dd_selected_fields.length >= this.maxSelectionLimit) {
                return;
            }
            transferArrayItem(event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex);
        }

        this.onChange();
    }

    onChange() {
        this.onChangeValue.emit({
            'selected_field_name_a': this.dd_selected_fields.map(f => {
                return f['Field']
            })

        });
    }

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        let field_by_fname = {}
        console.log(this.fields)
        if (this.table_info) {
            this.fields = this.table_info.fields;

            /*
            this.fields = this.fields.filter(_field => {
                return !_field['Comment'].match(/^fixed_html_/)
            })
             */
            this.fields = this.table_info.forms.getArray().map(f => {
                let _field = f.field;
                if (f.original_type === 'fixed_html') {
                    console.log(f)
                    let text = this.htmlToText(f.fixed_html)
                    _field['Comment'] = '【固定】' + text.substr(0, 15) + '...';
                }
                return _field
                //return !_field['Comment'].match(/^fixed_html_/)
            })

        } else {
            console.log(this.dataset_fields)
            this.fields = this.dataset_fields.map((c_data: Data) => {
                return {
                    'Field': c_data.raw_data['id'] ? 'field__' + c_data.raw_data['id'] : c_data.raw_data['unique_key_name'],
                    'Comment': c_data.raw_data['name']
                }
            })
        }
        this.fields = this.fields.filter(field =>
            !this.ignore_field_a.includes(field['Field'])
        );
        this.fields.forEach(field => {
            field_by_fname[field['Field']] = field
        })
        //console.log('app-aside ngoninit')
        this.dd_selected_fields = []
        if (!this.selected_field_name_a) {
            this.selected_field_name_a = [];
        }
        if (typeof this.selected_field_name_a === 'string' || this.selected_field_name_a instanceof String) {
            this.selected_field_name_a = this.selected_field_name_a.split(',')
        }
        this.selected_field_name_a.forEach(field_name => {
            let field = field_by_fname[field_name]
            if (field) {
                this.dd_selected_fields.push(field)
            }

        })
        this.dd_unselected_fields = this.fields.filter(f => {
            return this.selected_field_name_a.indexOf(f['Field']) == -1
        })

        this.updateFixedTextFields(this.dd_unselected_fields);
        this.updateFixedTextFields(this.dd_selected_fields);
    }


    ngOnInit() {

    }

    htmlToText(html: string) {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    moveAllFieldDisplay() {
        // 制限がある場合は全選択を制限
        if (this.maxSelectionLimit && this.fields.length > this.maxSelectionLimit) {
            return;
        }
        this.dd_selected_fields = this.fields.map(field => {
            return field
        })
        this.dd_unselected_fields = []
        this.onChange();
    }

    moveAllFieldNotDisplay() {
        this.dd_unselected_fields = this.fields.map(field => {
            return field
        })
        this.dd_selected_fields = []
        this.onChange();

    }

    updateFixedTextFields(fields) {
        fields.forEach((field) => {
            if (field.Comment && field.Comment.startsWith('fixed_html_')) {
                let fieldNumber = field.Field.match(/\d+/)[0];
                field.Comment = `固定テキスト${fieldNumber}`;
            }
        });
    }

}
