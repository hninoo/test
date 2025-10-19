import {Component, EventEmitter, Input, OnInit, Output, SecurityContext, ViewChild} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {Comment} from '../../class/Comment';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'comment-log-block',
    templateUrl: './comment-log-block.component.html'
})
export class CommentLogBlockComponent implements OnInit {
    @Input() comment: Comment;
    public content: string;
    private toasterService: ToastrService;

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    public sending: boolean = false;

    @ViewChild('deleteModal') deleteModal: any;

    constructor(public _share: SharedService, private _connect: Connect, toasterService: ToastrService, private sanitizer: DomSanitizer) {
        this.toasterService = toasterService;
    }

    ngOnInit() {

        // this.content = this.comment.content
        let div = document.createElement('div')
        div.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, this.comment.content)
        if (div.childNodes.length > 0) {

            div.childNodes.forEach(element => {
                // console.log(element.nodeType, element.nodeValue, element.nodeName)
                if (element.nodeName === 'B') {
                    var newele = document.createElement('a')
                    newele.setAttribute('class', 'mentionstyle')
                    newele.setAttribute('href', `admin/${this.comment.table}/view/${this.comment.data_id}`)
                    newele.innerHTML = element.textContent
                    div.replaceChild(newele, element)
                }

            })

        }
        this.content = div.innerHTML

    }


    delete() {
        if (confirm('コメントを削除しますか？')) {
            this._connect.post('/admin/comment/delete', {'id': this.comment.id}, {}, false).subscribe(
                (jsonData) => {
                    this.sending = false;
                    if (jsonData['result'] === 'success') {
                        this.toasterService.success('削除しました', '成功');
                        this.valueChanged.emit();
                    } else {
                        this.toasterService.error(jsonData['error_a'], 'エラー');
                    }
                }, (error) => {
                    this.toasterService.error(error.error.error_a, 'エラー');
                    this.sending = false;
                }
            )
        }

    }

}
