import {Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';

@Directive({
    selector: '[appResizeColumn]'
})
export class ResizeColumnDirective implements OnInit {
    @Input() appResizeColumn: string;
    @Input() index: number;
    @Input() col_style: "";
    @Input() field : string;

    private startX: number;

    private startWidth: number;

    private column: HTMLElement;

    private newwrap: HTMLElement;

    private table: HTMLElement;

    private pressed: boolean;

    private mousemoveListener;
    private mouseupListener;

    constructor(private renderer: Renderer2, private el: ElementRef) {
        this.column = this.el.nativeElement;
    }

    ngOnInit() {
        const row = this.renderer.parentNode(this.column);
        const thead = this.renderer.parentNode(row);
        this.table = this.renderer.parentNode(thead);
        const resizer = this.renderer.createElement('div');


        this.renderer.addClass(resizer, 'resize-holder');
        // this.renderer.listen(resizer, "click", this.onMouseDown);

        this.renderer.setStyle(resizer, 'cursor', 'col-resize')
        this.renderer.setStyle(resizer, 'width', '20px')
        this.renderer.setStyle(resizer, 'height', '100%')
        this.renderer.setStyle(resizer, 'position', 'absolute')
        this.renderer.setStyle(resizer, 'right', '-10px')
        this.renderer.setStyle(resizer, 'top', 0)
        this.renderer.setStyle(resizer, 'z-index', 1)
        this.renderer.appendChild(this.column, resizer);
        this.renderer.listen(resizer, 'mousedown', this.onMouseDown);


        this.newwrap = this.renderer.createElement('p');
        this.renderer.addClass(this.newwrap,'new-wrap');
        if(this.col_style){
            Object.keys(this.col_style).forEach((key) => {
                this.renderer.setStyle(this.newwrap,key,this.col_style[key]);
            });
        }
        this.renderer.setStyle(this.newwrap,'margin-bottom',0);
        this.newwrap.append(this.column.childNodes[0],this.column.childNodes[2]);
        this.column.appendChild(this.newwrap);
        // Observable.merge(
        //   Observable.fromEvent(resizer, 'mousedown'),
        // )
    }

    onMouseDown = (event: MouseEvent) => {
        this.pressed = true;
        this.startX = event.pageX;
        this.startWidth = this.column.offsetWidth;
        this.mousemoveListener = this.renderer.listen(this.table, 'mousemove', this.onMouseMove);
        this.mouseupListener = this.renderer.listen('document', 'mouseup', this.onMouseUp);
    };

    onMouseMove = (event: MouseEvent) => {
        const offset = 35;
        if (this.pressed && event.buttons) {
            // Calculate width of column
            let width = this.startWidth + (event.pageX - this.startX - offset);
            let ptag = this.column.querySelector('.new-wrap');
            this.renderer.setStyle(ptag, 'width', '0');
            let atag = this.column.querySelector('a');
            let calculatelength = 0;
            if (atag) {
                calculatelength = atag.offsetWidth + 20;
            } else {
                let spantag = this.column.querySelector('span');
                calculatelength = spantag.offsetWidth + 20;
            }

            if (width > calculatelength || true) {
                const tableCells = Array
                    .from(this.table.querySelectorAll('tbody tr'))
                    .map((row: any) => row.querySelectorAll('tr td')
                        .item(this.index + 1));
                
                //set normal header width
                if (this.table.classList.contains('showing-sticky-table-header')){
                    let normalHeaderColumn = this.table.querySelectorAll(`thead:first-child th`).item(this.index + 1);
                    this.renderer.setStyle(normalHeaderColumn, 'width', `${width}px`);
                    this.renderer.setStyle(normalHeaderColumn.querySelector('p.new-wrap'), 'width', `${width}px`);
                }

                this.renderer.setStyle(this.column, 'width', `${width}px`);

                const isWidthLessThanCalculatedLength = width < calculatelength;

                if (isWidthLessThanCalculatedLength) {
                    this.renderer.setStyle(this.column, 'padding', this.getPadding(width));
                }

                this.renderer.setStyle(this.newwrap, 'width', `${width}px`);
                if (tableCells[0] != null) {
                    for (const cell of tableCells) {
                        this.renderer.setStyle(cell.parentNode, 'width', `${width}px`);
                        let divselector = cell;
                        if (divselector) {
                            if (divselector.classList.contains('fr-view')) {
                                this.renderer.setStyle(divselector, 'width', `${width}px`);   // Set table cells width

                                if (isWidthLessThanCalculatedLength) {
                                    this.renderer.setStyle(divselector, 'padding', this.getPadding(width));
                                }

                                this.renderer.setStyle(divselector, 'max-width', `${width}px`);
                                this.renderer.setStyle(divselector, 'text-overflow', 'ellipsis')
                                this.renderer.setStyle(divselector, 'overflow', 'hidden')
                                //this.renderer.setStyle(divselector, 'white-space', 'nowrap')
                            } else {
                                let classes = divselector.classList
                                classes.remove('table-admin-list__cell-inner')
                                this.renderer.setStyle(divselector, 'width', `${width}px`);   // Set table cells width

                                if (isWidthLessThanCalculatedLength) {
                                    this.renderer.setStyle(divselector, 'padding', this.getPadding(width));
                                }

                                this.renderer.setStyle(divselector, 'max-width', `${width}px`);
                                this.renderer.setStyle(divselector, 'text-overflow', 'ellipsis')
                                this.renderer.setStyle(divselector, 'overflow', 'hidden')
                                //this.renderer.setStyle(divselector, 'white-space', 'nowrap')
                            }
                            /*
                            let style_container = divselector.querySelector('.style-container');
                            if (style_container) {
                                //this.renderer.setStyle(style_container, 'width', `${width}px`)
                            }
                             */
                        }


                    }
                }
            }
        }
    };

    onMouseUp = (event: MouseEvent) => {
        let width_setting = {};
        let dataset_width_setting = [];
        let pathname = location.pathname.replace(/;[\S]*/gm,'');
        let dataset_id = pathname.split('/admin/')[1];
        let parse_width_setting = JSON.parse(localStorage.getItem('width_setting'));
        if (parse_width_setting && parse_width_setting[dataset_id]) {
            let indexvalue = parse_width_setting[dataset_id].findIndex(x=>x.field == this.field);
            if (indexvalue != -1) {
                parse_width_setting[dataset_id].splice(indexvalue, 1, {"field":this.field, "current_width": this.column.style.width });
            }else {
                parse_width_setting[dataset_id].push({"field":this.field, "current_width": this.column.style.width });
            }
            dataset_width_setting = parse_width_setting[dataset_id];
        }else {
            dataset_width_setting.push({"field":this.field, "current_width": this.column.style.width });
        }
        if (parse_width_setting) {
            parse_width_setting[dataset_id] = dataset_width_setting;
            localStorage.setItem('width_setting',JSON.stringify(parse_width_setting));
        } else {
            width_setting[dataset_id] = dataset_width_setting;
            localStorage.setItem('width_setting',JSON.stringify(width_setting));
        }
        
        if (this.pressed) {
            this.pressed = false;
            this.mousemoveListener();
            this.mouseupListener();
        }
    };

    // Function to get the padding based on width
    getPadding = (width: number) => {
        return width > 12 ? '0.3rem 0.75rem' : `0.3rem ${width < 10 ? 10 : width}px`;
    }
}
