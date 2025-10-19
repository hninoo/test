import {Component, Input, Output, OnInit, ViewChild, ElementRef, AfterViewChecked, EventEmitter} from '@angular/core';
import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {ChatMessage} from '../../class/ChatMessage';
import {ChatButton} from '../../class/ChatButton';
import {Data} from '../../class/Data';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'chat-bot',
    templateUrl: './chat-bot.component.html',
    styleUrls: ['./chat-bot.component.scss']
})
export class ChatBotComponent implements OnInit, AfterViewChecked {
    @Input() table_info?: TableInfo; // テーブル情報（オプショナル）
    @Input() customFilter: CustomFilter;
    @Input() table: string;
    @Input() resetOnInit: boolean = false;
    @Input() type: string = 'data_list'; // チャットのタイプ（dataset_edit または data_list）
    @Input() data?: Data = null;
    @ViewChild('chatBody') private chatBodyRef: ElementRef;
    @Output() onSetFilter = new EventEmitter<any>();
    @Output() fieldEditComplete: EventEmitter<any> = new EventEmitter();

    public isChatOpen: boolean = false;
    public messages: ChatMessage[] = [];
    public inputMessage: string = '';
    public isLoading: boolean = false;
    private shouldScrollToBottom: boolean = false;
    public lastResponse: any = null; // 最後のレスポンスを保存するプロパティ
    private sessionId: string = null; // 会話セッションIDを保存するプロパティ
    public isOpenFromUrl: boolean = false; // URLパラメータから開いたかどうか

    constructor(
        private _connect: Connect,
        private _shared: SharedService,
        private router: Router,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit(): void {
        if (this.resetOnInit) {
            this.resetChatHistory();
        } else {
            // チャット履歴の読み込み
            const savedMessages = localStorage.getItem(`chat_history_${this.table}`);
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
            } else if (this.type === 'dataset_edit') {
                // dataset_editタイプで履歴がない場合は初期メッセージを表示
                this.messages = [
                    ChatMessage.createBotMessage('「住所と電話番号を追加して」のように指示してください。<br>既存項目の変更も可能です。')
                ];
            } else if (this.type === 'file_search') {
                // file_searchタイプで履歴がない場合は初期メッセージを表示
                if (this.data && this.data.raw_data && this.data.raw_data['id']) {
                    // view component内での使用（特定データのファイル検索）
                    this.messages = [
                        ChatMessage.createBotMessage('このデータに関連するファイル検索チャットボットです。<br>例：<br>• 「関連する契約書を見せて」<br>• 「この案件の見積書はある？」<br>• 「添付されている仕様書を確認したい」')
                    ];
                } else if (this.table === 'dashboard') {
                    // ダッシュボードでの使用（全テーブル検索）
                    this.messages = [
                        ChatMessage.createBotMessage('ファイル検索チャットボットです。<br>例：<br>• 「経費精算のルールを確認したい」<br>• 「セキュリティポリシーの内容は？」<br>• 「請求書の作成方法を教えて」<br><br>すべてのテーブルを対象に検索します。')
                    ];
                } else {
                    // 特定テーブルでの使用
                    this.messages = [
                        ChatMessage.createBotMessage('ファイル検索チャットボットです。<br>例：<br>• 「契約書のテンプレートを探して」<br>• 「マニュアルの最新版はどれ？」<br>• 「過去の申請書類を見たい」<br><br>現在のテーブル内のファイルを検索します。')
                    ];
                }
            }

            // セッションIDの読み込み（会話の連続性を保つため）
            const savedSessionId = localStorage.getItem(`chat_session_${this.table}`);
            if (savedSessionId) {
                this.sessionId = savedSessionId;
                console.log('Loaded saved session ID:', this.sessionId);
            }
        }

        // URLパラメータをチェックしてチャットボットを開く
        this.route.queryParams.subscribe(params => {
            if (params['chatOpen'] === 'true') {
                // URLから開いたことを記録
                this.isOpenFromUrl = true;
                this.isChatOpen = true;

                // 開いた後、すぐにスクロール
                setTimeout(() => {
                    this.shouldScrollToBottom = true;
                    this.scrollToBottom();
                }, 50);
            }
        });
    }

