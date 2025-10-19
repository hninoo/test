/**
 * フィールド定義クラス
 * データセット編集で使用されるフィールドの情報を管理する
 */
export class Field {
    public Field: string;           // フィールドの一意識別子
    public Comment: string;         // フィールドのコメント/名前
    public editable: boolean;       // 編集可能かどうか
    public fixed_value: any;        // 固定値
    public x: string | number;      // X座標（横位置）
    public y: string | number;      // Y座標（縦位置）
    public only_add: boolean;       // 追加時のみ表示するかどうか
    public Default: any;            // デフォルト値
    public froala_option?: any;     // Froala エディタのオプション（richtext フィールド用）

    /**
     * コンストラクタ
     * @param data フィールドデータのオブジェクト
     */
    constructor(data: {
        Field: string;
        Comment: string;
        editable?: boolean;
        fixed_value?: any;
        x?: string | number;
        y?: string | number;
        only_add?: boolean;
        Default?: any;
        froala_option?: any;
    }) {
        this.Field = data.Field;
        this.Comment = data.Comment;
        this.editable = data.editable !== undefined ? data.editable : true;
        this.fixed_value = data.fixed_value;
        this.x = data.x !== undefined ? data.x : '1';
        this.y = data.y !== undefined ? data.y : '1';
        this.only_add = data.only_add !== undefined ? data.only_add : false;
        this.Default = data.Default;
        this.froala_option = data.froala_option;
    }

    /**
     * フィールドIDを取得（field__ プレフィックスを除去）
     * @returns フィールドID
     */
    getFieldId(): string {
        return this.Field.startsWith('field__') ? this.Field.slice(7) : this.Field;
    }

    /**
     * X座標を数値として取得
     * @returns X座標の数値
     */
    getXAsNumber(): number {
        return typeof this.x === 'string' ? parseInt(this.x, 10) : this.x;
    }

    /**
     * Y座標を数値として取得
     * @returns Y座標の数値
     */
    getYAsNumber(): number {
        return typeof this.y === 'string' ? parseInt(this.y, 10) : this.y;
    }

    /**
     * X座標を設定
     * @param x X座標の値
     */
    setX(x: string | number): void {
        this.x = x;
    }

    /**
     * Y座標を設定
     * @param y Y座標の値
     */
    setY(y: string | number): void {
        this.y = y;
    }

    /**
     * Froala オプションを設定
     * @param options Froala エディタのオプション
     */
    setFroalaOption(options: any): void {
        this.froala_option = options;
    }

    /**
     * フィールドデータをプレーンオブジェクトとして取得
     * @returns プレーンオブジェクト
     */
    toPlainObject(): any {
        return {
            Field: this.Field,
            Comment: this.Comment,
            editable: this.editable,
            fixed_value: this.fixed_value,
            x: this.x,
            y: this.y,
            only_add: this.only_add,
            Default: this.Default,
            froala_option: this.froala_option
        };
    }

    /**
     * プレーンオブジェクトからFieldインスタンスを作成
     * @param obj プレーンオブジェクト
     * @returns Fieldインスタンス
     */
    static fromPlainObject(obj: any): Field {
        return new Field({
            Field: obj.Field,
            Comment: obj.Comment,
            editable: obj.editable,
            fixed_value: obj.fixed_value,
            x: obj.x,
            y: obj.y,
            only_add: obj.only_add,
            Default: obj.Default,
            froala_option: obj.froala_option
        });
    }
}
