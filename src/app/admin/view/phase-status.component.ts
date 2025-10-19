import { Component, Input, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'
import { Connect } from '../../services/connect';
import { SharedService } from '../../services/shared';
import { Data } from '../../class/Data';
import { Forms } from '../../class/Forms';
import ToastrService from '../../toastr-service-wrapper.service';


@Component({
    selector: 'phase-status',
    templateUrl: './phase-status.component.html',
    styleUrls: ['./phase-status.component.css'],
    encapsulation: ViewEncapsulation.None
})

export class PhaseStatusComponent {
    @ViewChild('scrollable', { static: false }) scrollable: ElementRef;
    @Input('data') data: Data;
    @Input('table') table: string;
    @Input('forms') forms: Forms;


    public phase_list: any = [];
    public now_phase_obj:object
    public phase_status_field: string;

    constructor(private _router: Router, private _route: ActivatedRoute, private _share: SharedService, private _connect: Connect, 
        protected toasterService: ToastrService) {

    }

    ngOnInit() {
        let phase_status_option_table = null;
        let phase_status_id = null;
        for (let key in this.forms.forms) {
            if (this.forms.forms[key].column_type == 'phase-status') {
                // フェーズ名を参照先テーブルなどの情報を取得
                phase_status_option_table = this.forms.forms[key].item_table;
                this.phase_status_field = this.forms.forms[key].field_name;
                phase_status_id = this.data.raw_data[this.phase_status_field];
                break;
            }
        }
        const url = this._connect.getApiUrl() + '/admin/table/phase-status/' + phase_status_option_table;
        this._connect.post(url, {}).subscribe(_data => {
            // フェイズ情報を現在のフェーズを取得
            this.phase_list = _data['phase-status'];
            this.now_phase_obj = this.phase_list.find(item => item.id === phase_status_id);
        })
    }

    updatePhase(item) {
        if (confirm(item.phase + "に更新しますか？")) {
            const formData: FormData = new FormData();
            formData.append('id', this.data.raw_data['id']);
            formData.append(this.phase_status_field, item.id);
            formData.append('ignore_child', "true");
            const url = this._connect.getApiUrl() + '/admin/edit/' + this.table + '/' + this.data.raw_data['id'];
            this._connect.postUpload(url, formData).subscribe(
                (jsonData) => {
                    if (jsonData['result'] == 'success') {
                        this.toasterService.success('更新しました');
                        location.reload();
                    } else {
                        this.toasterService.error('更新に失敗しました');
                    }
                }
            );
        }
    }

    scrollRight() {
        this.scrollable.nativeElement.scrollLeft += 200;
    }

    scrollLeft() {
        this.scrollable.nativeElement.scrollLeft -= 200;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            if(!this.scrollable) return;

            // 現在のフェーズが見えるとこまで移動させる
            const currentPhaseElement = document.querySelector('.current-phase') as HTMLElement;
            
            if (currentPhaseElement) {
                const containerWidth = this.scrollable.nativeElement.offsetWidth;

                const containerCenter = containerWidth / 2;
                const elementCenter = currentPhaseElement.offsetLeft + (currentPhaseElement.offsetWidth / 2);

                this.scrollable.nativeElement.scrollLeft = elementCenter - containerCenter - 100;
            }
        }, 500);
    }
}
