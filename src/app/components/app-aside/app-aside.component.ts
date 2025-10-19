import {Component, OnInit, Input, EventEmitter, Output, Inject, Pipe, PipeTransform, HostListener, Renderer2,ViewChild} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {Comment} from '../../class/Comment';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {TableInfo} from 'app/class/TableInfo';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-aside',
    templateUrl: './app-aside.component.html'
})
export class AppAsideComponent implements OnInit {

    selectedEventData: any[] = [];

    @Input() customFilter: CustomFilter;
    @Input() comment: string = '';


    private toasterService: ToastrService;
    public list : Array<any>;
    private mentionConfig: Object
    private admin_table: string
    public table_info: TableInfo
    private data_list: Array<any>
    public sending = false;
    public confirmSendCommentText = "";

    @Output() itemSelected: EventEmitter<any>
    public parent_ele : HTMLElement;
    public tab_content : HTMLElement;

    public loading: boolean = false;

    @ViewChild('confirmSendCommentModal') confirmSendCommentModal: any;

    constructor(public _share: SharedService, private _connect: Connect, toasterService: ToastrService, @Inject(DOCUMENT) private document: any,
    public sanitized: DomSanitizer , private _renderer : Renderer2) {
        this.toasterService = toasterService;
        this.data_list =[]
        this.mentionConfig = {
            items: this.list,
            triggerChar : "@",
            labelKey : 'name',
            insertHTML: true,
            mentionSelect: this.mentionSelect
        }

    }

    ngOnInit() {

        let lists = []
        this.admin_table = this._share.getAdminTable()
        this._share.getTableInfo(this.admin_table).subscribe(_table_info => {
            this.table_info = _table_info
            this.reloadUserName()
        })

        this.parent_ele = document.querySelector('.comments')
    }

    reload() {
        this._share.reloadCurrentData()

    }
    reloadUserName() {
        let lists = []
        this._connect.getUserNames().subscribe(_data => {
            _data['users'].forEach(data => {
                lists.push(data)
            });
            this.list = lists
        })
    }

    @HostListener('paste', ['$event'])
    pasteevent(e) {
        e.preventDefault();
        e.stopPropagation();
        var plaintext = e.clipboardData.getData('text/plain');
        document.execCommand('inserttext', false, plaintext);
    }

    mentionSelect(event: any) {
        if(this.parent_ele == null) {
            this.parent_ele = document.querySelector('.comments')
        }
        let ele = document.querySelector('.menu-list-customize')
        let new_block = document.querySelector('.new-block');
        if(ele) {
            $(ele).removeClass('menu-list-customize');
            this.parent_ele.removeChild(new_block);

        }
        return '<b id="mention" style="fontSize: small" contenteditable="false">'+event.name +'&nbsp;'+'</b>'

    }

    onSelect(event: any) {

        this.selectedEventData = this.selectedEventData.concat(event)

    }
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Backspace') {
            this.removeLastMentionedItem();
        }
    }

       removeLastMentionedItem() {

        const content = document.getElementById('comment').innerText;

        this.selectedEventData.map((item, index) => {
            var name = item.name;

            if (content.indexOf(name) === -1) {
                this.selectedEventData.splice(index, 1);
            }

        });

        console.log('-> After removeLastMentionedItem() call', this.selectedEventData , content);
    }

    commentInput(event){
        if(event.data == '@') {
            this.reloadUserName()
            let ele = document.querySelector('.auto-complete-font')
            this._renderer.setStyle(ele, 'width', `${ele.clientWidth}px` );
            this._renderer.addClass(ele,'menu-list-customize')
            let comment_log_ele = document.querySelector('comment-log-block')
            const new_block = this._renderer.createElement('div');
            this._renderer.addClass(new_block,'new-block')
            if(this.parent_ele == null) {
                this.parent_ele = document.querySelector('.comments')
            }
            this.parent_ele.insertBefore(new_block,comment_log_ele);
        }else{
            let ele = document.querySelector('.menu-list-customize');
            let new_block = document.querySelector('.new-block');
            if(ele) {
                if(this.parent_ele == null) {
                    this.parent_ele = document.querySelector('.comments')
                }
                this.parent_ele.removeChild(new_block);
                this._renderer.removeClass(ele,'menu-list-customize');
                this._renderer.removeStyle(ele,'width')

            }
        }

        this.removeLastMentionedItem();

        this.comment = event.target.innerText
    }

    addUserLists(userLists: Array<any> = [], newUser: Object = {}): Array<any> {
        let existUser = userLists.find(user => user.id === (newUser as any)['id']);
        if (!existUser) {
            userLists.push(newUser);
        }
        return userLists;
    }

    addComment() {

        let organizationUser = [];

        const containsOrganization = this.selectedEventData.some(item => item.type === 'organization');

        if (containsOrganization) {
            this.data_list = []
            this.selectedEventData.map(item=>{
                if(item.type === 'user'){
                    this.data_list = this.addUserLists(this.data_list,{id:item.id,name:item.name})
                }else{

                    this._connect.getUserNamesByDivision(item.id).subscribe(_data => {
                            _data['results'].forEach(data => {
                                this.data_list = this.addUserLists(this.data_list, { id: data.id, name: data.name })
                                organizationUser = this.addUserLists(organizationUser, data )

                            });
                            this.confirmSendCommentText = `組織全体（${organizationUser.length}人）にmentionされます。よろしいですか？`
                        })

                    }
            })
            this.confirmSendCommentModal.show();

        }else{
            this.selectedEventData.map(item=>{
                this.data_list = this.addUserLists(this.data_list,{id:item.id,name:item.name})
            })
            this.saveComment();
        }

    }

    saveComment(){

        this.selectedEventData = [];

        if (!this.comment) {
            this.toasterService.error('コメントを入力して下さい。', 'エラー');
            return;
        }
        if(this.data_list.length>0){
            this.data_list.map(x=>{

                this.comment = this.comment.replace(/@[^@\s]+/g, match => {
                    return `{pfc_user}${match}{/pfc_user}`;
                });


            })
        }
        this.comment = this.comment.replace(/\n/g, match =>
        {
            return `{line_break}${match}`
        });
        let comment_hash = {
            'table': this._share.getCurrentData().table_info.table,
            'data_id': this._share.getCurrentData().raw_data['id'],
            'admin': this._share.user.name,
            'content': this.comment,
            'url':  this.document.location.pathname,
            'data': this.data_list
        };
        this.sending = true;
        this._connect.post('/admin/comment/add', comment_hash).subscribe((res) => {
            this.reload()
            this.sending = false;
            this.confirmSendCommentModal.hide();
            this.toasterService.success('コメントを追加しました', '成功');
            this.comment = ''
            let cmt = document.getElementById('comment');
            cmt.innerHTML = ' ';
            this.data_list = []
        });
    }

    getDataStr(data, diff) {
        if (!data) {
            return '';
        }
        if (typeof data == 'string') {
            return data;
        } else if (Array.isArray(data)) {
            //IF multiple
            return data.map((_multi_data) => {
                return this.getDataStr(_multi_data, diff)
            }).join(',')
        }

        //file
        return data['name'];
    }


    getNextLogs() {
        this.loading = true;
        this._share.loadNextLogs().subscribe(() => {
            this.loading = false;
        });
    }
}
