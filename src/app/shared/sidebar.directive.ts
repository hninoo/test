import {Directive, HostListener} from '@angular/core';
import { SharedService } from 'app/services/shared';

/**
 * Allows the sidebar to be toggled via click.
 */
@Directive({
    selector: '[appSidebarToggler]'
})
export class SidebarToggleDirective {
    constructor(private _share: SharedService) {
    }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        document.querySelector('body').classList.toggle('sidebar-hidden');

        if(document.body.classList.contains('sidebar-hidden')){
            this._share.sidebar_opened = false
        }else{
            this._share.sidebar_opened = true;
        }
    }
}

@Directive({
    selector: '[appSidebarMinimizer]'
})
export class SidebarMinimizeDirective {
    constructor() {
    }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        document.querySelector('body').classList.toggle('sidebar-minimized');
    }
}

@Directive({
    selector: '[appMobileSidebarToggler]'
})
export class MobileSidebarToggleDirective {
    constructor(private _share: SharedService) {
    }

    // Check if element has class
    private hasClass(target: any, elementClassName: string) {
        return new RegExp('(\\s|^)' + elementClassName + '(\\s|$)').test(target.className);
    }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        document.querySelector('body').classList.toggle('sidebar-mobile-show');
        if (document.body.classList.contains('sidebar-mobile-show')) {
            this._share.sidebar_opened = true
        } else {
            this._share.sidebar_opened = false;
        }
    }
}

/**
 * Allows the off-canvas sidebar to be closed via click.
 */
@Directive({
    selector: '[appSidebarClose]'
})
export class SidebarOffCanvasCloseDirective {
    constructor() {
    }

    // Check if element has class
    private hasClass(target: any, elementClassName: string) {
        return new RegExp('(\\s|^)' + elementClassName + '(\\s|$)').test(target.className);
    }

    // Toggle element class
    private toggleClass(elem: any, elementClassName: string) {
        let newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
        if (this.hasClass(elem, elementClassName)) {
            while (newClass.indexOf(' ' + elementClassName + ' ') >= 0) {
                newClass = newClass.replace(' ' + elementClassName + ' ', ' ');
            }
            elem.className = newClass.replace(/^\s+|\s+$/g, '');
        } else {
            elem.className += ' ' + elementClassName;
        }
    }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();

        if (this.hasClass(document.querySelector('body'), 'sidebar-off-canvas')) {
            this.toggleClass(document.querySelector('body'), 'sidebar-opened');
        }
    }
}

export const SIDEBAR_TOGGLE_DIRECTIVES = [
    SidebarToggleDirective,
    SidebarMinimizeDirective,
    SidebarOffCanvasCloseDirective,
    MobileSidebarToggleDirective
];
