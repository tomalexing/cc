import ModelEntry from './model';
import loadAndInjectStyles from './css-loader';

import * as Db from './db.js';
import * as PromiseUtils from './promise-utils';


import QRCode from 'qrcode'
import WebFont from 'webfontloader';
import {MDCSimpleMenu} from '@material/menu';
import {MDCDialog} from '@material/dialog';
import {MDCSnackbar} from '@material/snackbar';

import * as VanillaSharing from 'vanilla-sharing';

import "regenerator-runtime/runtime";

const FONT_TIMEOUT = 300;
const EXTRA_STYLES = 'styles/styles.min.css';
const url = "http://api.btcimp.trade:4000";

const outTx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAYAAADN5B7xAAAAaklEQVQoU42PwRGAIAwE72hA39IEdmApWJnYiR3QBWUQJ87k4yOQb25vE8KZGrZCQFJvp8XoAoiZARcgxSAX0LL6g1gZH9V6JgAJxKqmDxiEdZ1ILAK5p0/S8N5bnnrawqoaAghyaLOd/QK2tS0fJDqlGAAAAABJRU5ErkJggg=='
const inTx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAYAAADN5B7xAAAAWklEQVQoU2NkQAJVhwwSGBgY7NvsLiQiiyOzGWEciGLG+QwM/xPb7C4swKuBWMUgQxjhiv////CfkeECLpNh4nAN//8zfGRg/E9YA0gnSU4iy9OomhgY8IUSAGIzLl6vc28tAAAAAElFTkSuQmCC'

/**
 * Formats a currency for display.
 * @param {number} value The value to format.
 * @return {string} The formatted value.
 */
function _formatCurrency(value) {
  // console.log(value);
  const whole = Math.floor(Number(value));
  const decimal = Number(value) % 1;

  const marker = (1.1).toLocaleString().charAt(1);

  let stringDecimal = decimal.toString(); 

  return `${whole.toLocaleString()}${marker}${stringDecimal.replace('0.','').substr(0,8)}`;
}

const Clipboard = (function(window, document, navigator) {
  var textArea,
      copy;

  function isOS() {
      return navigator.userAgent.match(/ipad|iphone/i);
  }


  function createTextArea(text) {
      textArea = document.createElement('textArea');
      textArea.value = text;
      document.body.appendChild(textArea);
  }

  function selectText() {
      var range,
          selection;

      if (isOS()) {
          range = document.createRange();
          range.selectNodeContents(textArea);
          selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          textArea.setSelectionRange(0, 999999);
      } else {
          textArea.select();
      }
  }

  function copyToClipboard() {        
      document.execCommand('copy');
      document.body.removeChild(textArea);
  }

  copy = function(text) {
      
      createTextArea(text);
      selectText();
      copyToClipboard();
      
  };

  return {
      copy: copy
  };
})(window, document, navigator);

const copyToClipboard = Clipboard.copy; 

/**
 * The main class for the application.
 */