    /**
     * チャット履歴をリセット
     * Reset chat history
     */
    resetChatHistory(): void {
        this.messages = [];

        localStorage.removeItem(`chat_history_${this.table}`);

        this.sessionId = '';
        localStorage.removeItem(`chat_session_${this.table}`);
    }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }

        // ファイルリンクのクリックイベントを設定
        this.setupFileLinkHandlers();
    }

    scrollToBottom(): void {
        try {
            this.chatBodyRef.nativeElement.scrollTop = this.chatBodyRef.nativeElement.scrollHeight;
        } catch (err) {
            console.error('Error scrolling to bottom:', err);
        }
    }

    toggleChat(): void {
        this.isChatOpen = !this.isChatOpen;

        // 閉じる時はURLから開いたフラグをリセット
        if (!this.isChatOpen) {
            this.isOpenFromUrl = false;
        }

        if (this.isChatOpen) {
            setTimeout(() => {
                this.shouldScrollToBottom = true;
            }, 100);
        }
    }


    sendMessage() {
        if (this.type === 'dataset_edit') {
            this.sendTableEditMessage();
        } else if (this.type === 'file_search') {
            this.sendFileSearchMessage();
        } else {
            this.sendDataListMessage();
        }
    }
    /**
     * メッセージを送信し、AIからのレスポンスを取得する
     * Send a message and get response from AI
     */
    sendDataListMessage(): void {
        if (!this.inputMessage.trim()) return;

        this.messages.push(ChatMessage.createUserMessage(this.inputMessage));
        this.shouldScrollToBottom = true;

        const filterInfo = this.customFilter ? JSON.stringify(this.customFilter) : '';

        // リクエストデータを作成（セッションIDがある場合は追加）
        const requestData = {
            message: this.inputMessage,
            filter_info: filterInfo,
            table: this.table
        };

        // セッションIDがある場合は追加
        if (this.sessionId) {
            requestData['session_id'] = this.sessionId;
            console.log('Using session ID:', this.sessionId);
        }

        this.inputMessage = '';
        this.isLoading = true;
        this.shouldScrollToBottom = true;

        this._connect.post(`/admin/${this.table}/chat-by-ai`, requestData).subscribe(
            (response) => {
                this.isLoading = false;

                // レスポンスの構造に対応（HTMLメッセージはfront_dataから優先的に取得）
                const botResponse = {
                    message_html: response.data?.front_data?.message_html || response.response?.message_html || response.message || '少々お待ちください。。',
                    buttons: response.data?.front_data?.buttons || [],
                    checkboxes: response.data?.front_data?.checkboxes || [],
                    pulldown: response.data?.front_data?.pulldown || []
                };

                this.lastResponse = response; // 元のレスポンス全体を保存

                // セッションIDを取得する（優先順位：debug_response > response > 既存のセッションID）
                if (response.debug_response && response.debug_response.session_id) {
                    // デバッグレスポンスからセッションIDを取得して保存
                    this.sessionId = response.debug_response.session_id;
                    console.log('Saving session ID from debug response:', this.sessionId);
                } else if (response.session_id) {
                    // 通常のレスポンスからセッションIDを取得して保存
                    this.sessionId = response.session_id;
                    console.log('Saving session ID from response:', this.sessionId);
                }

                // セッションIDをローカルストレージにも保存（会話の継続性を保つため）
                if (this.sessionId) {
                    localStorage.setItem(`chat_session_${this.table}`, this.sessionId);
                }

                // レスポンスデータの保存とメッセージオブジェクトの作成
                const botMessage = new ChatMessage({
                    type: 'bot',
                    content: botResponse.message_html || '少々お待ちください。。',
                    buttons: botResponse.buttons || [],
                    checkboxes: botResponse.checkboxes || [],
                    pulldown: botResponse.pulldown || [],
                    session_id: this.sessionId,
                    data: response.data
                });

                this.messages.push(botMessage);
                this.shouldScrollToBottom = true;

                // 検索条件が作成された場合、自動的に適用（table_editの場合は適用しない）
                // Auto-apply search conditions when created (except for table_edit)
                if (this.type !== 'dataset_edit' && response.data && response.data.filter) {
                    const filterData = response.data.filter;
                    const targetTable = response.data.table_name;
                    const currentTable = this.table;
                    const needPageTransition = response.data.need_page_transition || targetTable !== currentTable;

                    console.log('検索条件を自動適用:', {
                        filterData: filterData,
                        targetTable: targetTable,
                        needPageTransition: needPageTransition
                    });

                    // 検索条件を自動適用
                    this.applyFilterCondition(filterData, targetTable, needPageTransition);

                    // 適用ボタンをクリック済みにマークして非表示にする
                    const lastMessage = this.messages[this.messages.length - 1];
                    if (lastMessage && lastMessage.buttons) {
                        lastMessage.buttons = lastMessage.buttons.map(btn => {
                            if (btn.type === 'filter' || btn.type === 'aggregation') {
                                return {...btn, clicked: true};
                            }
                            return btn;
                        });
                    }
                }

                try {
                    // オブジェクトの循環参照をチェックして安全にシリアライズ
                    localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));
                } catch (e) {
                    console.error('Chat history save error:', e);
                    // 循環参照などの問題がある場合は、最低限必要なデータだけを保存
                    try {
                        const safeMessages = this.messages.map(msg => {
                            if (msg.type === 'bot' && msg.data) {
                                // 重要なデータだけを抽出
                                return {
                                    ...msg,
                                    data: {
                                        filter: msg.data?.filter,
                                        table_name: msg.data?.table_name,
                                        need_page_transition: msg.data?.need_page_transition,
                                        search_results: msg.data?.search_results
                                    }
                                };
                            }
                            return msg;
                        });
                        localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(safeMessages));
                    } catch (innerError) {
                        console.error('Failed to save even safe messages:', innerError);
                    }
                }
            },
            (error) => {
                this.isLoading = false;
                console.error('Error sending message:', error);
                this.messages.push(ChatMessage.createBotMessage('エラーが発生しました。しばらく経ってからやり直してください。'));
                this.shouldScrollToBottom = true;

                try {
                    localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));
                } catch (e) {
                    console.error('Chat history save error on error message:', e);
                }
            }
        );
    }

    handleKeyUp(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    /**
     * ボタンをクリックした時のハンドラー
     * Handler for button clicks
     * @param clickedButton クリックされたボタン
     * @param message クリックされたボタンを含むメッセージ
     */
    handleButtonClick(clickedButton: ChatButton, message?: ChatMessage): void {
        // 処理対象のメッセージを特定
        const targetMessage = message || (this.messages.filter(msg => msg.type === 'bot').pop() || null);

        if (clickedButton.type === 'table_changed') {
            let fieldData = null;
            if (targetMessage && targetMessage.data && targetMessage.data.fields) {
                fieldData = targetMessage.data;
                console.log('メッセージからフィールドデータを取得:', fieldData);
            } else if (this.lastResponse && this.lastResponse.data && this.lastResponse.data.fields) {
                fieldData = this.lastResponse.data;
                console.log('lastResponseからフィールドデータを取得:', fieldData);
            }

            if (fieldData) {
                if (targetMessage && targetMessage.buttons) {
                    targetMessage.buttons = targetMessage.buttons.map(btn => {
                        if (btn.type === 'table_changed') {
                            return { ...btn, clicked: true };
                        }
                        return btn;
                    });
                }

                this.fieldEditComplete.emit({
                    success: true,
                    data: fieldData,
                    message_html: targetMessage ? targetMessage.content : (this.lastResponse ? this.lastResponse.message_html : '変更を適用しました')
                });

                this.messages.push(ChatMessage.createBotMessage('変更を適用しました。'));
                this.shouldScrollToBottom = true;
                return;
            } else {
                console.error('フィールドデータが見つかりません');
                this.messages.push(ChatMessage.createBotMessage('フィールドデータが見つかりません。もう一度お試しください。'));
                this.shouldScrollToBottom = true;
                return;
            }
        }

        // FILE_SEARCHインテントの「対象のデータを表示」ボタンの場合
        if (clickedButton.type === 'display_data') {

            let searchResults = null;

            // まずメッセージオブジェクトから検索結果を探す
            if (targetMessage && targetMessage.data && targetMessage.data.search_results) {
                searchResults = targetMessage.data.search_results;
                console.log('メッセージから検索結果を取得:', searchResults);
            }
            // 次に直接のレスポンスから検索
            else if (this.lastResponse && this.lastResponse.data?.search_results) {
                searchResults = this.lastResponse.data.search_results;
                console.log('lastResponseから検索結果を取得:', searchResults);
            }

            if (searchResults) {
                this.createCustomFilterAndShowData(searchResults);
                return;
            } else {
                console.error('検索結果が見つかりません');
                this.messages.push(ChatMessage.createBotMessage('検索結果が見つかりません。もう一度検索をお試しください。'));
                this.shouldScrollToBottom = true;
                return;
            }
        }

        // DATA_SEARCHインテントの「検索条件を適用」ボタンまたはAGGREGATIONインテントの「集計を表示」ボタンの場合
        if (clickedButton.type === 'filter' || clickedButton.type === 'aggregation') {
            // 指定されたメッセージまたは最新のボットメッセージを使用
            // ボットメッセージにレスポンス情報が含まれているか確認
            if (targetMessage && targetMessage.data && targetMessage.data.filter) {
                const responseData = targetMessage.data;

                // フィルター情報を取得
                const filterData = responseData.filter;
                const targetTable = responseData.table_name;
                const currentTable = this.table;
                const needPageTransition = responseData.need_page_transition || targetTable !== currentTable;

                console.log(
                    clickedButton.type === 'aggregation' ? '集計条件を適用:' : 'フィルター適用:',
                    filterData,
                    targetTable,
                    needPageTransition
                );

                // カスタムフィルターを作成してデータを表示
                this.applyFilterCondition(filterData, targetTable, needPageTransition);
                return;
            } else if (this.lastResponse && this.lastResponse.data?.filter) {
                // 互換性のために元の処理も残す（lastResponseから取得）
                const targetTable = this.lastResponse.data.table_name;
                const currentTable = this.table;
                const needPageTransition = this.lastResponse.data.need_page_transition || targetTable !== currentTable;

                this.applyFilterCondition(
                    this.lastResponse.data.filter,
                    targetTable,
                    needPageTransition
                );
                return;
            } else {
                const errorMessage = clickedButton.type === 'aggregation'
                    ? '集計条件が見つかりません。もう一度集計をお試しください。'
                    : 'フィルター情報が見つかりません。もう一度検索をお試しください。';

                console.error(clickedButton.type === 'aggregation' ? '集計条件が見つかりません' : 'フィルター情報が見つかりません');
                this.messages.push(ChatMessage.createBotMessage(errorMessage));
                this.shouldScrollToBottom = true;
                return;
            }
        }

        // 通常のボタンクリック処理（その他のボタン）
        this.inputMessage = clickedButton.text;
        this.sendMessage();
    }

    /**
     * 検索条件を適用する
     * Apply filter condition
     * @param filterData フィルターデータ
     * @param tableName テーブル名
     * @param needPageTransition ページ遷移が必要かどうか
     */
    private applyFilterCondition(filterData: any, tableName: string, needPageTransition: boolean): void {
        if (!filterData) {
            console.error('フィルターデータがありません');
            return;
        }

        // デバッグログ
        console.log('フィルター適用開始:', {
            filterData: filterData,
            tableName: tableName,
            needPageTransition: needPageTransition,
            currentTable: this.table
        });

        // 別のテーブルへの移動が必要な場合
        if (needPageTransition) {
            // URLを組み立て
            try {
                // レスポンスから直接フィルターを使用して遷移
                const serializedFilter = encodeURIComponent(JSON.stringify(filterData));
                window.location.href = `/admin/${tableName}?filter=${serializedFilter}`;
            } catch (e) {
                console.error('フィルターの適用に失敗しました', e);
                this.messages.push(ChatMessage.createBotMessage('フィルターの適用に失敗しました。もう一度お試しください。'));
                this.shouldScrollToBottom = true;
            }
        } else {
            // 同じテーブル内でフィルターを適用（ページを更新せずに）
            try {
                // イベントを発火して親コンポーネントに通知
                this.onSetFilter.emit({
                    filter: filterData,
                    tableName: tableName
                });

                // 成功メッセージを表示
                this.shouldScrollToBottom = true;
            } catch (e) {
                console.error('フィルターの適用に失敗しました', e);
                this.messages.push(ChatMessage.createBotMessage('フィルターの適用に失敗しました。もう一度お試しください。'));
                this.shouldScrollToBottom = true;
            }
        }
    }

    /**
     * 検索パラメータからカスタムフィルターを作成してデータを表示
     * Create custom filter from search parameters and display data
     * @param searchResults 検索結果パラメータ
     */
    private createCustomFilterAndShowData(searchResults: any): void {
        // カスタムフィルターの作成と表示処理
        if (!searchResults) {
            console.error('検索結果がありません');
            return;
        }

        try {
            // 検索結果を使って直接カスタムフィルターを作成
            const customFilter = {
                type: 'table',
                table: this.table,
                search_params: Array.isArray(searchResults) ? searchResults : [searchResults],
            };

            // イベントを発火して親コンポーネントに通知
            this.onSetFilter.emit({
                filter: customFilter,
                tableName: this.table
            });

            // 成功メッセージを表示
            this.shouldScrollToBottom = true;
        } catch (e) {
            console.error('フィルターの適用に失敗しました', e);
            this.messages.push(ChatMessage.createBotMessage('フィルターの適用に失敗しました。もう一度お試しください。'));
            this.shouldScrollToBottom = true;
        }
    }

    /**
     * チェックボックスの選択状態が変更された時のハンドラー
     * Handler for checkbox changes
     * @param option チェックボックスのオプション
     * @param isChecked 選択状態
     */
    handleCheckboxChange(option: any, isChecked: boolean): void {
    }

    /**
     * プルダウンの選択値が変更された時のハンドラー
     * Handler for pulldown selection changes
     * @param selectedValue 選択された値
     */
    handlePulldownChange(selectedValue: string): void {
        this.inputMessage = selectedValue;
        this.sendMessage();
    }

    /**
     * テーブル編集用のメッセージを送信
     * Send message for table field editing
     * @param message ユーザーメッセージ
     */
    sendTableEditMessage(): void {
        const message = this.inputMessage;
        if (!message.trim()) return;

        this.inputMessage = '';
        this.isLoading = true;

        this.messages.push(ChatMessage.createUserMessage(message));
        this.shouldScrollToBottom = true;

        // リクエストデータを作成
        const requestData = {
            message: message,
            filter_info: this.customFilter ? JSON.stringify(this.customFilter) : ''
        };

        if (this.type === 'dataset_edit' && this.data) {
            requestData['field_rawdata_a'] = this.data.child_data_by_table['dataset_field'].map(data => {
                return data.raw_data
            })
        }

        requestData['table_rawdata'] = this.data.raw_data;

        // セッションIDがある場合は追加
        if (this.sessionId) {
            requestData['session_id'] = this.sessionId;
        }

        this.isLoading = true;
        this.shouldScrollToBottom = true;

        const endpoint = `/admin/chat-table-edit-by-ai`

        this._connect.post(endpoint, requestData).subscribe(
            (response) => {
                this.isLoading = false;

                // レスポンスを保存
                this.lastResponse = response;

                // セッションIDを保存
                if (response.session_id) {
                    this.sessionId = response.session_id;
                    localStorage.setItem(`chat_session_${this.table}`, this.sessionId);
                }

                this.messages.push({
                    type: 'bot',
                    content: response.message_html || 'すみません。もう少し具体的に指示をお願いいたします。',
                    buttons: response.buttons || [],
                    checkboxes: [],
                    pulldown: [],
                    session_id: this.sessionId
                });
                this.shouldScrollToBottom = true;

                localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));

                console.log('AI response for field edit:', JSON.stringify(response, null, 2));

                // table_changed ボタンクリック時のみ反映するため、ここでは自動反映しない
                // ボタンクリック時に handleButtonClick() で処理される
            },
            (error) => {
                this.isLoading = false;
                console.error('Error sending table edit message:', error);

                this.messages.push({
                    type: 'bot',
                    content: 'エラーが発生しました。しばらく経ってからやり直してください。',
                    buttons: [],
                    checkboxes: [],
                    pulldown: []
                });
                this.shouldScrollToBottom = true;

                localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));
            }
        );
    }

    /**
     * ファイル検索専用メッセージ送信
     */
    sendFileSearchMessage(): void {
        if (!this.inputMessage.trim()) {
            return;
        }

        this.messages.push(ChatMessage.createUserMessage(this.inputMessage));
        this.shouldScrollToBottom = true;

        const requestData = {
            message: this.inputMessage,
            table: this.table
        };

        if (this.sessionId) {
            requestData['session_id'] = this.sessionId;
        }

        // data_idがある場合（view component内での使用時）は追加
        if (this.data && this.data.raw_data && this.data.raw_data['id']) {
            requestData['data_id'] = this.data.raw_data['id'];
        }

        // ダッシュボードから呼ばれた場合は全テーブル検索
        if (this.table === 'dashboard') {
            requestData['all_tables'] = true;
        }

        this.inputMessage = '';
        this.isLoading = true;
        this.shouldScrollToBottom = true;

        // ダッシュボードの場合は特別なURLを使用
        const apiUrl = this.table === 'dashboard'
            ? '/admin/file-search-chat'
            : `/admin/${this.table}/file-search-chat`;

        this._connect.post(apiUrl, requestData).subscribe(
            (response) => {
                this.isLoading = false;

                // セッションIDを保存（新規生成された場合の対応）
                if (response.session_id) {
                    this.sessionId = response.session_id;
                    localStorage.setItem(`chat_session_${this.table}`, this.sessionId);
                    console.log('File search session ID saved:', this.sessionId);
                }

                const botMessage = new ChatMessage({
                    type: 'bot',
                    content: response.message_html || response.message || '検索結果が見つかりませんでした。',
                    buttons: [],
                    checkboxes: [],
                    pulldown: [],
                    session_id: this.sessionId,
                    data: response,
                    source_files: response.source_files || []
                });

                this.messages.push(botMessage);
                this.shouldScrollToBottom = true;

                // チャット履歴を保存
                localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));
            },
            (error) => {
                this.isLoading = false;
                console.error('ファイル検索エラー:', error);

                // エラーメッセージを取得（APIからのレスポンスまたはデフォルト）
                let errorMessage = '検索中にエラーが発生しました。';
                if (error.error && error.error.msg) {
                    errorMessage = error.error.msg;
                }

                this.messages.push(ChatMessage.createBotMessage(errorMessage));
                this.shouldScrollToBottom = true;
                localStorage.setItem(`chat_history_${this.table}`, JSON.stringify(this.messages));
            }
        );
    }

    /**
     * ファイルリンクのクリックイベントハンドラーを設定
     */
    private setupFileLinkHandlers(): void {
        // チャットボディ内のすべてのファイルリンクを取得
        const fileLinks = this.chatBodyRef?.nativeElement?.querySelectorAll('a.file-link');

        if (fileLinks) {
            fileLinks.forEach((link: HTMLAnchorElement) => {
                // すでにイベントハンドラーが設定されているかチェック
                if (!link.dataset.handlerSet) {
                    link.addEventListener('click', (event: MouseEvent) => {
                        event.preventDefault();
                        event.stopPropagation();

                        // data属性からテーブル名とIDを取得
                        const table = link.dataset.table;
                        const id = link.dataset.id;

                        if (table && id) {
                            // Angularのルーターを使用して遷移
                            this.router.navigate(['/admin', table, 'view', id]);

                            // チャットボックスを閉じる（オプション）
                            // this.isChatOpen = false;
                        }
                    });

                    // ハンドラーが設定されたことをマーク
                    link.dataset.handlerSet = 'true';
                }
            });
        }
    }


    /**
     * ファイルをダウンロード
     * @param fileId ファイルID
     * @param fileName ファイル名（オプショナル）
     */
    public downloadFile(fileId: string, fileName?: string): void {
        const downloadUrl = this._connect.getApiUrl() + `/admin/file-by-id/${fileId}`;
        // pdf_downloadをtrueにしてPDFもダウンロードするように設定
        this._shared.download_file(downloadUrl, null, false, fileName || 'file', '1', true);
    }

    /**
     * ファイルをブラウザで表示（PDFのみ）
     * @param fileId ファイルID
     * @param fileName ファイル名（オプショナル）
     */
    public viewFile(fileId: string, fileName?: string): void {
        const viewUrl = this._connect.getApiUrl() + `/admin/file-by-id/${fileId}`;
        // PDFをブラウザで表示（pdf_downloadをfalseに設定）
        this._shared.download_file(viewUrl, null, false, fileName || 'file', '0', false);
    }

    /**
     * ファイルがPDFかどうかを判定
     * @param fileName ファイル名
     * @returns PDFファイルの場合true
     */
    public isPdfFile(fileName: string): boolean {
        if (!fileName) {
            return false;
        }
        return fileName.toLowerCase().endsWith('.pdf');
    }

    /**
     * レコードページへ遷移
     * @param table テーブル名
     * @param recordId レコードID
     */
    public navigateToRecord(table: string, recordId: string): void {
        this.router.navigate(['/admin', table, 'view', recordId], {
            queryParams: {chatOpen: 'true'}
        });
        // チャットボックスを閉じない
    }

    /**
     * 入力文字数変更時のハンドラ
     * @param event イベント
     */
    public handleInputChange(event: any): void {
        const value = event.target.value;

        // 300文字を超えた場合はカット
        if (value.length > 300) {
            this.inputMessage = value.substring(0, 300);
        }
    }
}
