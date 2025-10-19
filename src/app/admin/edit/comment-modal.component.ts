import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {User} from '../../services/user';

@Component({
    selector: 'comment-modal',
    templateUrl: './comment-modal.component.html',
})

export class CommentModalComponent implements OnInit {
    @Input() type;
    @Input() parent;
    @Input() sending: boolean;


    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() applied: EventEmitter<Object> = new EventEmitter();

    public admin_id_a: Array<number> = [];
    public workflow_comment: string = null;

    public comment: string = '';
    private toasterService: ToastrService;

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService, private _user: User, toasterService: ToastrService) {
        this.admin_id_a = [null];
        this.toasterService = toasterService;
    }

    ngOnInit() {
        this.sending = false;
    }

    pathChanged($event, key = 'admin_id') {
        this.changed();
    }

    changed() {
        this.valueChanged.emit({
            'comment': this.comment
        })

    }

    submit() {
        this.applied.emit()
    }


    close() {
        this.parent.closeCommentModal()
    }

}
