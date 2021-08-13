'use strict';

const bitcoin = require('bitcoin');

let Regex = require('regex'),
  config = require('config'),
  spamchannels = config.get('moderation').botspamchannels;
let walletConfig = config.get('bte').config;
let paytxfee = config.get('bte').paytxfee;
const bte = new bitcoin.Client(walletConfig);

exports.commands = ['tipbte'];
exports.tipbte = {
  usage: '<subcommand>',
  description:
    '__**Bitweb (BTE) Tipper**__\nTransaction Fees: **' + paytxfee + '**\n    **!tipbte** : Displays This Message\n    **!tipbte balance** : get your balance\n    **!tipbte deposit** : get address for your deposits\n    **!tipbte withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tipbte <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tipbte private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    has a default txfee of ' + paytxfee,
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsg =
        '__**Bitweb (BTE) Tipper**__\nTransaction Fees: **' + paytxfee + '**\n    **!tipbte** : Displays This Message\n    **!tipbte price** : get bitweb price\n    **!tipbte balance** : get your balance\n    **!tipbte deposit** : get address for your deposits\n    **!tipbte withdraw1 <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tipbte <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tipbte private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    **<> : Replace with appropriate value.**',
      channelwarning = 'Please use <#bot-spam> or DMs to talk to bots.';
    switch (subcommand) {
      case 'help':
        privateorSpamChannel(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        doBalance(msg, tipper);
        break;
      case 'price':
        getPrice(msg, tipper);
        break;
      case 'deposit':
        privateorSpamChannel(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateorSpamChannel(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      default:
        doTip(bot, msg, tipper, words, helpmsg);
    }
  }
};
//--Market Cap--
function getPrice(message, tipper) {
  var getmarketdata = getbteprice()
  message.channel.send({ embed: {
    description: '**:bank::money_with_wings::moneybag:Bitweb (BTE) Price!:moneybag::money_with_wings::bank:**',
    color: 1363892,
    fields: [
      {
        name: 'Current BTE/BTC price:',
        value: '**'+ getmarketdata[0] + ' BTC' + '**',
        inline: false
      },
      {
        name: 'Current BTE/USD price:',
        value: '**'+'$'+ getmarketdata[1] + '**',
        inline: false
      }
    ]
  } });
}

function getbteprice(){
  var arrresult = new Array();
  arrresult = [];
  var coin_name = "bitweb";
  var coin_ticker = "bte"
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var xmlHttp1 = new XMLHttpRequest();
  var price1 = `https://api.coinpaprika.com/v1/ticker/${coin_ticker}-${coin_name}`;

  xmlHttp1.open( "GET", price1, false ); 
  xmlHttp1.send( null );
  var data1 = xmlHttp1.responseText;
  var jsonres1 = JSON.parse(data1);
  var checkprice1 = Object.keys(jsonres1).length;

  if (checkprice1>0){
     //arrresult[0] = eval("jsonres1."+ coin_name + ".btc;")
     //arrresult[1] = (parseFloat(jsonres1.bitcoin.usd)).toFixed(8);
      arrresult[0] = (parseFloat(jsonres1.price_btc)).toFixed(8);
      arrresult[1] = (parseFloat(jsonres1.price_usd)).toFixed(8);
  }

  return arrresult;
}
//--
function privateorSpamChannel(message, wrongchannelmsg, fn, args) {
  if (!inPrivateorSpamChannel(message)) {
    message.reply(wrongchannelmsg);
    return;
  }
  fn.apply(null, [message, ...args]);
}

function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}

function doBalance(message, tipper) {
  bte.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Bitweb (BTE) balance.').then(message => message.delete(10000));
    } else {
    message.channel.send({ embed: {
    description: '**:bank::money_with_wings::moneybag:Bitweb (BTE) Balance!:moneybag::money_with_wings::bank:**',
    color: 1363892,
    fields: [
      {
        name: '__User__',
        value: '<@' + message.author.id + '>',
        inline: false
      },
      {
        name: '__Balance__',
        value: '**' + balance.toString() + '**',
        inline: false
      }
    ]
  } });
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your Bitweb (BTE) deposit address.').then(message => message.delete(10000));
    } else {
    message.channel.send({ embed: {
    description: '**:bank::card_index::moneybag:Bitweb (BTE) Address!:moneybag::card_index::bank:**',
    color: 1363892,
    fields: [
      {
        name: '__User__',
        value: '<@' + message.author.id + '>',
        inline: false
      },
      {
        name: '__Address__',
        value: '**' + address + '**',
        inline: false
      }
    ]
  } });
    }
  });
}

