import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {User} from '../../services/user';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {Form} from '../../class/Form';

@Component({
    selector: 'lookup-modal',
    templateUrl: './lookup-modal.component.html',
})

export class LookupModalComponent implements OnInit, OnChanges {
    @Input() table: string;
    @Input() searchValue: string;
    @Input() searchValueLastChanged: Date;
    @Input() lookupForm: Form;
    @Input() lookupOptionItems: any;

    @Output() onSelectData: EventEmitter<any> = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    //@Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    private toasterService: ToastrService;
    // public customFilter: CustomFilter = null;
    public lookupformParam: Object;
    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService, private _user: User, toasterService: ToastrService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {
        let option_id_a = [];
        // 新規作成があるときは削除
        if (this.lookupOptionItems[this.lookupOptionItems.length - 1]._value === '__NEW__') {
            this.lookupOptionItems.pop();
        }

        // すでに絞り込まれてるはずのselectBoxのidだけ取得するようフィルターをかける
        option_id_a = this.lookupOptionItems.map(item => item.value);
        this.setLookupFromParams(option_id_a);

        // if (this.searchValue) {
        //     this.customFilter.conditions.addCondition('eq', '_all', this.searchValue);
        //     console.log(this.customFilter)
        // }
    }


    submit() {
    }


    close() {
        this.onClose.emit()
    }

    selectData($event) {
        this.onSelectData.emit($event)

        this.close();
    }

    ngOnChanges(changes: SimpleChanges): void {
        let option_id_a = [];
        if (this.lookupOptionItems[this.lookupOptionItems.length - 1]._value === '__NEW__') {
            this.lookupOptionItems.pop();
        }
        option_id_a = this.lookupOptionItems.map(item => item.value);
        this.setLookupFromParams(option_id_a);
    }

    setLookupFromParams(option_id_a) {
        this.lookupformParam = {
            table: this.table,
            filter_params: JSON.stringify({
                type: "table",
                search_params: [
                    {
                        "value": option_id_a,
                        "field": 'id',
                        "condition": 'eq',
                        "type": "field",
                    }
                ],
            }),
        }
    }
}
