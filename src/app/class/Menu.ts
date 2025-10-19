export class Menu {
    get style(): string {
        return this._style;
    }

    get badge_text(): string {
        return this._badge_text;
    }

    get is_workflow(): boolean {
        return this._is_workflow;
    }

    get editable_on_list(): boolean {
        return this._editable_on_list;
    }

    private _child_menu_a: Array<Menu>
    private _default_order_asc_desc: string
    private _default_order_field: null
    private _download_csv_flg: boolean
    private _editable: boolean
    private _group: null
    private _group_delete_lock: boolean
    private _icon: string
    private _insert_last: boolean
    private _hide_insertable: boolean
    private _is_custom_table_definition: boolean
    private _show_table_header_sticky: boolean
    private _is_external: boolean
    private _is_onlyone: boolean
    private _is_page: boolean
    private _is_system_table: boolean
    private _link: Array<string>
    private _multiple_mode: string
    private _name: string
    private _noneed_grant: boolean
    private _only_admin: boolean
    private _only_own_data: boolean
    private _parent_id_field: null
    private _per_page: number
    private _show_confirm: boolean
    private _show_created: boolean
    private _show_admin: boolean
    private _show_delete_all: boolean
    private _show_id: boolean
    private _show_menu: boolean
    private _not_display_filter: boolean
    private _not_display_filter_view: boolean
    private _archive_flag: boolean
    private _show_updated: boolean
    private _sort_field: string
    private _sort_order: string
    private _table: string
    private _upload_csv_flg: boolean
    private _validate_func_a: Array<any>
    private _view_field_value_a: null
    private _editable_on_list: boolean;
    private _is_iframe_enabled: boolean;
    private _is_public_form_enabled: boolean;
    private _public_form_title: string;
    private _public_form_description: string;
    private _public_form_sent_text: string;
    private _table_type: string;

    //child

    private _max_child_number: number;


    //calendar
    private _is_calendar_view_enabled: boolean = false;
    private _show_calendar_view_only: boolean = false;
    private _field_displaying_in_calendar_view: string = null;
    private _from_to_calendar_view_datetime: string = null;
    private _calendar_view_datetime_from: string = null;
    private _calendar_view_datetime_to: string = null;
    private _calendar_view_datetime: string = null;
    private _calendar_date_color: string = null;

    private _popup_comment_after_save: boolean;
    private _hide_duplicate_button: boolean;
    private _layout_apply_view: boolean;
    private _merge_comment_and_history: boolean;
    private _is_workflow: boolean;
    private _style: string;
    private _top_memo: string;
    private _top_memo_title: string;
    private _top_memo_display_view: string;
    private _show_top_memo: boolean;
    private _workflow_reapply: boolean;
    private _workflow_reapply_other_user: boolean;
    private _workflow_salvage: boolean;
    private _workflow_back: boolean;
    private _workflow_flow_fixed_can_add: boolean;
    private _workflow_change_notify_for_division: boolean;
    private _workflow_same_user_skip: boolean;
    private _workflow_same_user_skip_only_continuity: boolean;
    private _workflow_change_mail_for_withdrawn: boolean;
    private _workflow_change_mail_title_for_withdrawn: string;
    private _workflow_change_mail_content_for_withdrawn: string;
    private _workflow_change_mail_for_submit: boolean;
    private _workflow_change_mail_title_for_submit: string;
    private _workflow_change_mail_content_for_submit: string;
    private _workflow_change_mail_for_denied: boolean;
    private _workflow_change_mail_title_for_denied: string;
    private _workflow_change_mail_content_for_denied: string;
    private _workflow_change_mail_for_completed: boolean;
    private _workflow_change_mail_title_for_completed: string;
    private _workflow_change_mail_content_for_completed: string;
    private _workflow_done_can_edit: string;
    private _workflow_done_can_edit_grant_group_id: string;


    private _badge_text: string = '';
    private _icon_image_url: string = null;

    private _is_set_duplicate_field: boolean = false;
    private _is_set_bulk_copy: boolean = false;
    private _enable_all_delete: boolean = true;
    private _enable_all_reject: boolean = true;

    private _use_google_map: boolean = false;
    private _use_google_map_edit: boolean = false;
    private _use_google_map_detail: boolean = false;
    private _google_map_address_field: string = null;
    private _google_map_lat_field: string = null;
    private _google_map_lng_field: string = null;

    //field of unique key name
    private _duplicate_fields: Array<string> = [];

    private _delete_lock:boolean;

    //for VIEW
    private _button_functions: Array<{ button_label: string, button_function: string, input_field_type: string, value: any, class: string }> = []

    constructor(hash) {
        this.setByHash(hash)

    }

    setByHash(hash = null) {
        if (!hash) {
            return;
        }
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }

    get is_iframe_enabled(): boolean {
        return this._is_iframe_enabled;
    }


    get is_public_form_enabled(): boolean {
        return this._is_public_form_enabled;
    }


    get public_form_title(): string {
        return this._public_form_title;
    }


    get public_form_sent_text(): string {
        return this._public_form_sent_text;
    }

    get public_form_description(): string {
        return this._public_form_description;
    }

    get popup_comment_after_save(): boolean {
        return this._popup_comment_after_save;
    }


    get hide_duplicate_button(): boolean {
        return this._hide_duplicate_button;
    }


    get layout_apply_view(): boolean {
        return this._layout_apply_view;
    }

    get merge_comment_and_history(): boolean {
        return this._merge_comment_and_history;
    }

    get child_menu_a(): Array<Menu> {
        return this._child_menu_a;
    }

    get default_order_asc_desc(): string {
        return this._default_order_asc_desc;
    }

    get default_order_field(): null {
        return this._default_order_field;
    }

    get download_csv_flg(): boolean {
        return this._download_csv_flg;
    }

    get editable(): boolean {
        return this._editable;
    }

    get group(): null {
        return this._group;
    }

    get group_delete_lock(): boolean {
        return this._group_delete_lock;
    }


    get icon(): string {
        return this._icon;
    }

    get insert_last(): boolean {
        return this._insert_last;
    }
    get hide_insertable(): boolean {
        return this._hide_insertable;
    }

    get is_custom_table_definition(): boolean {
        return this._is_custom_table_definition;
    }
    get show_table_header_sticky(): boolean {
        return this._show_table_header_sticky;
    }


    get is_external(): boolean {
        return this._is_external;
    }

    get is_onlyone(): boolean {
        return this._is_onlyone;
    }

    get is_page(): boolean {
        return this._is_page;
    }

    get is_system_table(): boolean {
        return this._is_system_table;
    }


    get link(): Array<string> {
        return this._link;
    }

    get multiple_mode(): string {
        return this._multiple_mode;
    }

    get name(): string {
        return this._name;
    }

    get noneed_grant(): boolean {
        return this._noneed_grant;
    }

    get only_admin(): boolean {
        return this._only_admin;
    }

    get only_own_data(): boolean {
        return this._only_own_data;
    }

    get parent_id_field(): null {
        return this._parent_id_field;
    }

    get per_page(): number {
        return this._per_page;
    }


    get show_confirm(): boolean {
        return this._show_confirm;
    }

    get show_created(): boolean {
        return this._show_created;
    }

    get show_delete_all(): boolean {
        return this._show_delete_all;
    }

    get show_id(): boolean {
        return this._show_id;
    }

    get show_menu(): boolean {
        return this._show_menu;
    }

    get not_display_filter(): boolean {
        return this._not_display_filter;
    }

    set not_display_filter(value:boolean) {
        this._not_display_filter = value;
    }

    get not_display_filter_view(): boolean {
        return this._not_display_filter_view;
    }
    set not_display_filter_view(value:boolean) {
        this._not_display_filter_view = value;
    }

    get archive_flag(): boolean {
        return this._archive_flag;
    }


    get show_updated(): boolean {
        return this._show_updated;
    }

    get sort_field(): string {
        return this._sort_field;
    }

    get sort_order(): string {
        return this._sort_order;
    }

    get table(): string {
        return this._table;
    }

    get upload_csv_flg(): boolean {
        return this._upload_csv_flg;
    }

    get validate_func_a(): Array<any> {
        return this._validate_func_a;
    }

    get view_field_value_a(): null {
        return this._view_field_value_a;
    }


    get show_admin(): boolean {
        return this._show_admin;
    }

    set show_admin(value: boolean) {
        this._show_admin = value;
    }

    get workflow_reapply(): boolean {
        return this._workflow_reapply;
    }

    get workflow_reapply_other_user(): boolean {
        return this._workflow_reapply_other_user;
    }


    get workflow_salvage(): boolean {
        return this._workflow_salvage;
    }

    get workflow_back(): boolean {
        return this._workflow_back;
    }

    get workflow_flow_fixed_can_add(): boolean {
        return this._workflow_flow_fixed_can_add;
    }

    get workflow_change_notify_for_division(): boolean {
        return this._workflow_change_notify_for_division;
    }

    get workflow_same_user_skip(): boolean {
        return this._workflow_same_user_skip;
    }

    get workflow_same_user_skip_only_continuity(): boolean {
        return this._workflow_same_user_skip_only_continuity;
    }
    get workflow_change_mail_for_submit(): boolean {
        return this._workflow_change_mail_for_submit;
    }
    get workflow_change_mail_title_for_submit(): string {
        return this._workflow_change_mail_title_for_submit;
    }
    get workflow_change_mail_content_for_submit(): string {
        return this._workflow_change_mail_content_for_submit;
    }

    get workflow_change_mail_for_completed(): boolean {
        return this._workflow_change_mail_for_completed;
    }
    get workflow_change_mail_title_for_completed(): string {
        return this._workflow_change_mail_title_for_completed;
    }
    get workflow_change_mail_content_for_completed(): string {
        return this._workflow_change_mail_content_for_completed;
    }
    get workflow_done_can_edit(): string {
        return this._workflow_done_can_edit;
    }
    get workflow_done_can_edit_grant_group_id(): string {
        return this._workflow_done_can_edit_grant_group_id;
    }

    get workflow_change_mail_for_denied(): boolean {
        return this._workflow_change_mail_for_denied;
    }
    get workflow_change_mail_title_for_denied(): string {
        return this._workflow_change_mail_title_for_denied;
    }
    get workflow_change_mail_content_for_denied(): string {
        return this._workflow_change_mail_content_for_denied;
    }

    get workflow_change_mail_for_withdrawn(): boolean {
        return this._workflow_change_mail_for_withdrawn;
    }
    get workflow_change_mail_title_fo_withdrawnt(): string {
        return this._workflow_change_mail_title_for_withdrawn;
    }
    get workflow_change_mail_content__withdrawnmit(): string {
        return this._workflow_change_mail_content_for_withdrawn;
    }
    get top_memo(): string {
        return this._top_memo;
    }

    get top_memo_title(): string {
        return this._top_memo_title;
    }

    get show_top_memo(): boolean {
        return this._show_top_memo;
    }

    get use_google_map(): boolean {
        return this._use_google_map;
    }

    get use_google_map_edit(): boolean {
        return this._use_google_map_edit;
    }

    get use_google_map_detail(): boolean {
        return this._use_google_map_detail;
    }


    get google_map_address_field(): string {
        return this._google_map_address_field;
    }

    get google_map_lat_field(): string {
        return this._google_map_lat_field;
    }

    get google_map_lng_field(): string {
        return this._google_map_lng_field;
    }


    get max_child_number(): number {
        return this._max_child_number;
    }

    get is_calendar_view_enabled(): boolean {
        return this._is_calendar_view_enabled;
    }

    get show_calendar_view_only(): boolean {
        return this._show_calendar_view_only;
    }


    get field_displaying_in_calendar_view(): string {
        return this._field_displaying_in_calendar_view;
    }

    get from_to_calendar_view_datetime(): string {
        return this._from_to_calendar_view_datetime;
    }

    get calendar_date_color(): string {
        return this._calendar_date_color;
    }

    get calendar_view_datetime_from(): string {
        return this._calendar_view_datetime_from;
    }

    get calendar_view_datetime_to(): string {
        return this._calendar_view_datetime_to;
    }

    get calendar_view_datetime(): string {
        return this._calendar_view_datetime;
    }

    get table_type(): string {
        return this._table_type;
    }

    public isDisplayMemo(view_name: string) {
        return this.show_top_memo && this._top_memo_display_view && this._top_memo_display_view.split(',').indexOf(view_name) >= 0
    }

    public isDisplayGoogleMap() {
        return this.use_google_map
    }

    public isDisplayGoogleMapEdit() {
        return this.use_google_map_edit
    }

    public isDisplayGoogleMapDetail() {
        return this.use_google_map_detail
    }

    public getGoogleMapAddressField() {
        return this.google_map_address_field
    }

    public getGoogleMapLatField() {
        return this.google_map_lat_field
    }

    public getGoogleMapLngField() {
        return this.google_map_lng_field
    }

    public getMaxDataNumber(): number {
        return this.max_child_number ?? 300;

    }


    get button_functions(): Array<{ button_label: string; button_function: string, input_field_type: string, value: any, class: string }> {
        return this._button_functions;
    }


    get icon_image_url(): string {
        return this._icon_image_url;
    }

    get is_set_duplicate_field(): boolean {
        return this._is_set_duplicate_field;
    }

    get is_set_bulk_copy(): boolean {
        return this._is_set_bulk_copy;
    }

    get enable_all_delete(): boolean {
        return this._enable_all_delete;
    }

    get enable_all_reject(): boolean {
        return this._enable_all_reject;
    }

    get duplicate_fields(): Array<string> {
        return this._duplicate_fields;
    }

    get delete_lock(): boolean {
        return this._delete_lock;
    }
}
