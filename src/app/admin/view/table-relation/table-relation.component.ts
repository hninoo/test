import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { SharedService } from '../../../services/shared';
import { Connect } from '../../../services/connect';
import { jsPlumb } from 'jsplumb';
import { TableInfo } from '../../../class/TableInfo';
import { ActivatedRoute } from '@angular/router';
import { Menu } from '../../../class/Menu';

@Component({
  selector: 'app-table-relation',
  templateUrl: './table-relation.component.html',
  styleUrls: ['./table-relation.component.scss']
})
export class TableRelationComponent implements OnInit, AfterViewInit {
  public tables: any[] = [];
  public relations: any[] = [];
  public loading: boolean = true;
  public jsPlumbInstance: any;
  public selectedTable: string = '';
  public visitedTables: Set<string> = new Set();
  public maxDepth: number = 3;
  private readonly GRID_SIZE: number = 350; // テーブル間の距離を250から350に増加
  public menuClasses: Menu[] = [];

  @ViewChild('diagramContainer') diagramContainer: ElementRef;

  constructor(
    private _connect: Connect,
    private _share: SharedService,
    private _route: ActivatedRoute,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    // メニュークラスを取得
    this._connect.get('/admin/menu/class').subscribe(
      (data) => {
        if (data['result'] === 'success') {
          this.menuClasses = data['menu_class'];

          // メニュークラスの取得後にルートパラメータを処理
          this._route.params.subscribe(params => {
            if (params['table']) {
              this.selectedTable = params['table'];
              this.loadTableRelations(this.selectedTable);
            } else {
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
          console.error('メニュークラスの取得に失敗しました');
        }
      },
      (error) => {
        this.loading = false;
        console.error('メニュークラスの取得エラー:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    this.initJsPlumb();
  }

  initJsPlumb(): void {
    this.jsPlumbInstance = jsPlumb.getInstance({
      // エンドポイントの基本設定
      Endpoint: ['Dot', { radius: 2 }],
      // コネクタの基本設定（線の形状）
      Connector: ['Flowchart', { cornerRadius: 5, stub: 20, gap: 5 }], // stubを追加して線の始点と終点の位置を調整
      // ホバー時のスタイル
      HoverPaintStyle: { stroke: '#1e8151', strokeWidth: 2 },
      // 接続線のオーバーレイ（矢印やラベル）
      ConnectionOverlays: [
        ['Arrow', {
          location: 1,
          width: 10,
          length: 10,
          id: 'arrow',
          foldback: 0.8 // 矢印の形状を調整
        }],
        ['Label', {
          label: '',
          cssClass: 'connection-label',
          location: 0.5 // 中央に配置
        }]
      ],
      // アンカーの基本設定
      Anchors: [
        ['Right', 'Center'], // 右側中央から出る
        ['Left', 'Center']   // 左側中央に入る
      ],
      // ドラッグ可能にする
        DragOptions: {
        cursor: 'move',
        zIndex: 2000
      },
      // 接続線の基本スタイル
      PaintStyle: {
        strokeWidth: 2,
        stroke: '#007bff'
      },
      // 接続線の編集を無効化（追加・削除を防止）
      ConnectionsDetachable: false,
      // 新しい接続の作成を無効化
    });
  }

  loadTableRelations(table: string): void {
    this.loading = true;
    this.tables = [];
    this.relations = [];
    this.visitedTables.clear();

    this._connect.get(`/admin/dataset/table-relations/${table}/${this.maxDepth}`).subscribe(
      (data) => {
        if (data['result'] === 'success') {
          this.tables = data['tables'];
          this.relations = data['relations'];

          setTimeout(() => {
            this.renderDiagram();
            this.loading = false;
          }, 100);
        } else {
          console.error('Error loading table relations:', data['error_a']);
          this.loading = false;
        }
      },
      (error) => {
        console.error('Error loading table relations:', error);
        this.loading = false;
      }
    );
  }

  renderDiagram(): void {
    if (!this.diagramContainer) return;

    this.jsPlumbInstance.reset();

    setTimeout(() => {
      // テーブルを自動配置する
      this.autoLayoutTables();

      // テーブルをドラッグ可能にする
      this.tables.forEach(table => {
        const tableElement = document.getElementById(table.id);
        if (tableElement) {
          this.jsPlumbInstance.draggable(tableElement, {
            containment: 'parent',
            // ドラッグ中に接続を更新
            drag: () => {
              this.jsPlumbInstance.repaintEverything();
            }
          });
        }
      });

      // テーブルにエンドポイントを追加
      this.tables.forEach(table => {
        // テーブル自体にエンドポイントを追加（左側と右側）


        // テーブル自体から線を出すようになったため、フィールドのエンドポイントは不要
        // // リレーションに関連するフィールドのみにエンドポイントを追加
        // const relatedFields = this.getRelatedFields(table);
        // relatedFields.forEach(field => {
        //   const fieldId = `${table.id}_${field.name}`;
        //   const fieldElement = document.getElementById(fieldId);
          //
        //   if (fieldElement) {
        //     // フィールドの右側にエンドポイントを追加
        //     this.jsPlumbInstance.addEndpoint(fieldId, {
        //       anchor: 'RightMiddle', // 'Right'から'RightMiddle'に変更
        //       isSource: true,
        //       isTarget: false,
        //       maxConnections: -1,
        //       endpoint: ['Dot', { radius: 1 }], // radiusを3から1に縮小
          //       paintStyle: {
          //         fill: '#007bff',
          //         stroke: '#007bff'
        //       }
        //     });
        //   }
        // });
      });

      // 接続を描画する前に少し待機して、DOM要素が正しく配置されるようにする
      setTimeout(() => {
        // テーブルごとの接続数をカウントするためのマップ
        const connectionCountMap = new Map<string, number>();

          // 関連フィールドを特定するためのより詳細なロジック
        const findRelatedField = (sourceTable: any, targetTable: any, relationType: string) => {
          if (!sourceTable || !sourceTable.fields || !targetTable) return null;

            // 特定のテーブルへの参照を持つフィールドを探す
          const targetTableId = targetTable.id;
          const targetTableName = targetTable.name ? targetTable.name.toLowerCase() : '';

            // 1. まず、特定のテーブルへの参照を持つフィールドを探す（タイプとテーブル名の両方が一致）
            let field = sourceTable.fields.find(f =>
                f.type === 'select_other_table' &&
                f.target_table &&
            f.target_table === targetTableId
          );

            // 2. 次に、タイプが一致し、名前にターゲットテーブル名が含まれるフィールドを探す
          if (!field && targetTableName) {
              field = sourceTable.fields.find(f =>
                  f.type === 'select_other_table' &&
                  (f.name.toLowerCase().includes(targetTableName) ||
               (f.label && f.label.toLowerCase().includes(targetTableName)))
            );
          }

            // 3. 次に、タイプのみが一致するフィールドを探す
          if (!field) {
            field = sourceTable.fields.find(f => f.type === 'select_other_table');
          }

            // 4. 最後に、最初のフィールドを使用
          if (!field && sourceTable.fields.length > 0) {
            field = sourceTable.fields[0];
          }

            return field;
        };

          // admin_idとupdated_admin_idのリレーションを除外
        const filteredRelations = this.relations.filter(relation => {
          // ソーステーブルを取得
          const sourceTable = this.tables.find(t => t.id === relation.source);
          if (!sourceTable) return false;

            // 関連フィールドを見つける
            const adminRelatedField = sourceTable.fields.find(field =>
                field.type === 'select_other_table' &&
                (field.name === 'admin_id' ||
                    field.name === 'updated_admin_id' ||
                    field.name === '作成者' ||
             field.name === '最終更新者')
          );

            // admin関連のフィールドが見つかった場合、そのフィールドに関連するリレーションを除外
          if (adminRelatedField && relation.target === 'admin') {
            return false;
          }

            return true;
        });

          // 関係をソートして、同じソーステーブルのものをグループ化
        const sortedRelations = [...filteredRelations].sort((a, b) => {
          if (a.source === b.source) {
            return a.target.localeCompare(b.target);
          }
          return a.source.localeCompare(b.source);
        });

          sortedRelations.forEach(relation => {
          const connectionStyle = {
            stroke: relation.type === 'select_other_table' ? '#007bff' : '#28a745',
            strokeWidth: 2
          };

              const sourceTable = this.tables.find(t => t.id === relation.source);
          const targetTable = this.tables.find(t => t.id === relation.target);

              if (!sourceTable || !targetTable) return;

              // 改善されたロジックで関連フィールドを見つける
          const sourceField = findRelatedField(sourceTable, targetTable, relation.type);

              // テーブルごとの接続数をカウント
          if (!connectionCountMap.has(relation.source)) {
            connectionCountMap.set(relation.source, 0);
          }
          const connectionCount = connectionCountMap.get(relation.source);
          connectionCountMap.set(relation.source, connectionCount + 1);

              // 接続元と接続先の要素を取得
          const sourceElement = document.getElementById(relation.source);
          const targetElement = document.getElementById(relation.target);

              if (sourceElement && targetElement) {
            // フィールド名またはラベルを使用
            const fieldLabel = sourceField ? `"${sourceField.label || sourceField.name}"` : relation.type;

                  // 接続数に基づいてアンカーポイントをずらす
            // 最初の接続はRightMiddle、2つ目以降は少しずつずらす
            const sourceAnchor = [0.9, 0.3 + (connectionCount * 0.1)]; // 右側の異なる高さ

                  this.jsPlumbInstance.connect({
              source: relation.source,
              target: relation.target,
              paintStyle: connectionStyle,
              // 接続数に基づいてstubの値を調整
                      connector: ['Flowchart', {
                          cornerRadius: 5,
                stub: [10 + (connectionCount * 5), 10] // 接続数に応じてstubを増やす
              }],
              anchors: [sourceAnchor, 'LeftMiddle'], // ソースアンカーを調整、ターゲットは固定
              overlays: [
                  ['Label', {
                  label: fieldLabel, // フィールド名またはラベルを表示（引用符で囲む）
                  cssClass: 'connection-label',
                  location: 0.5
                }],
                  ['Arrow', {
                      location: 1,
                  width: 12,
                  length: 12,
                      foldback: 0.8
                }]
              ]
            });
          }
        });

          // すべての接続を再描画して位置を確実に合わせる
        this.jsPlumbInstance.repaintEverything();
      }, 800); // 待機時間を800msに設定
    }, 500); // 初期化の待機時間も300msから500msに増加
  }

  selectTable(table: string): void {
    this.selectedTable = table;
    this.loadTableRelations(table);
  }

  increaseDepth(): void {
    this.maxDepth++;
    if (this.selectedTable) {
      this.loadTableRelations(this.selectedTable);
    }
  }

  decreaseDepth(): void {
    if (this.maxDepth > 1) {
      this.maxDepth--;
      if (this.selectedTable) {
        this.loadTableRelations(this.selectedTable);
      }
    }
  }

    refreshDiagram(): void {
    if (this.selectedTable) {
      this.loadTableRelations(this.selectedTable);
    } else {
      this.jsPlumbInstance.reset();

        // 少し待機してからレンダリングを行う
      setTimeout(() => {
        this.renderDiagram();

          // レンダリング後にすべての接続を再描画
        setTimeout(() => {
          this.jsPlumbInstance.repaintEverything();
        }, 600);
      }, 300); // 待機時間を増やして、DOM要素が確実に配置されるようにする
    }
  }

  /**
   * テーブルを自動的に配置する
   * 階層構造を考慮して、重ならないように配置
   */
  private autoLayoutTables(): void {
    if (!this.tables.length) return;

    const rootTable = this.selectedTable;
    const tablePositions = new Map<string, {x: number, y: number}>();
    const processedTables = new Set<string>();
    const tablesByLevel = new Map<number, string[]>();

      // ルートテーブルを中央に配置
    tablePositions.set(rootTable, {x: 100, y: 100}); // 初期位置を50から100に増加
    processedTables.add(rootTable);
    tablesByLevel.set(0, [rootTable]);

      // 関係性に基づいてレベルを割り当て
    this.assignLevels(rootTable, 1, processedTables, tablesByLevel);

      // レベルごとにテーブルを配置
    let maxLevel = 0;
    tablesByLevel.forEach((_, level) => {
      if (level > maxLevel) maxLevel = level;
    });

      for (let level = 0; level <= maxLevel; level++) {
      const tablesInLevel = tablesByLevel.get(level) || [];
      const levelWidth = tablesInLevel.length * this.GRID_SIZE;
      // 画面幅に基づいて開始位置を計算
      const startX = Math.max(100, (this.diagramContainer.nativeElement.offsetWidth - levelWidth) / 2);

          tablesInLevel.forEach((tableId, index) => {
        const x = startX + index * this.GRID_SIZE;
        const y = 100 + level * this.GRID_SIZE * 0.8; // Y方向の間隔を調整（0.8倍に）
        tablePositions.set(tableId, {x, y});
      });
    }

      // テーブル要素に位置を適用
    this.tables.forEach(table => {
      const position = tablePositions.get(table.id);
      if (position) {
        const element = document.getElementById(table.id);
        if (element) {
          element.style.position = 'absolute';
          element.style.left = `${position.x}px`;
          element.style.top = `${position.y}px`;
        }
      }
    });
  }

    /**
   * テーブルにレベルを割り当てる（再帰的）
   */
  private assignLevels(tableId: string, level: number, processedTables: Set<string>, tablesByLevel: Map<number, string[]>): void {
    // このテーブルから関連するテーブルを見つける
    const relatedTables = this.relations
      .filter(rel => rel.source === tableId && !processedTables.has(rel.target))
      .map(rel => rel.target);

        // 関連するテーブルがなければ終了
    if (relatedTables.length === 0) return;

        // このレベルのテーブル配列を取得または作成
    if (!tablesByLevel.has(level)) {
      tablesByLevel.set(level, []);
    }

        // 関連するテーブルをこのレベルに追加
    relatedTables.forEach(targetTable => {
      tablesByLevel.get(level)?.push(targetTable);
      processedTables.add(targetTable);
    });

        // 再帰的に次のレベルを処理
    relatedTables.forEach(targetTable => {
      this.assignLevels(targetTable, level + 1, processedTables, tablesByLevel);
    });
  }

    /**
   * テーブル名を取得する
   * Menu Classのnameを優先的に使用
   */
  getTableName(table: any): string {
    if (!table) return '';

        // dataset__XXの形式のテーブルIDの場合
    if (table.id && table.id.startsWith('dataset__') && this.menuClasses && this.menuClasses.length > 0) {
      // メニュークラスから該当するテーブル名を探す
      const menuClass = this.menuClasses.find(menu => menu.table === table.id);
      if (menuClass) {
        return menuClass.name;
      }
    }

        // メニュークラスに該当がない場合はラベルかテーブル名を返す
    return table.label || table.name || table.id || '';
  }

  /**
   * テーブルのリレーションに関連するフィールドのみを取得する
   */
  getRelatedFields(table: any): any[] {
    if (!table || !table.fields || !this.relations) return [];

      // このテーブルに関連するリレーション
      const tableRelations = this.relations.filter(rel =>
      rel.source === table.id || rel.target === table.id
    );

      // リレーションに関連するフィールドを抽出
    return table.fields.filter(field => {

        if (field.name == 'ID') {
            return true;
        }
        if (!field.field.match(/field__/)) {
            return false;
        }

      // select_other_tableまたはrelation_tableタイプのフィールド
      if (field.type === 'select_other_table' || field.type === 'relation_table') {
        return true;
      }


        return false;
    });
  }
}
