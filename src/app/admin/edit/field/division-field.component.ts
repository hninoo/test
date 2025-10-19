import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Connect} from '../../../services/connect';
import {Data} from '../../../class/Data';
import {SharedService} from '../../../services/shared';
import {OptionItem} from '../../../class/OptionItem';


@Component({
    selector: 'division-forms-field',
    templateUrl: './division-field.component.html',
})

export class DivisionFieldComponent {
    @Input() default_division_id: number = null;
    @Input() index: number = null;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() added_values: Array<any> = [];
    @Input() use_ids: Array<number> = null;
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    public loading: boolean = false;
    public division_id: number = null;
    public data_a: Array<Data> = [];
    public option_items: Array<OptionItem> = [];

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService) {
        this.loading = true
        this._share.getTableInfo('division').subscribe(table_info => {
            console.log('loadlist')
            this._share.getDivisionList(table_info).subscribe(async (data_a) => {
                this.loading = false
                this.data_a = data_a
                this.setOptionItems()
            });
        })

    }

    ngOnInit() {
        console.log('onchange')
        this.division_id = this.default_division_id;

        this.setOptionItems()

        this.onChange()

    }

    setOptionItems() {
        var option_items = []
        this.added_values.forEach(added_value => {
            option_items.push(added_value)
        })
        this.data_a.forEach(data => {
            if(this.use_ids != null && this.use_ids.length == 0) return;
            if (this.use_ids != null && this.use_ids.includes(parseInt(data.raw_data['id']))) {
                option_items.push({
                    'label': data.raw_data['name'],
                    'value': parseInt(data.raw_data['id']),
                })
            }
            if(this.use_ids == null) {
                option_items.push({
                    'label': data.raw_data['name'],
                    'value': parseInt(data.raw_data['id']),
                })
            }
        })


        this.option_items = option_items
    }

    onChange() {
        console.log('onchange 12')
        console.log(this.division_id)
        this.valueChanged.emit({
            'division_id': this.division_id,
            'index': this.index
        })
    }

}
