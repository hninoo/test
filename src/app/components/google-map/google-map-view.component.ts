import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { TableInfo } from '../../class/TableInfo';
import { SharedService } from '../../services/shared';
import { Connect } from '../../services/connect';
import { ToastrService } from 'ngx-toastr';
import { GoogleMapFilter } from '../../class/Filter/GoogleMapFilter';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Conditions } from '../../class/Conditions';
import { Condition } from '../../class/Condition';

@Component({
  selector: 'google-map-view',
  templateUrl: './google-map-view.component.html',
  styleUrls: ['./google-map-view.component.scss']
})
export class GoogleMapViewComponent implements OnInit {
  @Input() table_info: TableInfo;
  @Input() edittingCustomFilter: GoogleMapFilter;
  @Output() onClickCancelButton = new EventEmitter<void>();
  @Output() onClickSaveButton = new EventEmitter<GoogleMapFilter>();
  @Output() onClickPreviewButton = new EventEmitter<GoogleMapFilter>();

  // タブ関連のプロパティ
  public activeTab: string = 'basic'; // デフォルトで基本設定タブを選択
  
  // マーカー色のリスト
  public allColors = [
    { value: 'red', label: '赤' },
    { value: 'blue', label: '青' },
    { value: 'green', label: '緑' },
    { value: 'yellow', label: '黄' },
    { value: 'purple', label: '紫' },
    { value: 'pink', label: 'ピンク' },
    { value: 'orange', label: 'オレンジ' },
    { value: 'ltblue', label: 'ライトブルー' },
    { value: 'black', label: '黒' },
    { value: 'darkgreen', label: '濃い緑' },
  ];

  constructor(
    private _share: SharedService,
    private _connect: Connect,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    if (!this.edittingCustomFilter) {
      this.edittingCustomFilter = new GoogleMapFilter();
    }
    
    // 初期表示時のタブ設定
    setTimeout(() => {
      this.changeTab('basic');
    }, 0);
  }

  preview() {
    this.onClickPreviewButton.emit(this.edittingCustomFilter);
  }

  // 編集可能ユーザーのグループIDが変更された時のハンドラー
  onEditGrantGroupIdChanged(event: { id: number }) {
    if (this.edittingCustomFilter) {
      this.edittingCustomFilter.edit_grant_group_id = event.id;
    }
  }

  // 閲覧のみ可能ユーザーのグループIDが変更された時のハンドラー
  onViewGrantGroupIdChanged(event: { id: number }) {
    if (this.edittingCustomFilter) {
      this.edittingCustomFilter.view_grant_group_id = event.id;
    }
  }

  // タブ切り替えメソッド
  changeTab(tabId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.activeTab = tabId;
  }

  // ドラッグアンドドロップの処理
  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.edittingCustomFilter.info_modal_fields,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // 表示項目が変更された時の処理
  onInfoModalFieldsChanged(event: { selected_field_name_a: string[] }) {
    if (event.selected_field_name_a.length > 10) {
      this.toastr.error('表示項目は10個までしか選択できません。', 'エラー');
      return;
    }
    this.edittingCustomFilter.info_modal_fields = event.selected_field_name_a;
  }

  // マーカーの色設定を追加
  addMarkerColor() {
    this.edittingCustomFilter.addMarkerColorWithConditions();
  }

  // マーカーアイコンのプレビューURLを取得
  getMarkerIconPreviewUrl(colorSetting: any): string {
    if (!colorSetting) {
      return 'assets/img/google-map/red-dot.png';
    }
    
    const color = colorSetting.color || 'red';
    const iconType = colorSetting.iconType || 'dot';
    
    // サポートするアイコンタイプのみ対応（dot と pushpin のみ）
    if (iconType === 'pushpin') {
      return `assets/img/google-map/${color}-pushpin.png`;
    } else {
      // その他の場合はデフォルトの丸型を表示
      return `assets/img/google-map/${color}-dot.png`;
    }
  }

  // マーカーの色設定を削除
  removeMarkerColor(index: number) {
    this.edittingCustomFilter.removeMarkerColor(index);
  }

