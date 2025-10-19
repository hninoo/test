import {Component, OnInit, Input, EventEmitter, Output, Inject, Pipe, PipeTransform, HostListener, Renderer2} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {Comment} from '../../class/Comment';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {TableInfo} from 'app/class/TableInfo';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {MenuNode} from '../../class/MenuNode';


@Component({
    selector: 'nav-menus',
    templateUrl: './nav-menus.component.html',
    styleUrls: ['./nav-menus.component.scss']
})
export class NavMenusComponent implements OnInit {
    @Input() menu_root: MenuNode;
    @Input() show_only_directory: boolean;
    @Input() show_root: boolean;

    constructor(public _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {
    }
    ngOnInit() {
    }

    hasVisibleChildren(menu) {
        let isVisible = false;
        let isVisible_dir = false;
        if (menu.isDir) {
            for (let i = 0; i < menu.children.length; i++) {
                let child = menu.children[i];
                if (child.isDir) {
                    isVisible_dir =  this.hasVisibleChildren(child);
                }
                if (child.menu && child.menu.show_menu) {
                    isVisible = true;
                    break
                }
            };
        }
        return isVisible || isVisible_dir;
    }

    public clickMenu() {
        document.querySelector('body').classList.toggle('sidebar-mobile-show');
    }
}