class App {
  /**
   * Constructor, takes no parameters.
   */
  constructor() {
    this.loadingClickHandler = () => {
      this._screens.loading.classList.add('cc-loading--visible');
    };

    document.addEventListener('click', this.loadingClickHandler);

    this._walletRegister = false;
    
    // Screen element references.
    this._screens = {
      animation: document.querySelector('.cc-animation'),
      exchange: document.querySelector('.cc-exchange'),
      loading: document.querySelector('.cc-loading'),
    };

    this._elements = {
      price: document.querySelector('.cc-prices'),
      registerBtn: document.querySelector('.cc-register__btn'),
      editBtn: document.querySelector('.cc-edit__btn'),
      depositBtn: document.querySelector('.cc-deposit__btn'),
      card: document.querySelector('.cc-exchange__card'),
      calcError: document.querySelector('.cc-calc-error'),
      depositError: document.querySelector('.cc-deposit-error'),
      registerError: document.querySelector('.cc-register-error'),
      more: document.querySelector('.сс-toolbar__more'),
      qrBtn: document.querySelector('.cc-qrcode__btn'),
      registerForm: document.querySelector('.cc-register__form'),
      registerBox: document.querySelector('#register .cc-input__value'),
      depositBox: document.querySelector('#deposit .cc-input__value'),
      qrcode: document.querySelector('#qr .cc-qrcode'),
      qrBlock: document.querySelector('#qr'),
      history: document.querySelector('#historyAdd'),
      historyBlock: document.querySelector('#history'),
      menuM: document.querySelector('.cc-mobile-menu'),
      menuD: document.querySelector('.cc-desktop-menu'),
      depositBlock: document.querySelector('#depositBlock'),
      cmc: document.querySelector('#cmc'),
      cmcGraph: document.querySelector('.cc-cmc__graph'),
      ccArrow: document.querySelector('.cc-arrow'),
      referal: document.querySelector('#referal'),
      referalBox: document.querySelector('#referalBox'),
      referalBtn: document.querySelector('.cc-referal__btn'),
      referalEmbed: document.querySelector('.cc-referal__embed'),
      referalShare: document.querySelector('.cc-referal__share'),
      referalEmbedCopyBtn: document.querySelector('.cc-copyembed__btn'),
      shareButtons: document.querySelector('.cc-shareButtons'),
    };

    this._model = {
      price: {
        metaText: 'price',
        symbolBTC: new ModelEntry('price.symbolBTC'),
        
        firstBTC: new ModelEntry('price.first.amountBTC'),
        firstDiscount: new ModelEntry('price.first.discount'),
        firstIMP: new ModelEntry('price.first.amountIMP'),
        
        secondBTC: new ModelEntry('price.second.amountBTC'),
        secondDiscount: new ModelEntry('price.second.discount'),
        secondIMP: new ModelEntry('price.second.amountIMP'),
        
        thirdBTC: new ModelEntry('price.third.amountBTC'),
        thirdDiscount: new ModelEntry('price.third.discount'),
        thirdIMP: new ModelEntry('price.third.amountIMP'),
        
        fourthBTC: new ModelEntry('price.fourth.amountBTC'),
        fourthDiscount: new ModelEntry('price.fourth.discount'),
        fourthIMP: new ModelEntry('price.fourth.amountIMP'),
        
        fifthBTC: new ModelEntry('price.fifth.amountBTC'),
        fifthDiscount: new ModelEntry('price.fifth.discount'),
        fifthIMP: new ModelEntry('price.fifth.amountIMP'),
      },
      residue: {
        amount: new ModelEntry('residue.amount'),
      },
      calcIMP: {
        amount: new ModelEntry('calc.amountIMP'),
        computedAmount: new ModelEntry('calc.amountComputedIMP'),
      },
      calcBTC: { 
        amount: new ModelEntry('calc.amountBTC'),
        computedAmount: new ModelEntry('calc.amountComputedBTC'),
        realComputedAmount: new ModelEntry()
      },
      register: {
        address: new ModelEntry('register.address'),
      },
      qr:{
        link: new ModelEntry('qr.link'),
        bitcoin: new ModelEntry('qr.bitcoin')
      },
      cmc:{
        change: new ModelEntry('cmc.change'),
        amount: new ModelEntry('cmc.amount')
      },
      referal: {
        link: new ModelEntry('referal.link'),
        bannerhtml: new ModelEntry('referal.bannerhtml'),
        bannertext: new ModelEntry('referal.bannertext'),
      }
    }

    this.priceTable = {
      firstBTC: 0.000065,
      firstDiscount: '50%',
      firstIMP: 10000,
      
      secondBTC: 0.000078,
      secondDiscount: '40%',
      secondIMP: 15000,

      thirdBTC: 0.000091,
      thirdDiscount: '30%',
      thirdIMP: 20000,

      fourthBTC: 0.000104,
      fourthDiscount: '20%',
      fourthIMP: 25000,

      fifthBTC: 0.000117,
      fifthDiscount: '10%',
      fifthIMP: 35000,
    };


    this.META = {
      URL: 'http://btcimp.trade',
      TITLE: 'CryptoChange',
      DESCRIPTION: 'CryptoChange',
      IMAGE: 'http://btcimp.trade/images/Logo_512.png',
    };

    this._initModel();
    this._init();
    this._initElements();


  }

