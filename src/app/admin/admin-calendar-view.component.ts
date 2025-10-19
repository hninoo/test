import { Component, HostListener, Input, OnInit, ViewChild,ViewEncapsulation, SimpleChanges} from '@angular/core';
import {Data} from '../class/Data';
import {Router} from '@angular/router'
import {TableInfo} from '../class/TableInfo';
import {SharedService} from 'app/services/shared';
import {Grant} from '../class/Grant';
import {Connect} from 'app/services/connect';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Conditions} from '../class/Conditions';
import {CalendarOptions, FullCalendarComponent} from '@fullcalendar/angular';
import jaLocale from '@fullcalendar/core/locales/ja';
import {Form} from '../class/Form';
import { DatePipe } from '@angular/common';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'admin-calendar-view',
    templateUrl: './admin-calendar-view.component.html',
    styleUrls: ['./admin-calendar-view.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AdminCalendarViewComponent implements OnInit {
    @Input() checked_delete_id_a: Array<number> = []
    @Input() export_data: boolean;
    @Input() isSummarizeMode: boolean = false;
    @Input() isShowManageCol: boolean = false;
    @Input() is_relation_table: boolean = false;
    @Input() checkboxChange: Function;
    @Input() table_info: TableInfo;
    @Input() isEditMode: boolean;
    @Input() openDeleteModal: Function;
    @Input() current_url: string;
    @Input() customFilter;
    @Input() toasterService;
    @Input() calendarDefaultDate: string;
    @ViewChild('relationConfirmModal') relationConfirmModal: any;
    @ViewChild('calendar') calendarComponent: FullCalendarComponent;

    calendarOptions: CalendarOptions;
    selectedDateAndColor: { [key: string]: string } = {};
    public calendarDateColor = [];

    public grant: Grant;
    public calendar_view_data: Array<Object> = [];
    private _connect: Connect;
    public data_a: Array<Data>;
    public calendarApi;
    public calendar_view_datetime_form: Form;
    public calendar_view_datetime_from_form: Form;
    public calendar_view_datetime_to_form: Form;
    public maxEventsCount: number = 0;
    public maxEventsHeight: number = 0;

    public prev_start: string;
    public prev_end: string;

    public pre_from_field_name: string = '';
    public pre_to_field_name: string = '';

    private viewTimer;

    constructor(private _router: Router, _connect: Connect, private _share: SharedService, private datePipe: DatePipe) {
        this._connect = _connect;

    }

    ngOnChanges(changes: SimpleChanges) {
        let loadList = false;
        for (let propName in changes) {
            if (changes.hasOwnProperty(propName) && (propName === 'table_info' || propName === 'customFilter')) {
                loadList = true;
            }
        }
        if (!changes.customFilter || changes.customFilter.firstChange) {
            this.ngOnInit(loadList);
        }
    }

    ngOnInit(loadList = false) {
        var today = new Date();

        if (this.table_info.menu.from_to_calendar_view_datetime) {
            this.calendar_view_datetime_from_form = this.table_info.forms.getArray().find((_form: Form, indes) => {
                return _form.field['Field'] == this.table_info.menu.calendar_view_datetime_from;
            });
            this.calendar_view_datetime_to_form = this.table_info.forms.getArray().find((_form: Form, indes) => {
                return _form.field['Field'] == this.table_info.menu.calendar_view_datetime_to;
            });
        } else {
            this.calendar_view_datetime_form = this.table_info.forms.getArray().find((_form: Form, indes) => {
                return _form.field['Field'] == this.table_info.menu.calendar_view_datetime;
            });
        }
        // 原因はわからないがviewの設定、解除の時にカレンダーが表示されないことがある
        // 0.2秒ほど待てば発生しなくなったので入れた
        if (loadList) {
            this.viewTimer = setTimeout(() => {
                this.getList(today.getFullYear(), today.getMonth(), this.prev_start, this.prev_end);
                this.setNoClickable();
            }, 200);
        }

        if( !this.calendarDefaultDate ) {
            this.calendarComponent?.getApi().gotoDate(new Date());
        }
    }

    //start for print only

    pxTomm(px) {
        return px / 3.7795275591;
    }
    //portrait view only
    checkPrintNextPage(px) {
        let pxTomm = this.pxTomm(px);
        return Math.floor(pxTomm / 210);
    }

    @HostListener('window:beforeprint') onBeforePrint() {
        let tableHeight = 0;
        let tableHeights = [];
        let $trs = $('tr>td tr');
        $trs.each((i, elm) => {
            let maxEventLength = $(elm).find('td').toArray().reduce((a, b) => Math.max(a, $(b).find('.fc-event-main').length), -Infinity)
            let maxEventHeight = $(elm).find('td .fc-event-main').toArray().reduce((a, b) => Math.max(a, $(b).height()), 0);
            maxEventHeight = Math.ceil(maxEventHeight);
            let height = 100;
            if (maxEventLength > 1) height = maxEventHeight * maxEventLength;
            tableHeight += height;

            $(elm).css("height", `${height}px`)

            if (this.checkPrintNextPage(tableHeight)) {
                $($trs[i - 1]).addClass('break-next-page');
                tableHeights.push(tableHeight - height);
                tableHeight = height// + tableHeight - 794;
            }
        })
        // if(!this.checkPrintNextPage(tableHeight))tableHeight += 100;
        tableHeights.push(tableHeight);
        tableHeight = tableHeights.reduce((total, val) => total + val);
        // only work for protrait
        var css = '@page { size:A4 portrait;maring:0mm } body{ -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; } ',
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        style.media = 'print';
        style.id = 'calendar-print';
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);

        this.calendarComponent.getApi().setOption('handleWindowResize', false);
        $('.fc .fc-view-harness').css('height', `${tableHeight}px`);
        $('.full-calendar').css('min-height', `${tableHeight}px`);
        this.calendarComponent.getApi().updateSize();
        // $('.fc .fc-view-harness').css('height', `${tableHeight}px`);
    }
    @HostListener('window:afterprint') onAfterPrint() {
        //remove print inline css
        document.getElementById('calendar-print').remove();
        $('tr>td tr').css("height", 'unset');
        $('.fc .fc-view-harness').css('height', '800px');
        $('.full-calendar').css('min-height', 'unset');
        this.calendarComponent.getApi().setOption('handleWindowResize', true);
        this.calendarComponent.getApi().updateSize();
    }
    //end for print only


    getList(year: number, month: number, start: string = null, end: string = null) {
        // Create a deep copy of the filter for calendar display
        // This prevents the original customFilter from being modified and losing view filter settings
        let filter = this.customFilter ? cloneDeep(this.customFilter) : new CustomFilter();

        if (start != null && end != null) {
            if (this.table_info.menu['from_to_calendar_view_datetime']) {
                let from_field_name = this.calendar_view_datetime_from_form?.field?.['Field'] || '';
                let to_field_name = this.calendar_view_datetime_to_form?.field?.['Field'] || '';
                for (let i = filter.conditions.getSearchParam().length - 1; i >= 0; i--) {
                    // 設定済みのカレンダー用フィルター削除
                    let condition = filter.conditions.getSearchParam()[i];
                    if ((condition.field === from_field_name || condition.field === this.pre_from_field_name) && condition.condition === 'lt' && condition.value === this.prev_end) {
                        filter.conditions.condition_a.splice(i, 1);
                    }
                    if ((condition.field === from_field_name || condition.field === this.pre_from_field_name) && condition.condition === 'null'){
                        filter.conditions.condition_a.splice(i, 1);
                    }
                    if ((condition.field === to_field_name || condition.field === this.pre_to_field_name) && condition.condition === 'gt' && condition.value === this.prev_start){
                        filter.conditions.condition_a.splice(i, 1);
                    }
                    if ((condition.field === to_field_name || condition.field === this.pre_to_field_name) && condition.condition === 'null'){
                        filter.conditions.condition_a.splice(i, 1);
                    }
                }
                filter.conditions.addCondition('lt', from_field_name, end);
                filter.conditions.addCondition('null', from_field_name, null, 'or');
                filter.conditions.addCondition('gt', to_field_name, start);
                filter.conditions.addCondition('null', to_field_name, null, 'or');
                this.pre_from_field_name = from_field_name;
                this.pre_to_field_name = to_field_name;
                // Don't reassign to this.customFilter to preserve original view filter settings
                // this.customFilter = filter;
            } else {
                let field_name = this.calendar_view_datetime_form.field['Field'];

                for (let i = filter.conditions.getSearchParam().length - 1; i >= 0; i--) {
                    // 設定済みのカレンダー用フィルター削除
                    let condition = filter.conditions.getSearchParam()[i];
                    if (condition.field === field_name && condition.condition === 'gt' && (condition.value === this.prev_start || condition.value === start)) {
                        filter.conditions.condition_a.splice(i, 1);
                    }
                }

                for (let i = filter.conditions.getSearchParam().length - 1; i >= 0; i--) {
                    // 設定済みのカレンダー用フィルター削除
                    let condition = filter.conditions.getSearchParam()[i];
                    if (condition.field === field_name && condition.condition === 'lt_ne' && (condition.value === this.prev_end || condition.value === end)) {
                        filter.conditions.condition_a.splice(i, 1);
                    }
                }

                filter.conditions.addCondition('gt', field_name, start);
                filter.conditions.addCondition('lt_ne', field_name, end);

                // Don't reassign to this.customFilter to preserve original view filter settings
                // this.customFilter = filter;
            }

            this.prev_start = start;
            this.prev_end = end;
            filter.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share);
        } else {

            if (this.calendarDefaultDate) {
                let defaultDate = this.calendarDefaultDate.replace(/\//g, '-');
                let date = new Date( defaultDate );
                let formattedDefaultDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
                this.calendarComponent.getApi().gotoDate(formattedDefaultDate);
            }
        }

        // Use the cloned filter for calendar display
        // Calendar view needs all fields, so clear show_fields (already working on a copy)
        let calendarFilter = filter;
        calendarFilter.show_fields = [];
        this._connect.getList(this.table_info, 1, 1000, calendarFilter).subscribe((data) => {
            this.data_a = [];
            data['data_a'].forEach(_data => {
                let newdata = new Data(this.table_info);
                newdata.setInstanceData(_data)
                this.data_a.push(newdata);
            });
            this.convertToCalendarViewData(this.data_a);
        });

        // Set date and color for calendar from table_info
        this.calendarDateColor = JSON.parse(this.table_info.menu.calendar_date_color);
    }

    convertToCalendarViewData(data_a: Array<Data>) {
        let calendar_view_datetime_form: Form;
        let calendar_view_datetime_from_form: Form;
        let calendar_view_datetime_to_form: Form;
        let field_displaying_in_calendar_view_form: Form;

        this.calendar_view_data = [];

        // 日時フィールドのデータを取得

        if (this.table_info.menu.from_to_calendar_view_datetime) {
            calendar_view_datetime_from_form = this.table_info.forms.getArray().find(_form => _form.field['Field'] == this.table_info.menu.calendar_view_datetime_from);
            calendar_view_datetime_to_form = this.table_info.forms.getArray().find(_form => _form.field['Field'] == this.table_info.menu.calendar_view_datetime_to);
        } else {
            calendar_view_datetime_form = this.table_info.forms.getArray().find(_form => _form.field['Field'] == this.table_info.menu.calendar_view_datetime);
        }


        field_displaying_in_calendar_view_form = this.table_info.forms.getArray().find(_form => _form.field['Field'] == this.table_info.menu.field_displaying_in_calendar_view);

        this.data_a.forEach((data_one, key) => {
            let title: string, start: string, end: string, color: string, text_color: string, row_style: {}, data;
            title = this.convertFormat(this.table_info.menu.field_displaying_in_calendar_view, this.table_info.fields, data_one.view_data);

            // 画像を表示する場合
            let img_link = data_one.view_data[this.table_info['_menu']['_image_field_displaying_in_calendar_view']];
            if (img_link == undefined) {
                img_link = null;
            }

            color = '#67C2EF';
            text_color = '#ffffff'
            row_style = data_one.row_style
            if (row_style) {
                color = row_style['backgroundColor']
                text_color = row_style['color']
            }

            data = {
                _router: this._router,
                id: data_one.raw_data['id'],
                table: this.table_info.menu.table,
                admin_table: this._share.getAdminTable(),
                data: data_one,
                table_info: this.table_info,
                _share: this._share,
                _connect: this._connect,
                toasterService: this.toasterService,
            };

            if (this.table_info.menu.from_to_calendar_view_datetime) {

                let date_time_from: object = data_one.raw_data[calendar_view_datetime_from_form.field['Field']] ? this.convertStringIntoTime(data_one.raw_data[calendar_view_datetime_from_form.field['Field']]) : null;

                let start_dt: Date | null = null;

                if (date_time_from && date_time_from['date'] && date_time_from['time']) {
                    const isoString = `${date_time_from['date']}T${date_time_from['time']}`;
                    start_dt = new Date(isoString);
                }

                let date_time_to: object = data_one.raw_data[calendar_view_datetime_to_form.field['Field']] ? this.convertStringIntoTime(data_one.raw_data[calendar_view_datetime_to_form.field['Field']], true) : null;

                let end_dt: Date | null = null;

                if (date_time_to && date_time_to['date'] && date_time_to['time']) {
                    const isoString = `${date_time_to['date']}T${date_time_to['time']}`;
                    end_dt = new Date(isoString);
                }

                if (date_time_from && date_time_to && date_time_from['time'] === '00:00:00' && date_time_to['time'] === '00:00:00') {
                    date_time_from['all_day'] = true;
                }

                this.calendar_view_data.push({
                    title: title !== null && title !== 'null' ? title : '',
                    start: start_dt,
                    end: end_dt,
                    textColor: text_color,
                    backgroundColor: color,
                    imgurl: img_link,
                    allDay: date_time_from?.['all_day'],
                    data: {
                        ...data,
                        originalEnd: end_dt
                    }
                });
            } else {
                let date_time: object = this.convertStringIntoTime(data_one.raw_data[calendar_view_datetime_form.field['Field']]);
                start = date_time['date'] + 'T' + date_time['time'];
                this.calendar_view_data.push({
                    title: title !== null && title !== 'null' ? title : '',
                    start: start,
                    textColor: text_color,
                    backgroundColor: color,
                    imgurl: img_link,
                    allDay: date_time['all_day'],
                    data: data
                });
            }
        });
        this.drawCalendar();
        this.updateColor();
    }

    // "{ID}などの表現を表示できる形式にする。 ex) ID = 2の時、{ID}は2になる。"
    convertFormat(format_str: string, field: any, view_data: any): string {
        let list = [];
        let result_str: string = '';

        field.forEach(field_one => {
            list.push(['{' + field_one['Comment'] + '}', field_one['Field']]);
        });

        result_str = format_str;
        for (let i = 0; i < list.length; i++) {
            result_str = result_str.replace(list[i][0], view_data[list[i][1]] !== null && view_data[list[i][1]] !== 'null' ? view_data[list[i][1]] : '');
        }
        let result_str_temp: string = '';
        while (result_str != result_str_temp) {
            result_str_temp = result_str;
            for (let i = 0; i < list.length; i++) {
                result_str = result_str.replace(list[i][0], view_data[list[i][1]]);
            }
        }
        return result_str;
    }

    convertStringIntoTime(date_string: string, is_end = false): Object {
        let date: string;
        let time: string;
        let all_day: boolean;
        if (!date_string) {
            return {'all_day': false, 'date': null, 'time': null};
        }
        if (typeof date_string !== 'string') {
            date_string = String(date_string);
        }
        [date, time] = date_string.split(' ', 2);
        all_day = (time == null || time == undefined) ? true : false;
        if (all_day) {
            if (is_end) {
                //+1 date
                let newDt = new Date(date)
                newDt.setDate(newDt.getDate() + 1);
                var y = newDt.getFullYear();
                var m = ('00' + (newDt.getMonth() + 1)).slice(-2);
                var d = ('00' + (newDt.getDate())).slice(-2);
                var result = y + '-' + m + '-' + d;
                date = result
            }

            time = '00:00:00';
        }
        ;
        return {'all_day': all_day, 'date': date, 'time': time};
    }

    convertStringIntoTime2(date_time: string) {
        let year: string;
        let month: string;
        let date: string;
        let dummy: string;
        [date_time, dummy] = date_time.split('T', 2);
        [year, month, date] = date_time.split('-', 3);
        return {'year': Number(year), 'month': Number(month), 'date': Number(date)};
    }

    drawCalendar() {
        this.calendarOptions = {
            //timeZone: 'asia/Tokyo',
            events: this.calendar_view_data,

            eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
            locale: jaLocale,
            headerToolbar: {
                center: 'dayGridMonth,timeGridWeek,timeGridDay',
                end: 'today,prevYear,prev,next,nextYear'
            },
            navLinks: true,
            fixedWeekCount: false,
            eventStartEditable: true,
            eventDrop:  function (info)  {

                let data = info.event['_def']['extendedProps']['data']

                const start = info.event.start.toLocaleString("sv-SE").replace("T", " ");
                const end = info.event.end
                ? info.event.end.toLocaleString("sv-SE").replace("T", " ")
                : data.originalEnd ? info.event.start.toLocaleString("sv-SE").replace("T", " ") : '';

                let url = '/admin/edit/' + data.table + '/' + data.id

                if (!data.table_info.menu.from_to_calendar_view_datetime) {// from to表示でない場合
                    let day_field = data.table_info.menu.calendar_view_datetime
                    let hash = {}
                    hash[day_field] = start;
                    data.data.setRawData(hash)
                } else {// from to表示の場合
                    let day_field_from = data.table_info.menu.calendar_view_datetime_from
                    let day_field_to = data.table_info.menu.calendar_view_datetime_to
                    let hash = {}
                    hash[day_field_from] = start;
                    if (!hash[day_field_to]) {
                        hash[day_field_to] = end || start;
                    }
                    data.data.setRawData(hash)
                }

                // 変更を反映させる
                let formData = data._share.get_post_data(data.table_info, data.data, data.table_info.fields, data.table_info.forms, data.table_info.child_a, 'edit');
                formData.append('ignore_child', true);
                data._connect.postUpload(url, formData).subscribe(
                    (jsonData) => {
                        let successConfig = {
                            tapToDismiss: true,
                            timeOut: 1000,
                            newestOnTop: false
                        };
                        data.toasterService.success('変更が完了しました。', '成功', this.successConfig);
                    },
                    (error) => {
                        console.log('edit error!!!')
                        window.location.reload();
                    }
                )

            },

            eventDisplay: 'block',
            eventClick: (event) => {
                const eventDate = this.datePipe.transform(event.event.start, 'yyyy-MM-dd');
                
                let parameterObj = {};
                parameterObj['queryParams'] = {
                    registeredDate: eventDate
                };

                this._router.navigate([event['event']['_def']['extendedProps']['data']['admin_table'], event['event']['_def']['extendedProps']['data']['table'], 'view', event['event']['_def']['extendedProps']['data']['id']], parameterObj);
            },
            views: {
                dayGridMonth: {
                    eventContent: (event, eventElement) => {
                        const imgurl = event.event._def.extendedProps.imgurl?.display_url;
                        const title = event.event.title;
                        if(imgurl != null) {
                            const html_tag = `<div style="width: 130px; margin: 1%;"><img src="${imgurl}" alt="画像" title="${title}" style="width: 100%; object-fit: cover; height: 80px;"><p style="margin-top: 5px; margin-bottom: 4px;">${title}</p></div>`
                            return {html: html_tag}
                        }
                    },
                    eventDidMount: (info) => {
                        this.updateColor();
                    }
                },
                timeGridWeek: {
                    eventContent: (event, eventElement) => {
                        const imgurl = event.event._def.extendedProps.imgurl?.display_url;
                        const title = event.event.title;
                        if (imgurl != null) {
                            const html_tag = `
                            <div class="event-content" style="width: 100%; display: flex; flex-direction: row;">
                                <span class="event-title" style="margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
                                <img class="event-image" src="${imgurl}" alt="画像" title="${title}" style="object-fit: cover; width: 100%;">
                            </div>`;
                            return {html: html_tag}
                        }
                    },
                    eventDidMount: (info)=> {
                        const titleElement = info.el.querySelector('.event-title') as HTMLElement;
                        const imgElement = info.el.querySelector('.event-image') as HTMLElement;
                        const eventContentElement = info.el.querySelector('.event-content') as HTMLElement;

                        if(titleElement && imgElement && eventContentElement){
                            const parentOfEventContent = eventContentElement.parentElement;

                            if (parentOfEventContent.offsetHeight > 30) {
                                 // 予定が2行以上の時は画像は下に
                                eventContentElement.style.display = 'block'
                                imgElement.style.display = 'block';
                                titleElement.style.display = 'block';
                                let availableHeight = parentOfEventContent.offsetHeight - titleElement.offsetHeight - 4;
                                imgElement.onload = function() {
                                    if (imgElement.offsetHeight > availableHeight) {
                                        imgElement.style.height = availableHeight + 'px';
                                        imgElement.style.width = 'auto';
                                    }
                                }
                            } else {
                                imgElement.style.display = 'inline-block';
                                imgElement.style.width = '20%';
                                titleElement.style.display = 'inline-block';
                                titleElement.style.width = 'calc(80% - 4px)';

                            }
                        }
                        this.updateColor();

                    }
                },
                timeGridDay: {
                    eventContent: (event, eventElement) => {
                        const imgurl = event.event._def.extendedProps.imgurl?.display_url;
                        const title = event.event.title;
                        if(imgurl != null) {
                            let html_tag = `
                            <div class="event-content" style="width: 100%; display: flex; flex-direction: row;">
                                <span class="event-title" style="margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
                                <img class="event-image" src="${imgurl}" alt="画像" title="${title}" style="object-fit: cover;">
                            </div>`;
                            return {html: html_tag}
                        }
                    },
                    eventDidMount: (info) => {
                        const elementWidth = info.el.offsetWidth;
                        const titleElement = info.el.querySelector('.event-title') as HTMLElement;
                        const imgElement = info.el.querySelector('.event-image') as HTMLElement;
                        const eventContentElement = info.el.querySelector('.event-content') as HTMLElement;

                        if(titleElement && imgElement && eventContentElement){
                            const parentOfEventContent = eventContentElement.parentElement;
                            if (parentOfEventContent.offsetHeight > 30) {

                                 // 予定が2行以上の時は画像は下に
                                eventContentElement.style.display = 'block'
                                imgElement.style.display = 'block';
                                titleElement.style.display = 'block';
                                let availableHeight = parentOfEventContent.offsetHeight - titleElement.offsetHeight - 4;
                                imgElement.onload = function() {
                                    if (imgElement.offsetHeight > availableHeight) {
                                        imgElement.style.height = availableHeight + 'px';
                                        imgElement.style.width = 'auto';
                                    }
                                    // 予定が複数あって、画像が重なるときは画像のサイズを半分にする
                                    if ((elementWidth / 2) < parentOfEventContent.offsetHeight) {
                                        imgElement.style.width = elementWidth / 2 + 'px';
                                        imgElement.style.height = 'auto';
                                    }
                                };

                            } else {
                                imgElement.style.display = 'inline-block';
                                imgElement.style.width = 'auto';
                                titleElement.style.display = 'inline-block';
                                imgElement.style.height = parentOfEventContent.offsetHeight + 'px';
                            }
                        }
                        this.updateColor();
                    }
                }
            },
            datesSet: (dateInfo) => {
                let start = this.convertStringIntoTime2(dateInfo.startStr);

                const formatDate = (dateStr) => {
                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = ('0' + (date.getMonth() + 1)).slice(-2);
                    const day = ('0' + date.getDate()).slice(-2);
                    const hours = ('0' + date.getHours()).slice(-2);
                    const minutes = ('0' + date.getMinutes()).slice(-2);
                    const seconds = ('0' + date.getSeconds()).slice(-2);
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                };

                let formattedStartStr = formatDate(dateInfo.startStr);
                let formattedEndStr = formatDate(dateInfo.endStr);

                this.getList(start.year, start.month, formattedStartStr, formattedEndStr);

                let currentView = dateInfo.view.type;
                if (currentView === 'dayGridMonth') {
                    // 少し描画を待たないとイベントの数が取得できない
                    setTimeout(() => {
                        this.getEventCount(currentView);

                        // デフォルトの高さを超えるとき適用
                        if (this.maxEventsHeight > 170) {
                            const dayElems = document.querySelectorAll('.fc-daygrid-day');
                            dayElems.forEach((elem: any) => {
                                (elem as HTMLElement).style.height = `${this.maxEventsHeight + 30}px`;
                            });
                        }
                    }, 500);

                } else if (currentView === 'timeGridWeek') {
                    // 少し描画を待たないとイベントの数が取得できない
                    setTimeout(() => {
                        this.getEventCount(currentView);
                        const dayElems = document.querySelectorAll('.fc-daygrid-day');
                        // デフォルトの高さを超えるとき適用
                        if (this.maxEventsCount * 30 > 90) {
                            dayElems.forEach((elem: any) => {
                                (elem as HTMLElement).style.height = `${this.maxEventsCount * 30}px`;
                            });
                        } else {
                            dayElems.forEach((elem: any) => {
                                (elem as HTMLElement).style.height = `100px`;
                            });
                        }

                    }, 100);
                } else if (currentView === 'timeGridDay') {
                    // 少し描画を待たないとイベントの数が取得できない
                    setTimeout(() => {
                        this.getEventCount(currentView);
                        const dayElems = document.querySelectorAll('.fc-daygrid-day');
                        // デフォルトの高さを超えるとき適用
                        if (this.maxEventsCount * 20 > 90) {
                            dayElems.forEach((elem: any) => {
                                (elem as HTMLElement).style.height = `${this.maxEventsCount * 30}px`;
                            });
                        } else {
                            dayElems.forEach((elem: any) => {
                                (elem as HTMLElement).style.height = `100px`;
                            });
                        }
                    }, 100);
                }

                this.setNoClickable();
            },
            navLinkDayClick: (date, jsEvent) => {
                this._router.navigate([this._share.getAdminTable(), this.table_info.table, 'edit', 'new'], {
                    queryParams: {
                        'year_calendar': date.getFullYear(),
                        'month_calendar': date.getMonth() + 1,
                        'date_calendar': date.getDate()
                    }
                });
            },
            dayCellContent: (arg) => {
                this.detectSelectedDates(arg.date);
            }
        };
    }

    updateColor() {

        // loop through all selected dates
        for (let date in this.selectedDateAndColor) {
            // get the date element
            const dateElements = document.querySelectorAll(`[data-date="${date}"]`);
            // loop through all date elements
            dateElements.forEach(dateElement => {
                // if the date element exists, set the background color
                if (dateElement) {
                    (dateElement as HTMLElement).style.backgroundColor = this.selectedDateAndColor[date];
                }
            });
        }
    }

    detectSelectedDates( date ) {
        // Get day full name from date
        const dayName = date.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        // Get date (2021-10-01) from date in Japanese format
        const dateFor = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        // Get like 6th from date
        const dateStr = date.getDate() + 'th';

        // loop through all selected dates
        if (this.calendarDateColor) {
            this.calendarDateColor.forEach(selected => {
            // check if the date is in the array of dates
            if (selected.value === dateFor || selected.value === dateStr || selected.value === dayName) {
                    this.selectedDateAndColor[dateFor] = selected.color;
                }
            });
        }

    }
    setNoClickable() {
        // 子テーブルの場合は日付をクリックできないようにする
        if (this.table_info.is_child_form) {
            const elements = document.querySelectorAll('.fc-daygrid-day-number');
            elements.forEach(el => {
                el.classList.add('non-clickable');
            });
        } else {
            const elements = document.querySelectorAll('.fc-daygrid-day-number.non-clickable');
            elements.forEach(el => {
                el.classList.remove('non-clickable');
            });
        }
    }

    getEventCount(currentView) {
        const eventElems = document.querySelectorAll('.fc-daygrid-day-events');

        if (currentView === 'dayGridMonth') {
            let maxHeight = 0;
            eventElems.forEach((elem: any) => {
                const height = elem.offsetHeight || 0;
                if (height > maxHeight) {
                    maxHeight = height;
                }
            });
            this.maxEventsHeight = maxHeight;
        } else {
            let maxCount = 0;
            // 各日にちのイベントの数をチェックし、最大値を取得
            eventElems.forEach(elem => {
                const childElementCount = elem.children.length;
                if (childElementCount > maxCount) {
                    maxCount = childElementCount;
                }
            });
            this.maxEventsCount = maxCount;
        }


    }
}


