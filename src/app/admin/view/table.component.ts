import { Component, HostListener, Input, OnChanges, EventEmitter, Output } from '@angular/core';
import {SharedService} from '../../services/shared';
import {Router} from '@angular/router';
import {Data} from '../../class/Data';
import {Forms} from '../../class/Forms';
import { GroupService } from 'app/services/utils/group-service';
import { SortingService } from 'app/services/utils/sorting-service';
import { OrientationChangeService } from 'app/services/utils/orientation-handler-service';
import {GlobalVariables} from 'app/common/global-variables';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import * as cloneDeep from 'lodash/cloneDeep';
import { TableInfo } from '../../class/TableInfo';


@Component({
    selector: 'admin-view-table',
    templateUrl: './table.component.html',
})

export class ViewTableComponent implements OnChanges {
    @Input('fields') fields: Array<any>;
    @Input('ignore_fieldname_a') ignore_fieldname_a: Array<string> = [];
    @Input('table') table: string;
    @Input('forms') forms: Forms;
    @Input('data') data: Data;
    @Input('extend_headers') extend_headers: Array<any>;
    @Input('filter') customFilter: CustomFilter = null;
    @Input() selectDataMode: boolean = false;
    @Input() relation_table_a:  Array<any>;
    @Input() is_relation_view_mode:  boolean = false;
    @Input() relation_show_field: Array<any>;
    @Output() onDelete: EventEmitter<Object> = new EventEmitter();

    public fieldrows: Array<any>;
    public downloading: Object = {};
    private narrow_view_fields;
    private wide_view_fields;

    private style_by_field = {}

    public table_type = null;
    public table_info = null;
    public is_viewable_detail: boolean = true;

    constructor(public _share: SharedService, private _router: Router, public groupService: GroupService, public sortingService: SortingService, private orienationChangeService: OrientationChangeService) {

    }

    @HostListener('window:orientationchange', ['$event'])
    handleOrientationChange(event) {
        this.fieldrows = this.orienationChangeService.changeFieldOrientation(this.wide_view_fields, this.narrow_view_fields)
    }


    sortWithRelationTable(fields, relation_fields) {

        if (this.customFilter && this.customFilter.show_fields) {
            fields = this.customFilter.show_fields.map((field_name, key) => {
                return fields.find(f => {
                    f['y'] = key;
                    return f['Field'] === field_name
                })
            }).filter(f => {
                return !!f
            })

            relation_fields = this.customFilter.show_fields.map((field_name, key) => {
                return relation_fields.find(f => {
                    f['y'] = key;
                    return f['Field'] === field_name
                })
            }).filter(f => {
                return !!f
            })
        } else {
            fields = fields.map((f, key) => {
                f['y'] = f['y_base'];
                return f;
            });
        }

        const fieldNamesToUpdate = ["admin_id", "updated_admin_id", "updated", "created"];
        const lastFourFields = fields.slice(-4).map(f => f.Field);

        relation_fields.sort((a, b) => {
            return a.edit_component_y_order - b.edit_component_y_order;
        });

        // 関連テーブルのedit_component_y_orderとfieldのを比べて並び替え
        const merged = fields.concat(relation_fields);
        merged.sort((a, b) => {
            // fieldsの要素か、relation_fieldsの要素かの判断
            const aHasY = 'y' in a && a.y !== undefined;
            const bHasY = 'y' in b && b.y !== undefined;
            const aHasOrder = 'edit_component_y_order' in a;
            const bHasOrder = 'edit_component_y_order' in b;

            if (aHasY && bHasY) {
                return a.y - b.y;
            }

            if (aHasY && bHasOrder) {
                return a.y - b.edit_component_y_order;
            }

            if (aHasOrder && bHasY) {
                return a.edit_component_y_order - b.y;
            }

            if (aHasOrder && bHasOrder) {
                return a.edit_component_y_order - b.edit_component_y_order;
            }

            if (aHasY) {
                return 1;
            }
            if (aHasOrder) {
                return -1;
            }

            return 0;
        });
        return merged;

    }

    getRelationTableHashOfField(field) {
        if (!this.relation_table_a) return null;

        return this.relation_table_a.find(item => {
            let form = this.forms.byFieldName(field.Field);
            let parsedOption;
            if (form) {
                // 配信先用
                parsedOption = form.option;

                if (!parsedOption && form.custom_field['option']) {
                    parsedOption = JSON.parse(form.custom_field['option']);
                }
                if (parsedOption && parsedOption['item-table'] == '{table_name}') {
                    return true;
                }
            }

            const relationTableItems = this.fields.filter(f => f.type === 'relation_table');
            const fieldIdMatch = field && field.Field ? field.Field.match(/^field__(\d+)$/) : null;

            if (fieldIdMatch) {
                const fieldId = fieldIdMatch[1];
                const matchingRelationTable = relationTableItems.find(item => item.id === parseInt(fieldId));

                if (matchingRelationTable) {
                    // 詳細画面のデフォルト表示のとき、fieldsに関連テーブルが2つ入るので片方削除
                    // FIXME: そもそもrelation tableが一つになるようにしとくべき
                    return false;
                }
            }
            
            if (!field.option && form?.custom_field) {
                field.option = form.custom_field;
            }
            parsedOption = typeof field.option === 'string' ? JSON.parse(field.option) : field.option;

            if (!parsedOption) return;

            let matchingItems = this.relation_table_a.filter(item => item.table == parsedOption["item-table"]);

            // 複数の関連テーブルが同じテーブルに設定されている場合は、フィールド名もつけて判定
            if (matchingItems.length > 1) {
                return item.table == parsedOption['item-table'] && item.label == (field.Name || field.name);
            } else {
                return item.table == parsedOption["item-table"];
            }
        });
    }


