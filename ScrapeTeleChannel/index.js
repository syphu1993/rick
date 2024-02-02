import {TelegramClient, Api} from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import input from "input";
import Binance from "node-binance-api";
import fetch from "node-fetch";


// config profile
const apiId = 2447076;
const apiHash = "211fcc5acd96c500fb716f57cb943914";
const phone = "+84373306101";
const myIdChat = '1426449329';
const tokenBotTele = 'bot6084184760:AAGlP7Fk0LfSclISZG20sfQjhZnxCDjfbKI';
const apiKeyBinance = 'zkCvC2tu6YTHwNdV2MN5Hxqo64B0FvjFgcdh32cWvBy8XfPXjA7fSf8CsutNgASU';
const apiSecretBinance = 'IgJRyFF8NqKFlRWckNxPiKPhAFvopi5dxpI8Da39nT3tOxN9He4BFd5cqWwGWGLA';
const idChannel = {
  theBull: 'thebull_crypto',
  test1: 'ph26121993',
  test2: 'lethile2001'
};

const binance = new Binance().options({
  APIKEY: apiKeyBinance,
  APISECRET: apiSecretBinance
});


let allCoinMap = {}
let exchangePairs = {};

// đòn bẩy
const leverage = 20

// usdt 1 lệnh thực
const valueUSDT = 1.5

// usdt sau đòn bẩy
const valueLeverageUSDT = valueUSDT*leverage

const TYPE_MARGIN = {
  ISOLATED: 'ISOLATED',
  CROSS: 'CROSS'
}

// settup đòn bẩy, type margin cho tất cả coin
async function setupInforAllCoin() {
  try {
    const allCoin =   await binance.futuresPrices()
    const arrayCoin = Object.keys(allCoin);
    arrayCoin.forEach(async (item) => {
        // cài đòn bẩy
        const lev = await binance.futuresLeverage( item, leverage )
        // cài type margin
        const type = await binance.futuresMarginType( item, TYPE_MARGIN.ISOLATED )
      } )
    return true
  } catch (error){
    console.log(error);
    return false
  }
}

const res1 = await setupInforAllCoin()
console.log('Cài đặt đòn bẩy, loại margin ............', res1);

// Lấy giá trị thập phân khối lượng mua bán coin
async function syncPairInfo() {
  try {
    const pairs = await binance.futuresExchangeInfo();
    if (!pairs.symbols) {
    return;
    }
    pairs.symbols.forEach(pair => {
    const lotSize = pair.filters.find(f => f.filterType === 'LOT_SIZE');
    if (lotSize) {
      exchangePairs[pair.symbol] = 1/parseFloat(lotSize.stepSize);
    }
    
    });
    return true
  } catch (error) {
    console.log(error);
    return false
  }
 }

const res2 = await syncPairInfo() 
console.log('Cài đặt step size ............', res2);
console.log(exchangePairs);


// lấy giá all coin
async function setupStart() {
  try {
    const allCoin =   await binance.futuresPrices()
    allCoinMap = allCoin
    return true
  } catch (error) {
    console.log(error);
    return false
  }
}

const res3 = await setupStart()
console.log('Finish', res3);



// real time data
(async () => {
        console.log("Loading interactive example...");
        const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.start({
            phoneNumber: async () => phone,
            password: async () => await input.text("Please enter your password: "),
            phoneCode: async () =>
                await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });
        console.log("You should now be connected.");
        client.session.save(); // Save the session to avoid logging in again

        async function eventPrint(event) {
            const message = event.message;
            const text = message.text;
            if(text) {
              console.log(text);
              handleTextDataTele(text);
            }
        }

        const chatId = idChannel.test1;
        client.addEventHandler(eventPrint, new NewMessage({ chats: [chatId] }));
        // client.addEventHandler(eventPrint, new EditedMessage({ chats: [chatId] }));
  })();





// handle message tele
function handleTextDataTele(text) {
  if (
      (text.toLowerCase().includes('buy') 
      || text.toLowerCase().includes('buying')
      || text.toLowerCase().includes('pump')
      || text.toLowerCase().includes('breaking out')) 
      && 
      (text.includes('$')||text.includes('#'))
      ) { 
          let nameCoin = getNameCoinToMessageTele(text);
          let messageForm = `🟢🟢 BOT TRADE OPENED 🟢🟢 ✈️ LONG ${nameCoin} 20X▶️ </br> ENTRY PRICE: 0.69461⬆️ TARGET: 0.7009⬇️ STOPLOSS: 0.6911`
          sendMessageToBotTele(messageForm);
      }
}

// bot send note to user
function sendMessageToBotTele(nameCoin) {
  (async () => {
    let url = `https://api.telegram.org/${tokenBotTele}/sendMessage?chat_id=${myIdChat}&text=${nameCoin}`;
    await fetch(url);
  })();
}

// handle to name coin
function getNameCoinToMessageTele(msg) {
  let nameCoin = '';
  if (msg.includes('#')) {
    let string1 =  msg.split('#')[1];
    nameCoin = string1.split(' ')[0];
  } else if (msg.includes('$')) {
    let string1 =  msg.split('$')[1];
    nameCoin = string1.split(' ')[0];
  }
  return nameCoin;
}



// call binance
async function callBinance(nameCoin) {

  let valueCoin = parseFloat(allCoinMap[nameCoin])
  let stepSize = exchangePairs[nameCoin]
  

  // set khối lượng coin mua
  let amount = Math.round(valueLeverageUSDT/valueCoin * stepSize) / stepSize
  console.log(amount);
  // mua bán limit
  // const res = await binance.futuresBuy( 'LINKUSDT', amount, 12.00)

  // mua ban take price market
  const res = await binance.futuresMarketBuy( nameCoin, amount)
  console.log(res);
  return res
}


const res = await callBinance('ALTUSDT')







// xem số dư tài khoản future
// const inforAccount = await binance.futuresBalance()
// console.log(inforAccount);
// const inforUSD = inforAccount.find((item) => item.asset === 'USDT');
// if (inforAccount) {
//   let valueUSDT = inforUSD.availableBalance
//   console.log(valueUSDT);
// }

