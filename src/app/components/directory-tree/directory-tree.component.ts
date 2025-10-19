import {Component, OnInit, Input, EventEmitter, Output, Inject, Pipe, PipeTransform, HostListener, Renderer2} from '@angular/core';
import {SharedService} from '../../services/shared';
import {MenuNode} from '../../class/MenuNode';


@Component({
    selector: 'directory-tree',
    templateUrl: './directory-tree.component.html',
    styleUrls: ['./directory-tree.component.scss']
})
export class DirectoryTreeComponent implements OnInit {
    @Input() menu_node: MenuNode;

    constructor(public _share: SharedService) {
    }
    ngOnInit() {
    }
}
