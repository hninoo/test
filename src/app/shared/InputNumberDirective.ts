import {Directive, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';

@Directive({
    selector: '[OnlyNumber]'
})
export class InputNumberDirective {

    constructor(private el: ElementRef) {
    }

    @Input() OnlyNumber: boolean;
    @Input() min: number = null;
    @Input() max: number = null;

    @Input() object = null;
    @Input() key: string = null;


    @Output() change: EventEmitter<Object> = new EventEmitter();

    @HostListener('keydown', ['$event']) onKeyDown(event) {
        let e = <KeyboardEvent>event;
        if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A
            (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+C
            (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+V
            (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+X
            (e.keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39) ||
            e.keyCode == 189) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    }

    @HostListener('change', ['$event']) onChange(event) {
        event.target.value = this.hankaku2Zenkaku(event.target.value)


        if (event.target.value) {
            event.target.value = event.target.value.replace(/(.*?\..*?)\..*/gi, '$1')
            event.target.value = event.target.value.replace(/(.+)\-.*/gi, '$1')
            if (this.min && parseFloat(event.target.value) < this.min) {
                event.preventDefault();
                event.target.value = this.min;
                this.setObject(this.min)
                event.number_force_changed = 'min'
                this.change.emit(event)
            }
            if (this.max && parseFloat(event.target.value) > this.max) {
                event.preventDefault();
                event.target.value = this.max;
                this.setObject(this.max)
                event.number_force_changed = 'max'
                this.change.emit(event)
            }
        }


    }

    private setObject(val: number) {
        if (this.key === null) {
            this.object = val;
        } else {
            this.object[this.key] = val;
        }
    }

    private hankaku2Zenkaku(str) {
        str = str.replace(/[^0-9\-\.]/gi, '');
        return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
    }
}
