import { Component, OnInit, Input } from '@angular/core';
import {TableInfo} from '../class/TableInfo';
import {SharedService} from '../services/shared';
import {Forms} from '../class/Forms';
import {Connect} from '../services/connect';
import {Data} from '../class/Data';


@Component({
  selector: 'google-calendar',
  templateUrl: './google-calendar.component.html',
  styleUrls: ['./google-calendar.component.css']
})
export class GoogleCalendarComponent implements OnInit {

  @Input() table_info: TableInfo;
  @Input() forms: Forms;
  @Input() data: Data;
  @Input() c_data: Data;

  public show_google_calendar = false;
  public calendar_events = [];



  constructor(
    public _share: SharedService,
    private _connect: Connect) { }

  ngOnInit(): void {
    if (!this._share.cloud_setting) {
                    
      // たまにないので、なかったら取得
      this._share.loadAdminDatas().then(() => {
          this.checkAndLoadGoogleCalendarEvents();
      });
  } else {
      this.checkAndLoadGoogleCalendarEvents();
  }
  }

  checkAndLoadGoogleCalendarEvents(): void {
    if (this.table_info.isTableByType('google-calendar') && this._share.useGoogleCalendar()) {
      this.getGoogleCalendarEvents();
    }
  }

  getGoogleCalendarEvents() {
    const date_form = this.forms.byColumnType('calendar_date');
    this._connect.post('/admin/google-calendar/get', { 'date': this.data.raw_data[date_form.field['Field']] }).subscribe(
      (data) => {

        this.show_google_calendar = true;
        this.calendar_events = data['events'];

        this.reloadCalendar();
      }
    )
  }

  reloadCalendar(c_data = null) {
    const detail_table = this.data.child_a.find(child => child.isTableByType('google-calendar-detail'));
    let id_form = detail_table.forms.byColumnType('calendar_id');
    let event_form = detail_table.forms.byColumnType('calendar_event');
    let time_form = detail_table.forms.byColumnType('calendar_time');

    if (this.calendar_events.length === 0) {
      this.calendar_events['dummyEventId'] = {
        eventId: 'dummyEventId',
        summary: '予定がありません',
        startTime: null,
        endTime: null,
        start_end: null
      };
    }
    for (let key in this.calendar_events) {
      for (let i in this.data.child_data_by_table[detail_table.table]) {
        if (key == this.data.child_data_by_table[detail_table.table][i].raw_data[id_form.field['Field']]) {

          // 自動同期
          this.data.child_data_by_table[detail_table.table][i].raw_data[event_form.field['Field']] = this.calendar_events[key].summary;
          this.data.child_data_by_table[detail_table.table][i].view_data[event_form.field['Field']] = this.calendar_events[key].summary;
          this.data.child_data_by_table[detail_table.table][i].raw_data[time_form.field['Field']] = this.calendar_events[key].field_period;
          this.data.child_data_by_table[detail_table.table][i].view_data[time_form.field['Field']] =  this.calendar_events[key].field_period;
          this.data.child_data_by_table[detail_table.table][i]._last_dirty_changed = new Date();
          // 設定済みのものはカレンダーには表示しない
          delete this.calendar_events[key];
        }
      }
    }
  }

  handleEventClick(c_data, event) {

    let event_form = c_data.table_info.forms.byColumnType('calendar_event');
    let time_form = c_data.table_info.forms.byColumnType('calendar_time');
    let id_form = c_data.table_info.forms.byColumnType('calendar_id');
    if (event_form) {
        c_data.raw_data[event_form.field['Field']] = event.summary;
        c_data.view_data[event_form.field['Field']] = event.summary;
    }

    if (time_form) {
        c_data.raw_data[time_form.field['Field']] = event.field_period;
        c_data.view_data[time_form.field['Field']] = event.field_period;
    }
    if (id_form) {
        c_data.raw_data[id_form.field['Field']] = event.eventId;
        c_data.view_data[id_form.field['Field']] = event.eventId;
    }
    for (let key in this.calendar_events) {
        if (c_data.raw_data[id_form.field['Field']] == key) {
            delete this.calendar_events[key];
        }
    }
    c_data._last_dirty_changed = new Date();
    this.getGoogleCalendarEvents()

}


}
