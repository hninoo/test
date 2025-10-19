import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import ToastrService from '../toastr-service-wrapper.service';
import {ActivatedRoute} from '@angular/router';


declare var paypal;
declare var Stripe;

@Component({
    selector: 'app-payment-page',
    templateUrl: './payment-page.component.html',
    styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent implements OnInit {

    private view_terms_and_conditions;
    public quantity: number = 5;
    public contract_type = 'user_num';
    public user_num = 5;
    public price = 5500;
    public certificateUserCount = 0;
    public has_next_plan: boolean = false;
    public next_plan: Object = null;
    public monthly_rpa_step_limit: number = 100; // コネクトのデフォルト上限 (無料枠)
    public connect_step_options: number[] = [100, 200, 300, 400, 500, 1000, 2000, 3000, 5000, 10000];
    public Math = Math; // Make Math available to the template

    public stripeInit;
    public stripePaymentHandler;
    public _shared;

    public is_update: boolean = false;

    public min_user_num: number = 5;
    public max_user_num: number = 3000;
    public is_valid_num: boolean = true;
    public agreed: boolean = false;

    public current_payment_service: string = null;
    public current_amount: number = null;

    public add_size: number = 0;
    public options: Array<Object> = [
        {
            type: 'mail_option',
            name: 'メール配信機能',
            price_str: ' (8,000円 + 税/月, 5,000件/月まで)',
            price: 8000,
            base_limit: 5000,
            additional_units: 0,
            checked: false
        },
        {
            type: 'enable_api',
            name: 'API利用',
            price_str: ' (5,000円 + 税/月, ３万コール/月)',
            price: 5000,
            checked: false
        },
        {
            type: 'google_map',
            name: 'GoogleMap機能',
            price_str: ' (5,000円 + 税/月, 3,000回表示/月)',
            price: 5000,
            checked: false
        },
        {
            type: 'enable_filesearch',
            name: 'AIファイル検索オプション',
            price_str: '',
            price: 0,
            price_per_user: 0,
            checked: false
        }
    ]

    public size_a: number[] = [];

    private paypal_id: string;

    public loading: boolean = true
    public sentRequest: boolean = false
    public sending: boolean = false
    public notiSent: boolean = false
    public notiSending: boolean = false
    private toasterService: ToastrService;
    private is_debug: boolean;

    public updated_status: string = null;
    public update_card_info: boolean = false;
    public pay_type: string = 'pay_as_stripe';

    @ViewChild('paypal') paypalElement: ElementRef;

    @ViewChild('updatePaymentModal') updatePaymentModal: any;
    @ViewChild('sendNotiToUserPayAsBank') sendNotiToUserPayAsBank: any;

    // GoogleMap呼び出し回数設定
    public googleMapCallCount: number = 1; // デフォルトは1単位（3,000回/月）

    // メール配信追加購入設定
    public mailDeliveryAdditionalUnits: number = 0; // 追加購入単位数（各+5,000件）

    constructor(public _connect: Connect, public _share: SharedService, toasterService: ToastrService, private _route: ActivatedRoute) {
        this.toasterService = toasterService
        for (let i = 100; i <= 2000; i += 100) {
            this.size_a.push(i);
        }
    }

    public getPaypalButtonId(): string {
        return 'paypal-button-container-' + this.paypal_id;

    }


    ngOnInit(): void {
        this.loading = true;
        this.approve_url = null;
        console.info(this._share.env)

        this._route.params.subscribe(params => {
            this.updated_status = params.update_status
            if (this.updated_status) {
                this.sentRequest = true
                this.is_update = true;
            }
        });
        this.load(true)
    }

    load(init = false) {
        this._share.loadAdminDatas().then((_shared: SharedService) => {
            console.info(_shared.env)
            this._shared = _shared;
            if (init) {
                this.is_debug = _shared.env !== 'production'
                this.is_update = !_shared.isTrial()
                this.quantity = _shared.cloud_setting['max_user']
                this.contract_type = _shared.cloud_setting['contract_type']
                this.add_size = _shared.cloud_setting['add_size']
                this.certificateUserCount = _shared.cloud_setting['max_client_secure_user_num']
                this.googleMapCallCount = _shared.cloud_setting['google_map_max_call_count_plan'] ? parseInt(_shared.cloud_setting['google_map_max_call_count_plan']) : 1
                // 現在の月間コネクトステップ数上限を設定
                if (_shared.cloud_setting['monthly_rpa_step_limit']) {
                    this.monthly_rpa_step_limit = _shared.cloud_setting['monthly_rpa_step_limit']
                }
                // メール配信の追加購入単位を設定
                if (_shared.cloud_setting['mail_delivery_monthly_limit'] && _shared.cloud_setting['mail_delivery_monthly_limit'] > 5000) {
                    // 5000件を超える分を追加単位として計算
                    this.mailDeliveryAdditionalUnits = Math.ceil((_shared.cloud_setting['mail_delivery_monthly_limit'] - 5000) / 5000);
                }
                this.options.forEach(op => {
                    if (_shared.cloud_setting[op['type']] == 'true') {
                        op['checked'] = true
                    }
                })
                this.onQuantityChange(this.quantity.toString())
            }

            if (this.contract_type == 'user_num') {
                //for user plan
                if (this.is_debug) {
                    //DEBUG_MODE
                    console.info('SANDBOX MODE=======')
                    this.paypal_id = 'P-5FT4600364607682RMKI43YY'
                } else {
                    //PRODUCTION
                    this.paypal_id = 'P-2UR090042T367892LMJ2FTVI'
                }
            } else {
                //for login plan
                if (this.is_debug) {
                    //DEBUG_MODE
                    console.info('SANDBOX MODE=======')
                    this.paypal_id = 'P-8DA879297S218404RMSJ7OFY'
                } else {
                    //PRODUCTION
                    this.paypal_id = 'P-3976328828964654XMOZX37I'
                }
            }

            this.loading = false;

            //add paypal js
            const script = document.createElement('script');
            script.async = true;
            if (this.is_debug) {
                script.src = 'https://www.paypal.com/sdk/js?client-id=AaMHbDxm495QgOHvljWKfxsZMsVQX6S0VcuFFH2TpzyowUPQiMydYptoojLduoVJqEGpzBJVIgJf0mFp&vault=true&intent=subscription';
            } else {
                script.src = 'https://www.paypal.com/sdk/js?client-id=AVJ6nz2eqkJyaK7AWdXhq2aq-DjFXdjDUqBg-mADeHvzL78LKA8relziCxJSSLBKZD04ju-qhSs-TBLB&vault=true&intent=subscription';
            }

            const div = document.getElementById('paypal_script');
            div.insertAdjacentElement('afterend', script);

            this.loadStripeJs();
            //add Stripe js
            // const stripeScript = document.createElement('script');
            // stripeScript.async = true;
            // stripeScript.src = 'https://js.stripe.com/v3/';
            // const stripeDiv = document.getElementById('stripe_script');
            // stripeDiv.insertAdjacentElement('afterend', stripeScript);


            if (this.is_update) {
                this._connect.get(this._connect.getApiUrl() + '/admin/next-plan').subscribe((response) => {
                    console.log(response)
                    this.has_next_plan = response.next_plan;
                    this.current_payment_service = response.current_payment_service;
                    this.current_amount = response.current_amount;
                    if (this.has_next_plan) {
                        this.next_plan = response;
                        this.contract_type = response.contract_type;
                        this.user_num = response.max_user;
                        this.quantity = response.max_user;
                        this.add_size = response.add_size;
                        this.options.forEach(op => {
                            if (response['options'][op['type']]) {
                                op['checked'] = true
                                // メール配信の追加単位を設定
                                if (op['type'] === 'mail_option' && response['mail_delivery_monthly_limit']) {
                                    const limit = response['mail_delivery_monthly_limit'];
                                    if (limit > 5000) {
                                        op['additional_units'] = Math.ceil((limit - 5000) / 5000);
                                        this.mailDeliveryAdditionalUnits = op['additional_units'];
                                    }
                                }
                            } else {
                                op['checked'] = false
                            }
                        });

                    }

                });
            } else {
                setTimeout(() => {
                    if (!document.getElementById(this.getPaypalButtonId())) {
                        return
                    }


                    this._connect.get(this._connect.getApiUrl() + '/admin/showPaymentPage').subscribe((response) => {
                        var app = this;
                        let inter = setInterval(() => {
                            console.log('check')
                            if (paypal !== undefined) {

                                paypal.Buttons({
                                    style: {
                                        shape: 'rect',
                                        color: 'gold',
                                        layout: 'vertical',
                                        label: 'subscribe'
                                    },
                                    createSubscription: (data, actions) => {
                                        return actions.subscription.create({
                                            /* Creates the subscription */
                                            plan_id: app.paypal_id,
                                            quantity: app.user_num // The quantity of the product for a subscription
                                        });
                                    },
                                    onApprove: (data, actions) => {
                                        app._connect.post(app._connect.getApiUrl() + '/admin/paymentSuccess',
                                            {
                                                facilitatorAccessToken: data.facilitatorAccessToken,
                                                orderID: data.orderID,
                                                paymentSource: data.paymentSource,
                                                subscriptionID: data.subscriptionID,
                                                user_num: this.user_num,
                                                contract_type: this.contract_type,
                                            }
                                        ).subscribe((payment_response) => {
                                            this.sentRequest = true
                                        })

                                    }
                                }).render('#' + this.getPaypalButtonId()); // Renders the PayPal button
                            }
                            if (Stripe !== undefined && paypal !== undefined) {
                                clearInterval(inter)
                            }

                        }, 300)

                    }, (error) => {
                        window.location.replace('/admin/dashboard');
                    })

                }, 300)

            }

        })
    }

    getUserPriceOnly(): number {
        let userPrice = 0;
        let input_qty = this.quantity;

        if (this._share.cloud_setting['plan_version'] == '2023') {
            if (this.contract_type == 'user_num') {
                if (input_qty < 11) {
                    if (input_qty < 5) {
                        userPrice = 5000;
                    } else {
                        userPrice = input_qty * 1000;
                    }
                } else {
                    userPrice = 10000 + (input_qty - 10) * 800;
                }
            } else {
                if (input_qty <= 20) {
                    userPrice = input_qty * 2200;
                } else {
                    userPrice = 20 * 2200 + (input_qty - 20) * 1800;
                }
            }
        } else {
            //all user 1100 if user num / else 2200
            if (this.contract_type == 'user_num') {
                userPrice = input_qty * 1100;
            } else {
                userPrice = input_qty * 2200;
            }
        }

        return userPrice;
    }

    getUserPrice(): string {
        if (this._share.cloud_setting['plan_version'] == '2023') {
            return this.quantity < 11 ? '1,000' : '800';
        } else {
            return '1,100';
        }
    }

    getLoginPrice(): string {
        if (this._share.cloud_setting['plan_version'] == '2023') {
            return this.quantity <= 20 ? '2,200' : '1,800';
        } else {
            return '2,200';
        }
    }

    onChangePlan() {
        // GoogleMapオプションのチェック状態を確認
        const googleMapOption = this.options.find(op => op['type'] === 'google_map');

        // GoogleMapオプションがチェックされている場合、かつgoogleMapCallCountが未設定または0の場合のみデフォルト値を設定
        if (googleMapOption && googleMapOption['checked'] && (!this.googleMapCallCount || this.googleMapCallCount === 0)) {
            // GoogleMapオプションがチェックされている場合、呼び出し回数をデフォルト値の1に設定
            this.googleMapCallCount = 1;
        } else if (!googleMapOption || !googleMapOption['checked']) {
            // GoogleMapオプションがチェックされていない場合、呼び出し回数をリセット
            this.googleMapCallCount = 0;
        }

        this.onQuantityChange(this.quantity.toString());
        this.is_update = !this._share.isTrial()
        // this.load()
    }

    // AIファイル検索オプションの1ユーザーあたりの料金を取得
    getFileSearchPricePerUser(): number {
        if (this.contract_type == 'user_num') {
            return 500; // ユーザー数プラン: 500円/ユーザー
        } else {
            return 800; // ログイン数プラン: 800円/ユーザー
        }
    }

    // AIファイル検索オプションの総料金を計算
    getFileSearchTotalPrice(): number {
        return this.getFileSearchPricePerUser() * this.user_num;
    }

    onQuantityChange(input_qty_string: string): void {
        if (this.quantity < this.min_user_num) {
            this.is_valid_num = false;
            return;
        } else if (this.quantity > this.max_user_num) {
            this.is_valid_num = false;
            return;
        }

        this.is_valid_num = true;
        this.user_num = this.quantity;
        let input_qty = this.quantity;

        // AIファイル検索オプションの料金を動的に更新
        const fileSearchOption = this.options.find(op => op['type'] === 'enable_filesearch');
        if (fileSearchOption) {
            const pricePerUser = this.getFileSearchPricePerUser();
            const totalPrice = this.getFileSearchTotalPrice();
            fileSearchOption['price_per_user'] = pricePerUser;
            fileSearchOption['price'] = totalPrice;
            fileSearchOption['price_str'] = ` (${pricePerUser}円/ユーザー + 税/月)`;
        }

        if (this._share.cloud_setting['plan_version'] == '2023') {
            if (this.contract_type == 'user_num') {
                if (input_qty < 11) {
                    if (input_qty < 5) {
                        this.price = 5000;
                        this.user_num = 5;
                    } else {
                        this.price = input_qty * 1000;
                    }
                } else {
                    this.price = 10000 + (input_qty - 10) * 800;
                }
            } else {
                if (input_qty <= 20) {

                    this.price = input_qty * 2200;
                } else {
                    this.price = 20 * 2200 + (input_qty - 20) * 1800;
                }
            }
        } else {
            //all user 1100 if user num / else 2200
            if (this.contract_type == 'user_num') {
                this.price = input_qty * 1100;
            } else {
                this.price = input_qty * 2200;
            }
        }


        //追加容量
        this.price += Math.ceil(this.add_size / 100) * 10000;

        //追加オプション
        this.options.forEach((option) => {
            if (option['checked']) {
                this.price += option['price']

                // メール配信の追加件数に応じた追加料金
                if (option['type'] === 'mail_option' && this.mailDeliveryAdditionalUnits > 0) {
                    this.price += 5000 * this.mailDeliveryAdditionalUnits;
                }

                // GoogleMap呼び出し回数に応じた追加料金
                if (option['type'] === 'google_map' && this.googleMapCallCount > 1) {
                    this.price += option['price'] * (this.googleMapCallCount - 1);
                }
                if (option['type'] === 'google_map' && this.googleMapCallCount >= 1 && this._share.db_name === 'yoejha14xo') {
                    this.price -= 5000;
                }
            }

        });

        //クライアント証明書
        if (this.certificateUserCount > 0) {
            this.price += this.certificateUserCount * 200;
        }

        //コネクト月間ステップ数の価格ロジック
        //100ステップまでは無料、それ以上は+200ステップごとに5000円(税抜)
        if (this.monthly_rpa_step_limit > 100) {
            // 100, 300, 500... のステップ数に対応する価格計算
            const step_index = (this.monthly_rpa_step_limit - 100) / 200;
            this.price += Math.ceil(step_index) * 5000;
        }

        //消費税
        this.price *= 1.1;

    }

    public approve_url: string = null;

    sendUpdateRequest() {
        this.sending = true
        console.log(this._share.cloud_setting)
        if (this._share.cloud_setting['payment_method'] == 'credit') {
            let post_options = {}
            this.options.forEach(op => {
                if (op['checked']) {
                    post_options[op['type']] = true
                }
            })
            console.log('credit payment method')
            let submitData = this.getPostPlanData();
            this._connect.post('/admin/stripe-payment-update', submitData, {}, false)
                .subscribe(res => {
                    console.log(res)
                    this.updated_status = 'update_success'
                    this.toasterService.success('契約更新依頼を送信しました')
                    this.sending = false;
                    this.updatePaymentModal.hide()
                    this.sentRequest = true
                }, (res) => {
                    console.log(res.error)
                    this.toasterService.error(res.error.error_message);
                    this.sending = false;
                    this.updatePaymentModal.hide()
                })
        }/*else{
            //paypal
            let post_options = {}
            this.options.forEach(op=>{
                if(op['checked']){
                    post_options[op['type']] = true
                }
            })

            this._connect.post('/admin/paymentUpdate', {'user_num': this.user_num, 'contract_type': this.contract_type,'add_size':this.add_size,'option':post_options}).subscribe(res => {
                console.log(res)
                if (res.approve_url) {
                    this.toasterService.success('契約更新依頼を送信しました.URLリンクより支払い設定を行って下さい。')
                    this.approve_url = res.approve_url;
                } else {
                    this.toasterService.success('契約更新依頼を送信しました')
                }
                this.sending = false;
                this.updatePaymentModal.hide()
                this.sentRequest = true
            })
        }*/

    }

    sendNotiToUserAsPayAsBank() {
        this.notiSending = true
        let post_options = {}
        this.options.forEach(op => {
            if (op['checked']) {
                post_options[op['type']] = true
            }
        })
        this._connect.post('/admin/send-notify-to-user-pay-as-bank', {
            'user_num': this.user_num, 'contract_type': this.contract_type, 'add_size': this.add_size, 'options': post_options, 'price': this.price.toFixed(0)
        }).subscribe(res => {
            console.log(res)

            this.notiSending = false;
            this.sendNotiToUserPayAsBank.hide()
            this.notiSent = true
        })

    }

    open_approval() {
        location.href = this.approve_url;
    }

    confirmStripePayment(token = null) {
        if (token) {
            let submitData = this.getPostPlanData();
            submitData['token'] = token;

            this.sending = true;
            console.log(submitData);
            this._connect.post(this._connect.getApiUrl() + '/admin/create-stripe-subscription', submitData).subscribe((response) => {
                console.log(response)
                // Create payment method and confirm payment intent.
                let send_data_func = (result = null) => {
                    console.log(result);
                    console.log('Success! Redirecting to your account.');
                    let submitData = this.getPostPlanData();
                    submitData['facilitatorAccessToken'] = response.clientSecret;
                    submitData['orderID'] = response.subscription.items.data[0].id;
                    if (result) {
                        submitData['paymentSource'] = result.paymentIntent.source;
                    }
                    submitData['subscriptionID'] = response.subscription.id;

                    this._connect.post(this._connect.getApiUrl() + '/admin/stripe-paymentSuccess',
                        submitData
                    ).subscribe((payment_response) => {
                        console.log(payment_response);
                        this.sending = false;
                        this.updated_status = 'update_success'
                        this.sentRequest = true;
                    })
                }
                if (this.current_payment_service == 'paypal') {
                    send_data_func()
                } else {
                    this.stripeInit.confirmCardPayment(response.clientSecret).then((result) => {
                        if (result.error) {
                            this.toasterService.error(result.error.message);
                            this.sending = false;
                        } else {
                            // Redirect the customer to their account page
                            send_data_func(result)

                        }
                    });
                }

            }, (error) => {
                this.toasterService.error('支払いエラーが発生しました。');
                this.sending = false;

            })
        } else {
            this.toasterService.error('Please check your connection');
        }
    }

    getPostPlanData(): Object {

        let submitData = {
            'user_num': this.user_num,
            'contract_type': this.contract_type,
            'price': this.price.toFixed(0),
            'add_size': this.add_size,
            'certificateUserCount': this.certificateUserCount,
            'googleMapCallCount': this.googleMapCallCount,
            'monthly_rpa_step_limit': this.monthly_rpa_step_limit,
            'options': {}
        };

        let post_options = {}
        this.options.forEach(op => {
            if (op['checked']) {
                submitData['options'][op['type']] = true
                // メール配信オプションがチェックされている場合のみ、mail_delivery_monthly_limitを設定
                if (op['type'] === 'mail_option') {
                    submitData['mail_delivery_monthly_limit'] = this.mailDeliveryAdditionalUnits > 0 ? 5000 + (this.mailDeliveryAdditionalUnits * 5000) : 5000;
                }
            }
        })

        // メール配信オプションがチェックされていない場合は、mail_delivery_monthly_limitを設定しない
        // バックエンドでデフォルト値5000が使用される

        return submitData

    }


    updateStripeCardInfo(token){
        let submitData = {
            token: token
        }
        this.sending = true;
        this._connect.post(this._connect.getApiUrl() + '/admin/stripe-card-update', submitData).subscribe((response) => {
            console.log(response)
            this.toasterService.success('カード情報が更新されました。')
            this.sending = false;
            this._share.checkStripeCreditExpired();
            // this.updated_status = 'update_success'
            // this.sentRequest = true;
        });

    }
    loadStripeJs() {

        if (!window.document.getElementById('stripe-js')) {

            let script = window.document.createElement('script');

            script.id = 'stripe-js';
            script.type = 'text/javascript';
            script.async = true;
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => {
                this.stripeInit = Stripe(this._shared.stripe_public_key)
            }
            window.document.body.appendChild(script);
        }else{
            this.stripeInit = Stripe(this._shared.stripe_public_key)
        }
        //load checkout js
        if (!window.document.getElementById('stripe-checkout')) {

            let script = window.document.createElement('script');

            script.id = 'stripe-checkout';
            script.type = 'text/javascript';
            script.src = 'https://checkout.stripe.com/checkout.js';
            script.onload = () => {
                this.initStripePaymentHandler();
            };

            window.document.body.appendChild(script);
        }else{
            this.initStripePaymentHandler();
        }
    }

    initStripePaymentHandler(){
        this.stripePaymentHandler = (<any>window).StripeCheckout.configure({
            key: this._shared.stripe_public_key,
            locale: 'ja',
            token: (stripeToken: any) => {
                console.log(stripeToken);
                if (this.update_card_info) {
                    this.updateStripeCardInfo(stripeToken.id);
                } else {
                    this.confirmStripePayment(stripeToken.id)
                }
                // this.toasterService.success('Payment has been successfull!');
            },
        });
    }
    makePayment(update = false) {
        if (this.stripePaymentHandler) {
            if(update){
                this.update_card_info = true;
                this.stripePaymentHandler.open({
                    name: 'カード情報更新',
                    // description: `${this.user_num} users`,
                    email: this._shared.user.email,
                    // label: 'Update Card',
                    'panel-label': 'カード情報更新',
                });
            }else{
                this.update_card_info = false;
                this.stripePaymentHandler.open({
                    name: 'PigeonCloud 契約',
                    description: `${this.user_num} users`,
                    email: this._shared.user.email,
                    amount: this.price,
                    currency: 'jpy'
                });
            }
        } else {
            this.toasterService.error('エラーが発生しました。お手数ですが、リロードして再度お試し下さい。')
        }
    }


}
