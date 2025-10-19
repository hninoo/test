import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {TableInfo} from '../../class/TableInfo';

@Component({
    selector: 'analytics-modal',
    templateUrl: './analytics-modal.component.html',
})

export class AnalyticsModalComponent implements OnInit {
    @Input() request: string = null;
    @Input() table_name: string = null;
    @Input() sending: boolean = false;
    @Input() customFilter: CustomFilter = null;
    @Input() fields: Array<any> = null;
    @Input() table_info: TableInfo;


    @Output() onSubmitAnalyticsAi: EventEmitter<Object> = new EventEmitter();
    @Output() onErrorAnalyticsAi: EventEmitter<Object> = new EventEmitter();

    @ViewChild('analyticsAiModal') analyticsAiModal: any;

    public comment: string = '';
    public target_field: string = '';

    constructor(private _connect: Connect) {
    }

    public show() {
        this.analyticsAiModal.show()
    }

    public hide() {
        this.sending = false;
        this.analyticsAiModal.hide()
    }

    submit() {

            this.sending = true;
            this._connect.post('/admin/analytics-by-ai', {
                table: this.table_name,
                customFilter: this.customFilter ? this.customFilter.toArray() : null,
                field: this.target_field,
            }, {}, false).subscribe((res) => {
                this.sending = false;
                console.log(res)
                this.hide();

                this.onSubmitAnalyticsAi.emit({
                    request: this.request,
                })
            }, (error) => {
                this.sending = false;
                this.onErrorAnalyticsAi.emit({
                    error: error.error.error_debug_a
                });
            })
        }


    ngOnInit() {
        this.sending = false;
    }

    ngOnChanges() {
        for (let field of this.fields) {
            if (field.Comment === '要望') {
                this.target_field = field.Field;
                break;
            }
        }
    }

    isConditionField(table_info: TableInfo, field: Object) {
        const form = table_info.forms.byFieldName(field['Field']);
        if (!form || !form.label || form.label.startsWith("fixed_html_")) {
            return false;
        }
        return ['image'].indexOf(table_info.forms.byFieldName(field['Field'])['type']) == -1 && field['Field'] != 'password';
    }

}
