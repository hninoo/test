import {Component, Input, ViewChild} from '@angular/core';


@Component({
    selector: 'search-param',
    templateUrl: './searchparam.component.html',
})

export class SearchparamComponent {
    @Input('fields') fields: Array<any>;
    @Input('forms') forms;
    @Input('key') key: string;
    @Input('value') value: Object;
    @Input('extend_search_forms') extend_search_forms;
    @Input('child-table-name') child_table_name: string;

    constructor() {
    }

    get_child_table_name() {
        return (!this.child_table_name) ? '' : '【' + this.child_table_name + '】';
    }

    is_start(key) {
        return key.match(/_start$/);
    }

    is_end(key) {
        return key.match(/_end$/);
    }

    get_value(key, val) {
        if (this.forms.byFieldName(key).type == 'checkbox' || this.forms.byFieldName(key).type == 'radio' || this.forms.byFieldName(key).type == 'select' || this.forms.byFieldName(key).type == 'boolean') {
            var label_a = [];
            if (val instanceof Object) {
                label_a = val;
            } else {
                label_a = [val];
            }
            let val_a = []
            label_a.forEach(label => {
                for (const option of this.forms.byFieldName(key).option) {
                    if (option.value == label) {
                        val_a.push(option.label);
                    }
                }
            })
            return val_a.join(' , ');
        } else if (val instanceof Object && (val['start'] != undefined || val['end'] != undefined)) {
            if (!val['start']) {
                val['start'] = '';
            }
            if (!val['end']) {
                val['end'] = '';
            }
            return val['start'] + '〜' + val['end'];

        } else {
            return val;
        }
    }
}