  // 条件を追加
  addCondition(colorSetting: any) {
    // colorSettingとconditionsが存在するか確認
    if (!colorSetting) {
      console.error('colorSetting is undefined or null');
      return;
    }
    
    if (!colorSetting.conditions) {
      // 条件オブジェクトが存在しない場合は新しく作成
      colorSetting.conditions = new Conditions();
    }
    
    try {
      // 新しい条件を追加（デフォルト値を設定）
      const newCondition = new Condition('eq', 'id', '');
      colorSetting.conditions.condition_a.push(newCondition);
    } catch (error) {
      console.error('Error adding condition:', error);
      // エラー発生時は条件オブジェクトを作り直して追加
      colorSetting.conditions = new Conditions();
      colorSetting.conditions.addCondition('eq', 'id', '');
    }
  }

  // 条件を削除
  removeCondition(colorSetting: any, conditionIndex: number) {
    if (!colorSetting || !colorSetting.conditions) {
      console.error('colorSetting or conditions is undefined');
      return;
    }
    
    try {
      colorSetting.conditions.deleteCondition(conditionIndex);
    } catch (error) {
      console.error('Error removing condition:', error);
    }
  }

  // 条件が変更された時の処理
  onConditionChanged(event: any, colorSettingIndex: number) {
    if (!event || !this.edittingCustomFilter || !this.edittingCustomFilter.marker_colors) {
      console.error('Event or marker_colors array is undefined');
      return;
    }
    
    // インデックスチェック
    if (colorSettingIndex < 0 || colorSettingIndex >= this.edittingCustomFilter.marker_colors.length) {
      console.error('Invalid colorSettingIndex:', colorSettingIndex);
      return;
    }
    
    const colorSetting = this.edittingCustomFilter.marker_colors[colorSettingIndex];
    if (colorSetting && colorSetting.conditions) {
      try {
        // イベントから条件のインデックスと更新された条件を取得
        const { index, condition } = event;
        
        // インデックスチェック
        if (index < 0 || !Array.isArray(colorSetting.conditions.condition_a) || 
            index >= colorSetting.conditions.condition_a.length) {
          console.error('Invalid condition index:', index);
          return;
        }
        
        // 対応する条件を更新
        colorSetting.conditions.condition_a[index] = condition;
        console.log('Updated conditions:', colorSetting.conditions.condition_a);
      } catch (error) {
        console.error('Error updating condition:', error);
      }
    } else {
      console.error('ColorSetting or conditions is undefined');
    }
  }

  // 保存処理
  save() {
    if (!this.edittingCustomFilter) {
      this.toastr.error('設定が見つかりません。', 'エラー');
      return;
    }

    if (!this.edittingCustomFilter.name) {
      this.toastr.error('フィルター名を入力してください。', 'エラー');
      return;
    }

    // 権限設定のバリデーション
    if (this.edittingCustomFilter.grant === 'custom') {
      if (!this.edittingCustomFilter.view_grant_group_id && !this.edittingCustomFilter.edit_grant_group_id) {
        this.toastr.error('詳細権限設定を選択した場合は、編集可能または閲覧のみ可能ユーザーを設定してください。', 'エラー');
        return;
      }
    }

    // 既存のフィルターを更新する場合はIDを含める
    const params = {
      table: this.table_info.table,
      params_json: JSON.stringify(this.edittingCustomFilter.toArray()),
      grant: this.edittingCustomFilter.grant,
      view_grant_group_id: this.edittingCustomFilter.view_grant_group_id,
      edit_grant_group_id: this.edittingCustomFilter.edit_grant_group_id,
      name: this.edittingCustomFilter.name
    };
    if (this.edittingCustomFilter.id) {
      params['id'] = this.edittingCustomFilter.id;
    }

    this._connect.post('/admin/save-google-map-filter', params).subscribe(
      (response) => {
        if (response['success']) {
          // レスポンスからフィルター情報を取得
          const savedFilter = response['filter'];
          if (savedFilter) {
            // フィルターIDを更新
            this.edittingCustomFilter.id = savedFilter.id;
            // パラメータを更新
            const params = JSON.parse(savedFilter.params_json);
            Object.assign(this.edittingCustomFilter, params);
          }
          
          this.toastr.success('マップフィルター設定を保存しました。', '成功');
          
          // 保存したフィルターを適用して表示を更新
          this.onClickPreviewButton.emit(this.edittingCustomFilter);
          this.onClickCancelButton.emit(); // モーダルを閉じる
        } else {
          this.toastr.error(response['message'] || '保存に失敗しました。', 'エラー');
        }
      },
      (error) => {
        this.toastr.error('保存中にエラーが発生しました。', 'エラー');
        console.error('Save error:', error);
      }
    );
  }

  // マーカーの種類変更時に色も調整
  onIconTypeChanged(colorSetting: any) {
    colorSetting.color = 'red';
  }
} 