  _init() {

      const loadFonts = new Promise((resolve, reject) => {
          let done = 0;
          const checkDone = () => {
            done++;
            if (done === 1) {
              resolve();
            }
          };
          WebFont.load({
            google: {
              families: ['Montserrat:300'],
            },
            fontactive: checkDone,
            inactive: resolve,
          });
        });

        // Give fonts some time to load before displaying anything on screen.
        // This allows us to avoid unsightly font changes when loading from cache,
        // but show the UI quickly if loading from the network.
        Promise.race([
            loadFonts,
            PromiseUtils.wait(FONT_TIMEOUT),
            ]).then(() => requestAnimationFrame(() =>
                this._screens.exchange.classList.remove('cc-screen--hidden')));

        const loadExtraCSS = loadAndInjectStyles(EXTRA_STYLES);
        loadExtraCSS.then(() => console.log('Styles loaded!'));

        this._booted = Promise.all([
            loadExtraCSS
        ]);

        this._booted.then(() => this._hideLoadingScreen());

        if(this._elements.menuD && this._elements.menuM)
        this._booted.then( _ => PromiseUtils.wait(200).then( _ => {
          if( window.innerWidth <= 600 ){
            this._elements.menuM.style.display = 'block'
          }else{
            this._elements.menuD.style.display = 'block'
            PromiseUtils.wait(200).then( _ => {
              this._elements.menuD.style.opacity = '1';
            });
          }
        }));

        this._booted.then(() => {
          // Set up history handling for back button support.
          if ('history' in window) {
            // Add some state to current history location.
            history.replaceState({page: 'Exchange'}, 'Coin Exchange');

          }

        });
 

  }

