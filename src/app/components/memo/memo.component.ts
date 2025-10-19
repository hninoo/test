import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {UserTableSetting} from '../../class/UserTableSetting';


@Component({
    selector: 'memo',
    templateUrl: './memo.component.html',
    styleUrls: ['./memo.component.css']
})
export class MemoComponent implements OnChanges {


    // list , edit , view
    @Input() table_info: TableInfo;
    @Input() view_name: string
    @Output() onOpenClose: EventEmitter<Object> = new EventEmitter();

    public userTableSetting: UserTableSetting;
    public isDisplay: boolean = false;

    constructor(private _share: SharedService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.table_info) {
            return
        }
        this.userTableSetting = this._share.getUserTableSetting(this.table_info.table)
        this.isDisplay = this.table_info.menu && this.table_info.menu.isDisplayMemo(this.view_name)

        this.openCloseMemo(true)
    }

    openCloseMemo(init = false) {
        if (!init) {
            this.userTableSetting.open_memo = !this.userTableSetting.open_memo;
        }
        this.onOpenClose.emit({
            'status': this.userTableSetting.open_memo ? 'open' : 'close',
        })
    }

    @HostListener('document:click', ['$event']) onDocumentClickHandler(event: KeyboardEvent) {
        let tartetElement = event.target as HTMLElement;
        if ( tartetElement.closest('[data-memo-card] a' ) ) {
            let tartgetA = tartetElement.closest('[data-memo-card] a');
            let href = tartgetA.getAttribute('href');

            // Check if the url is mathcing the pattern ( admin/file-by-id/142 )
            let regex = /admin\/file-by-id\/\d+/g;
            let match = href.match(regex);
            if (match?.length > 0) {
                // get the file id from href
                let fileId = match[0].split('/').pop();

                if ( fileId ) {
                    event.preventDefault();
                    this._share.download_file(href, () => {
                        console.log('Download file memo text with file name. File ID: ', fileId, ' URL: ', href);
                    });
                }
            }
        }
    }

}
