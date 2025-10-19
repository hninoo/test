import {ChatButton} from './ChatButton';

/**
 * チャットメッセージクラス
 * Chat message class
 */
export class ChatMessage {
    /** メッセージの種類（'user' または 'bot'） / Message type ('user' or 'bot') */
    type: string;

    /** メッセージの内容 / Message content */
    content: string;

    /** ボタンリスト / Button list */
    buttons: ChatButton[] = [];

    /** チェックボックスリスト / Checkbox list */
    checkboxes: string[] = [];

    /** プルダウンリスト / Pulldown list */
    pulldown: string[] = [];

    /** セッションID / Session ID */
    session_id?: string;

    /** メッセージに関連するデータ / Data related to the message */
    data?: any;

    /** ファイル検索時の参照元ファイル情報 / Source files for file search results */
    source_files?: any[];

    /**
     * コンストラクタ
     * Constructor
     * @param data 初期化データ / Initialization data
     */
    constructor(data?: Partial<ChatMessage>) {
        if (data) {
            Object.assign(this, data);

            // ボタンが文字列の配列の場合、ChatButtonオブジェクトに変換
            // If buttons are array of strings, convert them to ChatButton objects
            if (data.buttons && Array.isArray(data.buttons)) {
                this.buttons = data.buttons.map(btn => {
                    if (typeof btn === 'string') {
                        return new ChatButton({text: btn});
                    } else if (typeof btn === 'object') {
                        return new ChatButton(btn);
                    }
                    return btn;
                });
            }
        }
    }

    /**
     * ユーザーメッセージを作成
     * Create a user message
     * @param content メッセージ内容 / Message content
     * @returns ChatMessage インスタンス / ChatMessage instance
     */
    static createUserMessage(content: string): ChatMessage {
        return new ChatMessage({
            type: 'user',
            content: content
        });
    }

    /**
     * ボットメッセージを作成
     * Create a bot message
     * @param content メッセージ内容 / Message content
     * @param data 追加データ / Additional data
     * @returns ChatMessage インスタンス / ChatMessage instance
     */
    static createBotMessage(content: string, data?: any): ChatMessage {
        return new ChatMessage({
            type: 'bot',
            content: content,
            data: data
        });
    }
}