function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    doHelp(message, helpmsg);
    return;
  }

  var address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply("I don't know how to withdraw that much Bitweb (BTE)...").then(message => message.delete(10000));
    return;
  }

  bte.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Bitweb (BTE) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Bitweb (BTE) for transaction fees!');
        return;
      }
      bte.sendFrom(tipper, address, Number(amount), function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(10000));
        } else {
        message.channel.send({embed:{
        description: '**:outbox_tray::money_with_wings::moneybag:Bitweb (BTE) Transaction Completed!:moneybag::money_with_wings::outbox_tray:**',
        color: 1363892,
        fields: [
          {
            name: '__Sender__',
            value: '<@' + message.author.id + '>',
            inline: true
          },
          {
            name: '__Receiver__',
            value: '**' + address + '**\n' + addyLink(address),
            inline: true
          },
          {
            name: '__txid__',
            value: '**' + txId + '**\n' + txLink(txId),
            inline: false
          },
          {
            name: '__Amount__',
            value: '**' + amount.toString() + '**',
            inline: true
          },
          {
            name: '__Fee__',
            value: '**' + paytxfee.toString() + '**',
            inline: true
          }
        ]
      }});
      }
    });
    }
  });
}

function doTip(bot, message, tipper, words, helpmsg) {
  if (words.length < 3 || !words) {
    doHelp(message, helpmsg);
    return;
  }
  var prv = false;
  var amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    message.reply("I don't know how to tip that much Bitweb (BTE)...").then(message => message.delete(10000));
    return;
  }

  bte.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Bitweb (BTE) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Bitweb (BTE) for transaction fees!');
        return;
      }

      if (!message.mentions.users.first()){
           message
            .reply('Sorry, I could not find a user in your tip...')
            .then(message => message.delete(10000));
            return;
          }
      if (message.mentions.users.first().id) {
        sendBTE(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
      } else {
        message.reply('Sorry, I could not find a user in your tip...').then(message => message.delete(10000));
      }
    }
  });
}

function sendBTE(bot, message, tipper, recipient, amount, privacyFlag) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(10000));
    } else {
          bte.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
              if (err) {
                message.reply(err.message).then(message => message.delete(10000));
              } else {
                if (privacyFlag) {
                  let userProfile = message.guild.members.find('id', recipient);
                  userProfile.user.send({ embed: {
                  description: '**:money_with_wings::moneybag:Bitweb (BTE) Transaction Completed!:moneybag::money_with_wings:**',
                  color: 1363892,
                  fields: [
                    {
                      name: '__Sender__',
                      value: 'Private Tipper',
                      inline: true
                    },
                    {
                      name: '__Receiver__',
                      value: '<@' + recipient + '>',
                      inline: true
                    },
                    {
                      name: '__txid__',
                      value: '**' + txId + '**\n' + txLink(txId),
                      inline: false
                    },
                    {
                      name: '__Amount__',
                      value: '**' + amount.toString() + '**',
                      inline: true
                    },
                    {
                      name: '__Fee__',
                      value: '**' + paytxfee.toString() + '**',
                      inline: true
                    }
                  ]
                } });
                message.author.send({ embed: {
                description: '**:money_with_wings::moneybag:Bitweb (BTE) Transaction Completed!:moneybag::money_with_wings:**',
                color: 1363892,
                fields: [
                  {
                    name: '__Sender__',
                    value: '<@' + message.author.id + '>',
                    inline: true
                  },
                  {
                    name: '__Receiver__',
                    value: '<@' + recipient + '>',
                    inline: true
                  },
                  {
                    name: '__txid__',
                    value: '**' + txId + '**\n' + txLink(txId),
                    inline: false
                  },
                  {
                    name: '__Amount__',
                    value: '**' + amount.toString() + '**',
                    inline: true
                  },
                  {
                    name: '__Fee__',
                    value: '**' + paytxfee.toString() + '**',
                    inline: true
                  }

                ]
              } });
                  if (
                    message.content.startsWith('!tipbte private ')
                  ) {
                    message.delete(1000); //Supposed to delete message
                  }
                } else {
                  message.channel.send({ embed: {
                  description: '**:money_with_wings::moneybag:Bitweb (BTE) Transaction Completed!:moneybag::money_with_wings:**',
                  color: 1363892,
                  fields: [
                    {
                      name: '__Sender__',
                      value: '<@' + message.author.id + '>',
                      inline: true
                    },
                    {
                      name: '__Receiver__',
                      value: '<@' + recipient + '>',
                      inline: true
                    },
                    {
                      name: '__txid__',
                      value: '**' + txId + '**\n' + txLink(txId),
                      inline: false
                    },
                    {
                      name: '__Amount__',
                      value: '**' + amount.toString() + '**',
                      inline: true
                    },
                    {
                      name: '__Fee__',
                      value: '**' + paytxfee.toString() + '**',
                      inline: true
                    }
                  ]
                } });
                }
              }
            });
    }
  });
}

function getAddress(userId, cb) {
  bte.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      bte.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateorSpamChannel(msg) {
  if (msg.channel.type == 'dm' || isSpam(msg)) {
    return true;
  } else {
    return false;
  }
}

function isSpam(msg) {
  return spamchannels.includes(msg.channel.id);
};


function getValidatedAmount(amount) {
  amount = amount.trim();
  if (amount.toLowerCase().endsWith('bte')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return 'https://explorer.bitwebcore.org/tx/' + txId;
}

function addyLink(address) {
  return 'https://explorer.bitwebcore.org/address/' + address;
}
