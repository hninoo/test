import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Connect} from '../../../services/connect';
import {Data} from '../../../class/Data';
import {TableInfo} from '../../../class/TableInfo';
import {SharedService} from '../../../services/shared';
import {OptionItem} from '../../../class/OptionItem';
import { userListService } from '../../../services/userListService';




@Component({
    selector: 'user-forms-field',
    templateUrl: './user-field.component.html',
})

export class UserFieldComponent {
    @Input() default_admin_id: number = null;
    @Input() index: number = null;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() added_values: Array<any> = [];
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    public admin_id: number = null;
    @Input() data_a: Array<Data> = [];
    public loading: boolean = false;
    public option_items: Array<OptionItem> = [];

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _shared: SharedService, private userListService: userListService) {
        this.loading = true;
        this.userListService.getUserInfo().subscribe((table_info_hash) => {
            let table_info: TableInfo = new TableInfo(table_info_hash);
            this.userListService.getDataList(table_info).subscribe((data) => {
                this.loading = false;
                this.data_a = data;
                setTimeout(() => {
                    this.setOptionItems();
                }, 500);
            });
        });
    }

    setOptionItems() {
        var option_items = []
        this.added_values.forEach(added_value => {
            option_items.push(added_value)
        })
        this.data_a.forEach(data => {
            option_items.push({
                'label': data.raw_data['name'],
                'value': parseInt(data.raw_data['id']),
            })
        })
        this.option_items = option_items
    }



    getId() {
        return 'user_field_' + (this.index ?? 'noindex');
    }

    ngOnInit() {
        this.admin_id = this.default_admin_id;
    }

    onChange() {
        this.valueChanged.emit({
            'admin_id': this.admin_id,
            'index': this.index
        })
    }


    isUnittest() {
        return window.location.hostname.match(/t-.*pigeon-demo\.com/);
    }
}
