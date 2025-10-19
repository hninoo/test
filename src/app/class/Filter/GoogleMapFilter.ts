import {SummarizeFilter} from './SummarizeFilter/SummarizeFilter';
import {Base} from '../Base';
import {Conditions} from '../Conditions';
import {Connect} from '../../services/connect';
import {TableInfo} from '../TableInfo';
import {SortParam} from './SortParam';
import {Variable} from './Variable';
import {Condition} from '../Condition';
import {SharedService} from '../../services/shared';
import {Observable} from 'rxjs/Observable';
import {ColorFilter} from '../ColorFilter';

import * as cloneDeep from 'lodash/cloneDeep';
import {Data} from '../Data';
import {Form} from '../Form';
import {DashboardContent} from '../DashboardContent';

// Google マップで利用可能なマーカーの色
export const AVAILABLE_MARKER_COLORS = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'pink',
    'orange',
    'ltblue', // ライトブルー
];

export class GoogleMapFilter extends Base {

    public name: string = '';
    public info_modal_fields: Array<string> = [];
    public marker_colors: Array<{
        field: string;
        value: string;
        color: string;
        iconType?: string;
        conditions?: Conditions;
    }> = [];
    
    // 権限設定
    private _grant: string = 'public';
    private _view_grant_group_id: number = null;
    private _edit_grant_group_id: number = null; 
    private _admin_id: number = null;
    private _visible: boolean = true;
    private _editable: boolean = true;
    
    // 住所フィールド
    public address_field: string = '';

    constructor(hash = null) {
        super(hash);
        if (hash) {
            this.id = hash.id;
            this.name = hash.name || '';
            this.info_modal_fields = hash.info_modal_fields || [];
            this.marker_colors = (hash.marker_colors || []).map(color => ({
                ...color,
                iconType: color.iconType || 'dot', // デフォルトは丸型
                conditions: color.conditions ? new Conditions(
                    (color.conditions.condition_a || []).map(cond => ({
                        condition: cond.condition,
                        field: cond.field,
                        value: cond.value,
                        and_or: cond.and_or,
                        use_variable: cond.use_variable,
                        inc_table: cond.inc_table,
                        inc_field: cond.inc_field,
                        inc_filter_id: cond.inc_filter_id,
                        list_date_time_search_with_no_time: cond.list_date_time_search_with_no_time,
                        use_dynamic_condition_value: cond.use_dynamic_condition_value,
                        date_relative_value: cond.date_relative_value
                    }))
                ) : new Conditions()
            }));
            
            // 権限設定の読み込み
            if ('grant' in hash) {
                this._grant = hash.grant;
            }
            if ('view_grant_group_id' in hash) {
                this._view_grant_group_id = hash.view_grant_group_id;
            }
            if ('edit_grant_group_id' in hash) {
                this._edit_grant_group_id = hash.edit_grant_group_id;
            }
            if ('admin_id' in hash) {
                this._admin_id = hash.admin_id;
            }
            if ('visible' in hash) {
                this._visible = hash.visible;
            }
            if ('editable' in hash) {
                this._editable = hash.editable;
            }
            if ('address_field' in hash) {
                this.address_field = hash.address_field;
            }
        } else {
            this.id = null;
            this.name = '';
            this.info_modal_fields = [];
            this.marker_colors = [];
            this.address_field = '';
        }
    }
    
    // admin_idのゲッター・セッター
    get admin_id(): number {
        return this._admin_id;
    }

    set admin_id(value: number) {
        this._admin_id = value;
    }

    // 権限関連のゲッター・セッター
    get grant(): string {
        return this._grant;
    }
    
    set grant(value: string) {
        this._grant = value;
    }
    
    get view_grant_group_id(): number {
        return this._view_grant_group_id;
    }
    
    set view_grant_group_id(value: number) {
        this._view_grant_group_id = value;
    }
    
    get edit_grant_group_id(): number {
        return this._edit_grant_group_id;
    }
    
    set edit_grant_group_id(value: number) {
        this._edit_grant_group_id = value;
    }
    
    get visible(): boolean {
        return this._visible;
    }
    
    set visible(value: boolean) {
        this._visible = value;
    }
    
    get editable(): boolean {
        return this._editable;
    }
    
    set editable(value: boolean) {
        this._editable = value;
    }

    // マーカーの色設定を追加（条件付き）
    addMarkerColorWithConditions() {
        const newColorSetting = {
            field: '',
            value: '',
            color: 'red',
            iconType: 'dot', // デフォルトは丸型
            conditions: new Conditions()
        };
        
        // 新しい条件を追加（デフォルト値を設定）
        if (newColorSetting.conditions) {
            // 条件が存在するか確認してから条件を追加
            newColorSetting.conditions.addCondition('eq', 'id', '');
        }
        
        this.marker_colors.push(newColorSetting);
    }

    // マーカーの色設定を削除
    removeMarkerColor(index: number) {
        this.marker_colors.splice(index, 1);
    }

    // 保存用のデータ変換メソッド
    toArray(): Object {
        return {
            name: this.name,
            info_modal_fields: this.info_modal_fields,
            marker_colors: this.marker_colors.map(color => ({
                field: color.field,
                value: color.value,
                color: color.color,
                iconType: color.iconType || 'dot', // iconTypeも保存
                conditions: color.conditions ? {
                    condition_a: color.conditions.condition_a.map(cond => ({
                        condition: cond.condition,
                        field: cond.field,
                        value: cond.value,
                        and_or: cond.and_or,
                        use_variable: cond.use_variable,
                        inc_table: cond.inc_table,
                        inc_field: cond.inc_field,
                        inc_filter_id: cond.inc_filter_id,
                        list_date_time_search_with_no_time: cond.list_date_time_search_with_no_time,
                        use_dynamic_condition_value: cond.use_dynamic_condition_value,
                        date_relative_value: cond.date_relative_value
                    }))
                } : null
            })),
            // 権限とアドレスフィールド情報も保存
            grant: this._grant,
            view_grant_group_id: this._view_grant_group_id,
            edit_grant_group_id: this._edit_grant_group_id,
            address_field: this.address_field
        };
    }

    // 条件に基づいてマーカーの色とアイコンタイプを取得
    getMarkerSettingsByConditions(data: Data): { color: string, iconType: string } {
        let markerColor = 'red'; // デフォルトの色
        let markerIconType = 'dot'; // デフォルトのアイコンタイプ

        // __map_color_filter_X フィールドを確認
        for (let i = 0; i < this.marker_colors.length; i++) {
            const filterKey = `__map_color_filter_${i}`;
            if (data.raw_data[filterKey] === "true") {
                markerColor = this.marker_colors[i].color;
                markerIconType = this.marker_colors[i].iconType || 'dot';
            }
        }
        
        return { color: markerColor, iconType: markerIconType };
    }

    // 条件に基づいてマーカーの色を取得（互換性のために残す）
    getMarkerColorByConditions(data: Data): string {
        return this.getMarkerSettingsByConditions(data).color;
    }

    // 利用可能なマーカー色の配列を取得
    static getAvailableColors(): string[] {
        return AVAILABLE_MARKER_COLORS;
    }
}