  _initElements(){

    if(document.querySelector('.mdc-toolbar__menu')){

      const menu = new MDCSimpleMenu(document.querySelector('.mdc-toolbar__menu'));

      this._elements.more.addEventListener('click', () =>
      this._booted.then(() => (menu.open = !menu.open)));
    
    }

    if(document.querySelector('.cc-snackbar')){
      this._snackbar = new MDCSnackbar(document.querySelector('.cc-snackbar'));
    }

    if(document.querySelector('#cc-exchange-dialog')) {
      const howtobuyDialog = new MDCDialog(document.querySelector('#cc-exchange-dialog'));
      Array.from(document.querySelectorAll('.сс-menu__howtobuy')).map(el => el.addEventListener('click', () => howtobuyDialog.show()));
    }

    if(document.querySelector('#cc-about-dialog')) {
      const greetingDialog = new MDCDialog(document.querySelector('#cc-about-dialog'));
      Array.from(document.querySelectorAll('.сс-menu__greeting')).map(el => el.addEventListener('click', () => greetingDialog.show()));
    

      this._booted.then(() => {
        var searchParams = new URLSearchParams(window.location.search);
        if( searchParams.has('greeting') ){
          let greeting = searchParams.get('greeting');
          if(greeting == 'show'){
            greetingDialog.show();
          }
        }
      });
    }
    
    if(this._elements.referalEmbed) {
      const embedDialog = new MDCDialog(document.querySelector('#cc-embed-dialog'));
      this._elements.referalEmbed.addEventListener('click', () => embedDialog.show());
    }
    
    if(this._elements.referalShare) {
      const shareDialog = new MDCDialog(document.querySelector('#cc-share-dialog'));
      this._elements.referalShare.addEventListener('click', () => shareDialog.show());
    }


    this._calcIMP = document.querySelector('#calc-IMP');
    this._calcBTC = document.querySelector('#calc-BTC');
    this._calcBTCBox = document.querySelector('#calc-BTC .cc-input__value');
    this._calcIMPBox = document.querySelector('#calc-IMP .cc-input__value');
    this._register = document.querySelector('#register');
    this._registerBox = document.querySelector('#register .cc-input__value');
    this._deposit = document.querySelector('#deposit');
    this._depositBox = document.querySelector('#deposit .cc-input__value');

    // Set up event listeners for modifying the model.
    if( this._calcIMPBox )
    this._calcIMPBox.addEventListener('input', () => this._booted.then(() => {
      this._model.calcIMP.amount.value = parseFloat(this._calcIMPBox.value);
      this._validateInput('amountIMP');
    }));

    if( this._calcBTCBox )
    this._calcBTCBox.addEventListener('input', () => this._booted.then(() => {
      this._model.calcBTC.amount.value = parseFloat(this._calcBTCBox.value);
      this._validateInput('amountBTC');
    }));

    if( this._registerBox )
    this._registerBox.addEventListener('input', () => this._booted.then(() => {
      this._walletRegister = false;
      this._elements.registerBtn.removeAttribute('disabled')
      this._validateAddress();
    }));
    
    if( this._elements.registerForm )
    this._elements.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this._booted.then(() => {
        if( this._validIMPAddress ){
          this._registerWallet(this._registerBox.value)
        }
      }) 
    });

    if( this._elements.registerBtn )
    this._elements.registerBtn.addEventListener('click', () =>
      this._booted.then( _ => {
        if( this._validIMPAddress ){
          this._registerWallet(this._registerBox.value)
        }
      })
    );

    if( this._elements.editBtn )
    this._elements.editBtn.addEventListener('click', () =>
      this._booted.then( _ => {
        this._elements.registerBtn.classList.remove('cc-btn--hidden');
        this._elements.editBtn.classList.add('cc-btn--hidden');
        this._elements.registerBox.removeAttribute('disabled');
      })
    );

    if( this._elements.depositBtn )
    this._elements.depositBtn.addEventListener('click', () =>
      this._booted.then( _ => {
        copyToClipboard(this._model.register.address.value.btc_address)
      })
    );

    if( this._elements.qrBtn )
    this._elements.qrBtn.addEventListener('click', () =>
      this._booted.then( _ => {
        copyToClipboard(this._model.qr.link.value)
      })
    );


    if (this._elements.shareButtons ){

      document.getElementById('fbButton').addEventListener('click', _ => {
        VanillaSharing.fbButton({
          url: this.META.URL,
        });
      });

      document.getElementById('tw').addEventListener('click', _ => {
        VanillaSharing.tw({
          url: this.META.URL,
          title: this.META.TITLE,
          hashtags: ['CryptoChange'],
        });
      });

      document.getElementById('pinterest').addEventListener('click', _ => {
        VanillaSharing.pinterest({
          url: this.META.URL,
          description: this.META.DESCRIPTION,
          media: this.META.IMAGE,
        });
      });
    
      document.getElementById('gp').addEventListener('click', _ => {
        VanillaSharing.gp({
          url: this.META.URL,
        });
      });

      document.getElementById('email').addEventListener('click', _ => {
        VanillaSharing.email({
          url: this.META.URL,
          title: this.META.TITLE,
          description: this.META.DESCRIPTION,
          image: this.META.IMAGE,
        });
      });

    
    }

  }
  

  _initModel(){

    let { price, residue, calcIMP, calcBTC, register, cmc, referal } = this._model;

    const convertInModel = async (from, to, fromCur, toCur) => {
      const amount = from.amount.value;

      if ((amount || amount === 0)) {
        from.computedAmount.value = null;
        let cV = await this._convertValue(amount, fromCur, toCur);

        if(fromCur == 'imp')
          to.realComputedAmount.value = cV;

        to.computedAmount.value = _formatCurrency( cV );
      }
    };

    price.symbolBTC.value = 'BTC';

    // Load price from local storage, if available.
    let loadPrice;

    if( this._elements.price ){
      loadPrice = this._loadPrice()
        .then((price) => price, () => this._fetchPrice().then(this._storePrice));

      // Try to fetch latest price, regardless.
      PromiseUtils.after(loadPrice, () =>
          this._fetchPrice().then(this._storePrice).catch());


      // Load price from local storage, if available.
      const loadHistory = this._loadHistory().catch(_=>{});

      PromiseUtils.after(loadPrice, () => this._fetchHistory().catch());
    }

    // Load adress from local storage, if available.
    if( this._elements.registerBox ){
    const loadWallet = this._loadWallet()
      .then((val) => { register.address.value = val; }, () => {  // fallback
          if (window.location) {
            var searchParams = new URLSearchParams(window.location.search);
            if( searchParams.has('address') ){
              let walletBTC = searchParams.get('address');
              return this._registerWallet(walletBTC)
            }
          }
      }).then( _ => { // check if request forces changing imp wallet
        if (window.location) {
          var searchParams = new URLSearchParams(window.location.search);
          if( searchParams.has('from') ){
            let fromSite = searchParams.get('from');
            if(fromSite == 'webwallet'){
              if( searchParams.has('address') ){
                let walletBTC = searchParams.get('address');
                return this._registerWallet(walletBTC)
              }
            }
          } 
        }
      })
    }
  
    // Update computed values when value changes.
    calcIMP.amount.listen(() => convertInModel(calcIMP, calcBTC, 'imp', 'btc'));
    calcBTC.amount.listen(() => convertInModel(calcBTC, calcIMP, 'btc', 'imp'));


    this._convertValue(0.01, 'imp', 'btc').then((cV) => {
      const marker = (1.1).toLocaleString().charAt(1);
      // Trigger recalc.
      this._model.calcBTC.amount.value = 0.01;
      this._model.calcIMP.calulatedAmount = _formatCurrency(cV);
      this._calcBTCBox.placeholder = `0${marker}01`;
      this._screens.exchange.classList.add('cc-input--has');
      PromiseUtils.wait(200).then(() =>
          this._screens.exchange.classList.add('cc-input--has-end'));
    });

   
    // Set up model listeners for input boxes.
    // Note: Programmatic value changes don't trigger DOM events, so we avoid
    // infinite loops.
    this._model.calcIMP.computedAmount.listen((value) => {

      // A real computed value means we should clear the input.
      if (value !== null) {
        this._calcIMPBox.placeholder = value;
        this._calcIMPBox.value = '';
      }
      // If we have a computed value, it's probably because the other box has
      // a value, so let's check if we can clear the placeholder.
      if (this._calcBTCBox.value !== '') {
        this._calcBTCBox.placeholder = '';
      }

    });


    this._model.calcBTC.computedAmount.listen((value) => {
      // A real computed value means we should clear the input.
      if (value !== null) {
        this._calcBTCBox.value = '';
        this._calcBTCBox.placeholder = value;
      }
      // If we have a computed value, it's probably because the other box has
      // a value, so let's check if we can clear the placeholder.
      if (this._calcIMPBox.value !== '') {
        this._calcIMPBox.placeholder = '';
      }


      if(this._model.register.address.value && value){

       // let marker = (1.1).toLocaleString().charAt(1);
       // let sum = parseFloat(value.replace(marker, '.').replace(/[^0-9-.]/g, '')); 


        this._model.qr.bitcoin.linkOnly = `bitcoin:${this._model.register.address.value.btc_address}?amount=${this._model.calcBTC.realComputedAmount.value}`;        
        this._drawQR();
      }
      
    });

    calcBTC.amount.listen(value => {
      if(this._model.register.address.value && value){
        this._model.qr.bitcoin.linkOnly = `bitcoin:${this._model.register.address.value.btc_address}?amount=${value}`;

        this._drawQR();
    
      }
    })


    this._model.register.address.listen(wallet => {
      if (wallet !== null && wallet.btc_address) {
        this._elements.registerBtn.setAttribute('disabled', true)

        this._elements.registerBtn.classList.add('cc-btn--hidden');
        this._elements.editBtn.classList.remove('cc-btn--hidden');
        this._elements.registerBox.setAttribute('disabled', true);

        this._elements.depositBox.value = wallet.btc_address;
        this._elements.registerBox.value = wallet.imp_address;

        this._model.qr.link.link = `https://blockchain.info/address/${wallet.btc_address}`;
        
        if(this._model.calcBTC.amount.value && wallet.btc_address){
          
          this._model.qr.bitcoin.linkOnly = `bitcoin:${wallet.btc_address}?amount=${this._model.calcBTC.amount.value}`;
          
          this._drawQR();
        }

        this._fetchHistory(wallet.imp_address).then(this._storeHistory);

        this._makeInvite(wallet.imp_address).then( result => {
          
          referal.link.value = `http://btcimp.trade/?invite=${result.refcode || ''}`;

          this.META.URL = referal.link.value;
          
          referal.bannerhtml.innerHTML = `
            <a href="http://btcimp.trade/?invite=${result.refcode || ''}" target="_blank">
              <img src="https://cdn.discordapp.com/attachments/458184590087946240/463120976708894737/impleum_banner_468x60.gif" />
            </a>
          `;

          referal.bannertext.value = `
<a href="http://btcimp.trade/?invite=${result.refcode || ''}" target="_blank">
  <img src="https://cdn.discordapp.com/attachments/458184590087946240/463120976708894737/impleum_banner_468x60.gif" />
</a>
          `;
          this._elements.referal.classList.remove('cc-exchange--hide');

        })

      }
    });


    if(this._elements.cmc){
      this._fetchCMC().then(res => {
        if(res.data){
          
          cmc.amount.value = res.data.quotes['USD'].price;
          cmc.change.value = res.data.quotes['USD'].percent_change_24h;

          if( isNaN( parseFloat(cmc.change.value)) ) return 

          this._elements.ccArrow.classList.add( parseFloat(cmc.change.value) > 0 ? 'cc-arrow--up' : 'cc-arrow--down');

          var img = new Image();   // Create new img element

          img.onload = () => {
            this._elements.cmc.style.display = 'block';
            // execute drawImage statements here
            PromiseUtils.wait(400).then( _ => {
              this._elements.cmc.style.opacity = '1';
            });

            this._elements.cmcGraph.appendChild(img);

          };

          img.src = 'https://s2.coinmarketcap.com/generated/sparklines/web/7d/usd/1.png'; // Set source path
        
        }
      }, _ => {
        
      })

    }


    if( this._elements.referalBtn )
      this._elements.referalBtn.addEventListener('click', () =>
        this._booted.then( _ => {
          copyToClipboard(this._model.referal.link.value)
        })
      );


    if (this._elements.referalEmbedCopyBtn )
      this._elements.referalEmbedCopyBtn.addEventListener('click', () =>
        this._booted.then( _ => {
          document.querySelector('#embedBoxI').select();
          document.execCommand('copy');
        })
      );



  }

 /**
   * Returns a promise with Code of Referal.
   *
   * @return {Promise} Promise for the storage success.
   */
  _makeInvite(wallet){
    return (async (wallet) => {

      try{

        let {result} = await PromiseUtils.get(url, {
          "method": "make_invite",
          "params": [wallet],
          "jsonrpc": "2.0",
          "id": 0,
        }, 2);


        return result

      } catch (error) {

        this._snackbar && this._snackbar.show({
          message: 'Connection with server has been lost.',
        });
      }

    })(wallet)
  }
 /**
   * Returns a promise with Bitcoin data from CoinMarketCap.
   *
   * @return {Promise} Promise for the storage success.
   */
  _fetchCMC(){
    return PromiseUtils.get('https://widgets.coinmarketcap.com/v2/ticker/1/', null, 2, 'GET');
    // body should by null
  }

  /**
   * Returns a promise for store the history to IndexedDB.
   * Also updates the member variables.
   *
   * @return {Promise} Promise for the storage success.
   */
  _storeHistory(history) {
    if(history){
      return Db.saveToStore('history', history);
    }
  }


  /**
   * Returns a promise for loading the history from IndexedDB. Also updates the
   * member variables.
   *
   * @return {Promise.<Object>} Promise with the loaded price.
   */
  _loadHistory() {
    return Db.loadFromStore('history').then((value) => {
      this._renderHistory(value);
      return value;
    });
  }

  _fetchHistory(wallet){
    return (async (wallet) => {

      try{

        let {result} = await PromiseUtils.get(url, {
          "method": "history",
          "params": [wallet],
          "jsonrpc": "2.0",
          "id": 0,
        }, 2);
        
        if(result && result.history){
          Db.saveToStore('history', result);
          this._renderHistory(result);
        }

      } catch (error) {

        this._snackbar && this._snackbar.show({
          message: 'Connection with server has been lost.',
        });
      }

    })(wallet)
  }

  
  _getTime(time){
    let outputPublishTime = ''; 
    
    const getFullTimeDigits = (Minutes) => {
      return (('' + Minutes).length == 1) ? ('0' + Minutes) : Minutes
    }

    outputPublishTime = `${time.getHours()}:${getFullTimeDigits(time.getMinutes())} ${time.getDate()}.${getFullTimeDigits(time.getMonth())}.${time.getFullYear().toString().substr(-2, 2)}`;
    return outputPublishTime
  }

  _renderHistory(value){

    
    let options = {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute:  'numeric'};
    
    if(Object.entries(value.history).length === 0){
      this._elements.historyBlock.classList.add('cc-exchange--hide');
    }else{
      this._elements.historyBlock.classList.remove('cc-exchange--hide');
    }
    
    let output = '';

    Object.entries(value.history).map(([btc_tx, info]) => {
     // console.log(info)

      let date = (new Date(info.timestamp*1000)).toLocaleDateString(undefined, options);
      output += `
      <div class="cc-history-block">
        <div class="cc-history-top">
          <span class="cc-history-time" >${date}</span>
          <img class="cc-history-arrow" src="${outTx}"/>
          <span class="cc-history-amount" >${info.btc_amount} BTC</span>
        </div>
        <a target="_blank" href="https://blockchain.info/tx/${btc_tx}" class="cc-history-wallet">
          ${btc_tx}
        </a>

        <hr/> 

        <div class="cc-history-top">
          <span class="cc-history-time">${date} </span>
          <img class="cc-history-arrow" src="${inTx}"/>
          <span class="cc-history-amount" >${info.imp_amount} IMP</span>
        </div>
        <a target="_blank" href="https://explorer.impleum.com/tx/${info.imp_tx}" class="cc-history-wallet">
          ${info.imp_tx ? info.imp_tx : ''}
        </a>

      </div>
    `;

      
    })
    this._elements.history.innerHTML = output;

  }

  _drawQR(){

      this._elements.qrBlock.classList.remove('cc-exchange--hide');
      this._elements.depositBlock.classList.remove('cc-exchange--hide');

      QRCode.toCanvas(this._elements.qrcode, this._model.qr.bitcoin.value,{
        width: 110,
        margin: 1,
        
      }, function (error) {
        if (error) console.error(error)
        //console.log('success!');
      })
  }

  /**
   * Returns a promise for the current price.
   *
   * @return {Promise.<Object>} The constructed promise.
   */
  _fetchPrice() {

    let getPrice = PromiseUtils.get(url, {
      "method": "price",
      "params": [],
      "jsonrpc": "2.0",
      "id": 0,
    }).then(v=>v,_=>{
      this._snackbar && this._snackbar.show({
        message: 'Connection with server has been lost.',
      });
    });


    getPrice.then(this._handlePriceTable.bind(this))
    getPrice.then(this._handleResidue.bind(this))

    return getPrice

  }  

  _registerWallet(wallet){
    return (async (wallet) => {
      try{

        let invite = null;
        if (window.location) {
            var searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('invite')) {
              invite = searchParams.get('invite');
          }
        }

        let {result} = await PromiseUtils.get(url, {
          "method": "register",
          "params": invite ? [wallet.trim(), invite.trim()] : [wallet.trim()],
          "jsonrpc": "2.0",
          "id": 0,
        }, 2);

        if(result.btc_address){
          Db.saveToStore('wallets', result);
          this._model.register.address.value = result
          
          this._elements.registerBtn.setAttribute('disabled', true)

          this._elements.registerBtn.classList.add('cc-btn--hidden');
          this._elements.editBtn.classList.remove('cc-btn--hidden');
          this._elements.registerBox.setAttribute('disabled', true);

          this._walletRegister = true;

          let searchParams = new URLSearchParams(window.location.search);
          searchParams.set('address', result.imp_address)
          history.pushState(null, null,  window.location.origin + '?' + searchParams);

          this._fetchHistory(result.imp_address);
        }

        if(result.error){
          this._validateAddress(true);
        }
    
        return result;

      } catch (error) {

        this._snackbar && this._snackbar.show({
          message: 'Connection with server has been lost.',
        });
      }
    })(wallet)
  }
  
  /**
  /**
   * Returns a promise for the current wallet.
   *
   * @return {Promise.<Object>} The constructed promise.
   */
  _fetchWallet() {

    let getPrice = PromiseUtils.get(url, {
      "method": "price",
      "params": [],
      "jsonrpc": "2.0",
      "id": 0,
    }).then(v=>v,_=>{
      this._snackbar && this._snackbar.show({
          message: 'Connection with server has been lost.',
        });
    });

    getPrice.then(this._handlePriceTable.bind(this))
    getPrice.then(this._handleResidue.bind(this))

    return getPrice

  }  /**
   * Returns a promise for the current price.
   *
   * @return {Promise.<Object>} The constructed promise.
   */
  _fetchPrice() {

    let getPrice = PromiseUtils.get(url, {
      "method": "price",
      "params": [],
      "jsonrpc": "2.0",
      "id": 0,
    }).then(v=>v,_=>{
      this._snackbar && this._snackbar.show({
        message: 'Connection with server has been lost.',
      });
    });

    getPrice.then(this._handlePriceTable.bind(this))
    getPrice.then(this._handleResidue.bind(this))

    return getPrice

  }

  /**
   * Returns a promise for storing the price to IndexedDB.
   * Also updates the member variables.
   *
   * @return {Promise} Promise for the storage success.
   */
  _storePrice(price) {
    if(price && price.result){
      return Db.saveToStore('price', price);
    }
  }

    /**
   * Hide the loading screen, once the application is done booting.
   */
  _hideLoadingScreen() {
    document.body.classList.add('cc-app--booted');
    this._screens.loading.classList.add('cc-loading--hidden');
    this._screens.loading.setAttribute('aria-hidden', true);
    document.removeEventListener('click', this.loadingClickHandler);
  }

    /**
   * Returns a promise for loading the price from IndexedDB. Also updates the
   * member variables.
   *
   * @return {Promise.<Object>} Promise with the loaded price.
   */
  _loadPrice() {
    return Db.loadFromStore('price').then((value) => {
      this._handlePriceTable.call(this, value);
      this._handleResidue.call(this, value);
      return value;
    });
  }

    /**
   * Returns a promise for loading the price from IndexedDB. Also updates the
   * member variables.
   *
   * @return {Promise.<Object>} Promise with the loaded price.
   */
  _loadWallet() {
    return Db.loadFromStore('wallets')
  }

 /**
   * Validate the provided address.
   * 
   */
  _validateAddress(invalid = false){
    const input = this._registerBox;

    const isEmpty = input.value === '' && input.validity &&
        input.validity.valid;

    if ((!isEmpty && !input.value.startsWith('i')) || invalid ) {
      this._validIMPAddress = false;
      
      this._register.classList.add('cc-block--invalid');
      input.classList.add('cc-input--invalid');
      this._elements.registerError.setAttribute('aria-hidden', false);
    } else {
      this._validIMPAddress = true;

      this._register.classList.remove('cc-block--invalid');
      input.classList.remove('cc-input--invalid');
      this._elements.registerError.setAttribute('aria-hidden', true);

    }
  }

  /**
   * Validate the provided input field.
   * @param {string}.
   */
  _validateInput(type) {
    let input = null, block = null, otherBlock = null, min = 0, message = '';


    // bad design Todo: improve interface if currency number increase 
    if (type === 'amountIMP') {
      input = this._calcIMPBox;
      block = this._calcIMP;
      otherBlock = this._calcBTC;
      min = 1.28;
      message = 'Please enter a valid number, minimum is 1.28 IMP'
    } else {
      input = this._calcBTCBox;
      block = this._calcBTC;
      otherBlock = this._calcIMP;
      min = 0.0001;
      message = 'Please enter a valid number, minimum is 0.0001 BTC'
    }



    const isEmpty = input.value === '' && input.validity &&
        input.validity.valid;

    if (isEmpty || isNaN(parseFloat(input.value)) || parseFloat(input.value) < min) {
      document.querySelector('#calc').classList.add('cc-block--invalid');
      document.querySelector('.cc-input__error-message__calc').textContent = message;
      block.classList.add('cc-input--invalid');
      this._elements.calcError.setAttribute('aria-hidden', false);
      otherBlock.classList.remove('cc-input--invalid');
    } else {
      document.querySelector('#calc').classList.remove('cc-block--invalid');
      block.classList.remove('cc-input--invalid');
      otherBlock.classList.remove('cc-input--invalid');
      this._elements.calcError.setAttribute('aria-hidden', true);
     
    }
  }

    /**
   * Converts an amount between currencies.
   * @param {number} value The amount to convert.
   * @param {string} fromCur The 3-letter code of the currency to convert from.
   * @param {string} toCur The 3-letter code of the currency to convert to.
   * @return {number} The converted amount.
   */
  _convertValue(value, fromCur, toCur) {
    return (async (value, fromCur, toCur) => {
      let conversion = null;
      value = value || 0;

      try {

        let {result} = await PromiseUtils.get(url, {
          "method": "calc",
          "params": [fromCur, value],
          "jsonrpc": "2.0",
          "id": 0,
        }, 0);
        return result[`${toCur}_amount`];

      } catch (error) {

        this._snackbar && this._snackbar.show({
          message: 'Connection with server has been lost.',
        });
      }

    })(value, fromCur, toCur)
  }

  _handleResidue({result}){
    let { residue } = this._model;

    if(!result) return

    residue.amount.value = result.next.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 8});
  }

  _handlePriceTable({result}){
    let { price } = this._model;

    if(!result) return
    // record if current row was
    let isCurrentWas = false

    for (let row of ['first', 'second', 'third', 'fourth', 'fifth']) {
      for (let column of ['BTC', 'IMP', 'Discount']) {

          // css stuff
          if(column == "BTC"){

            // remove all classes 
            price[`${row}${column}`]._bound[0].parentNode.parentNode.classList.remove("cc-prices-table__row--past","cc-prices-table__row--current",
            "cc-prices-table__row--future")

            // set proper css class 
            if(this.priceTable[`${row}${column}`] == result.price ){
              price[`${row}${column}`]._bound[0].parentNode.parentNode.classList.add("cc-prices-table__row--current");
              isCurrentWas = true;
            }else{
              isCurrentWas ? 
              price[`${row}${column}`]._bound[0].parentNode.parentNode.classList.add("cc-prices-table__row--future")
              :
              price[`${row}${column}`]._bound[0].parentNode.parentNode.classList.add("cc-prices-table__row--past")
            }
          }
          
          // applying actual values
          price[`${row}${column}`].value = this.priceTable[`${row}${column}`].toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 8})
      }
    }
  }


}


let app = new App();
window.app = app;