    ngOnChanges() {
        let wide_grouped_fields = []
        let narrow_grouped_fields = []
        if (this.table) {
            this._share.getTableInfo(this.table).subscribe(_table_info => {
                this.table_type = _table_info.menu.table_type;
                this.table_info = _table_info;
                this.is_viewable_detail = this.table_info.grant.detail && this.data['raw_data']['id'] > 0;
                if (_table_info.relation_fields.length > 0) {
                    this.fields = this.sortWithRelationTable(_table_info.fields, _table_info.relation_fields);
                }

                this.fields.forEach((field,i) => {
                    narrow_grouped_fields.push([field])

                    if (wide_grouped_fields.length == 0 || field.y == undefined || !_table_info.menu.layout_apply_view || this.customFilter) {
                        if(this.customFilter && this.customFilter.show_fields.length > 0) field.y = i;
                        wide_grouped_fields.push([field])
                    } else {
                        this.groupService.groupByAxis(wide_grouped_fields, field)
                    }
                })

                if (wide_grouped_fields.length > 1) {
                    this.sortingService.selectionSort(wide_grouped_fields, 0, 'y')
                }

                this.wide_view_fields = wide_grouped_fields;
                this.narrow_view_fields = narrow_grouped_fields
                if (window.visualViewport.width < GlobalVariables.maxSmartPhoneWidth) {
                    this.fieldrows = this.narrow_view_fields
                } else {
                    this.fieldrows = this.wide_view_fields
                }

                this.fields.forEach(field => {
                    let style = {};
                    let field_name = field.Field
                    style = _table_info.forms.byFieldName(field_name) != undefined ? _table_info.forms.byFieldName(field_name).getDetailCellStyle() : {};

                    if (this.data.col_style_by_field && this.data.col_style_by_field[field_name]) {
                        style = Object.assign(style, this.data.col_style_by_field[field_name])
                    }

                    if (style['width'] !== undefined) {
                        style = Object.assign(style, {'overflow': 'hidden', 'white-space': 'normal'})
                    }

                    this.style_by_field[field_name] = style
                })
                console.log(JSON.stringify(this.style_by_field))

            })
        }

        if (this._share.useGoogleCalendar()) {
            this.fieldrows.forEach((row) => {
                if (row[0].Field == 'google_calendar') {
                    console.log(row[0])
                    row[0].show_view = true;
                }
            });
        }
    }

    download_file(url, field) {
        this.downloading[field] = true;
        this._share.download_file(url, () => {
            this.downloading[field] = false;
        });
    }

    is_string(data) {
        return data instanceof String;
    }

    displayOnDetail(field){
        let custom_field = this.forms.byFieldName(field.Field).custom_field;
        if (custom_field && custom_field['show-in-detail'] == false) {
            return false;
        }
        return true;
    }

    extendDataClicked(extend_data) {
        if (extend_data['link'] != undefined) {
            this._router.navigate(extend_data['link'].split('/'));
        }
    }

    getCellStyle(field_name: string): Object {
        return this.style_by_field[field_name] ?? {}


    }

    relationViewField(field) {
        if(!this.is_relation_view_mode) return true;

        if (this.relation_show_field && this.relation_show_field.length > 0) {
            return this.relation_show_field.some(showField => showField.Field === field.Field);
        }

        return false
    }

    view(event) {
        if (event && (event.ctrlKey || event.metaKey)) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`${this._share.getAdminTable()}/${this.table}/view/${this.data.raw_data['id']}`])
            );
            window.open(url, '_blank')
        } else {
            this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.data.raw_data['id']]);
            //fixed scroll top error when go from list page to detail page
            document.querySelector('.app-body').scrollTop = 0;
        }
    }

    goToEdit(event) {
        if (event && (event.ctrlKey || event.metaKey)) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`${this._share.getAdminTable()}/${this.table}/edit/${this.data.raw_data['id']}`])
            );
            window.open(url, '_blank')
            return;
        }
        let isEncoded = decodeURIComponent(this._router.url) !== this._router.url;
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', this.data.raw_data['id']], {
            queryParams: { 'return_url': isEncoded ? this._router.url : encodeURIComponent(this._router.url) }

        });
    }
}
