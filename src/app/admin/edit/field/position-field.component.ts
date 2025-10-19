import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Connect} from '../../../services/connect';
import {Data} from '../../../class/Data';
import {SharedService} from '../../../services/shared';


@Component({
    selector: 'position-forms-field',
    templateUrl: './position-field.component.html',
})

export class PositionFieldComponent {
    @Input() default_position_id: number = null;
    @Input() index: number = null;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() add_all: boolean = false;
    @Input() added_values: Array<any> = [];
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    public loading: boolean = false;
    public position_id: number = null;
    public data_a: Array<Data> = [];

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService) {
        this.loading = true

        this._share.getTableInfo('position').subscribe(table_info => {
            this._share.getPositionList(table_info).subscribe(async (data_a) => {
                this.loading = false
                this.data_a = data_a
            });
        })

    }

    ngOnInit() {
        this.position_id = this.default_position_id;
        if (!this.default_position_id && this.add_all) {
            this.position_id = 0 // 0 = all
        }
    }

    onChange() {
        this.valueChanged.emit({
            'position_id': this.position_id,
            'index': this.index
        })
    }

}
