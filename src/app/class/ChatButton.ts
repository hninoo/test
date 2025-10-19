/**
 * チャットボタンクラス
 * Chat button class
 */
export class ChatButton {
    /** ボタンのテキスト / Button text */
    text: string;

    /** ボタンのタイプ / Button type */
    type: string;

    /** 追加データ / Additional data */
    data?: any;

    /**
     * コンストラクタ
     * Constructor
     * @param data 初期化データ / Initialization data
     */
    constructor(data?: Partial<ChatButton>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    /**
     * フィルター適用ボタンを作成
     * Create a filter button
     * @param text ボタンテキスト / Button text
     * @returns ChatButton インスタンス / ChatButton instance
     */
    static createFilterButton(text: string): ChatButton {
        return new ChatButton({
            text: text,
            type: 'filter'
        });
    }

    /**
     * データ表示ボタンを作成
     * Create a display data button
     * @param text ボタンテキスト / Button text
     * @returns ChatButton インスタンス / ChatButton instance
     */
    static createDisplayDataButton(text: string): ChatButton {
        return new ChatButton({
            text: text,
            type: 'display_data'
        });
    }

    /**
     * 通常のボタンを作成
     * Create a normal button
     * @param text ボタンテキスト / Button text
     * @returns ChatButton インスタンス / ChatButton instance
     */
    static createNormalButton(text: string): ChatButton {
        return new ChatButton({
            text: text,
            type: 'normal'
        });
    }
}
