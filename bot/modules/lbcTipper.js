'use strict';

const bitcoin = require('bitcoin');

let Regex = require('regex'),
  config = require('config'),
  spamchannels = config.get('moderation').botspamchannels;
let walletConfig = config.get('lbc').config;
let paytxfee = config.get('lbc').paytxfee;
const lbc = new bitcoin.Client(walletConfig);

exports.commands = ['tiplbc'];
exports.tiplbc = {
  usage: '<subcommand>',
  description:
    '__**LBRY Credit (LBC) Tipper**__\nTransaction Fees: **' + paytxfee + '**\n    **!tiplbc** : Displays This Message\n    **!tiplbc balance** : get your balance\n    **!tiplbc deposit** : get address for your deposits\n    **!tiplbc withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tiplbc <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tiplbc private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    has a default txfee of ' + paytxfee,
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
        '__**LBRY Credit (LBC) Tipper**__\nTransaction Fees: **' + paytxfee + '**\n    **!tiplbc** : Displays This Message\n    **!tiplbc balance** : get your balance\n    **!tiplbc deposit** : get address for your deposits\n    **!tiplbc withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tiplbc <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tiplbc private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    **<> : Replace with appropriate value.**',
      channelwarning = 'Please use <#bot-spam> or DMs to talk to bots.';
    switch (subcommand) {
      case 'help':
        privateorSpamChannel(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        doBalance(msg, tipper);
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
  lbc.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting LBRY Credit (LBC) balance.').then(message => message.delete(10000));
    } else {
      const embedAddress = embed: {
      description: '**:bank::money_with_wings::moneybag:LBRY Credit (LBC) Balance!:moneybag::money_with_wings::bank:**',
      color: 1363892,
      fields: [
        {
          name: '__User__',
          value: '**' + message.author.username + '**',
          inline: true
        },
        {
          name: '__Balance__',
          value: balance,
          inline: true
        }
      ]
    };
    message.channel.send(embedAddress);
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your LBRY Credit (LBC) deposit address.').then(message => message.delete(10000));
    } else {
      const embedBalance = embed: {
      description: '**:bank::card_index::moneybag:LBRY Credit (LBC) Address!:moneybag::card_index::bank:**',
      color: 1363892,
      fields: [
        {
          name: '__User__',
          value: '**' + message.author.username + '**',
          inline: true
        },
        {
          name: '__Address__',
          value: '[' + address + '](https://explorer.lbry.io/address/' + address + ')',
          inline: true
        }
      ]
    };
    message.channel.send(embedBalance);
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
    message.reply("I don't know how to withdraw that much LBRY Credit (LBC)...").then(message => message.delete(10000));
    return;
  }

  lbc.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting LBRY Credit (LBC) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        msg.channel.send('Please leave atleast ' + paytxfee + ' LBRY Credit (LBC) for transaction fees!');
        return;
      }
      lbc.sendFrom(tipper, address, Number(amount), function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(10000));
        } else {
          const embedWithdraw = embed: {
          description: '**:outbox_tray::money_with_wings::moneybag:LBRY Credit (LBC) Transaction Completed!:moneybag::money_with_wings::outbox_tray:**',
          color: 1363892,
          fields: [
            {
              name: '__Withdrew__',
              value: '**' + amount + ' LBC**',
              inline: true
            },
            {
              name: '__Address__',
              value: '[' + address + '](https://explorer.lbry.io/address/' + address + ')',
              inline: true
            },
            {
              name: '__Fee__',
              value: '**' + paytxfee + '**',
              inline: true
            },
            {
              name: '__txid__',
              value: '(' + txid + ')[' + txLink(txid) + ']',
              inline: true
            }
          ]
        };
        message.channel.senembedWithdr);
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
    message.reply("I don't know how to tip that much LBRY Credit (LBC)...").then(message => message.delete(10000));
    return;
  }

  lbc.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting LBRY Credit (LBC) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        msg.channel.send('Please leave atleast ' + paytxfee + ' LBRY Credit (LBC) for transaction fees!');
        return;
      }

      if (!message.mentions.users.first()){
           message
            .reply('Sorry, I could not find a user in your tip...')
            .then(message => message.delete(10000));
            return;
          }
      if (message.mentions.users.first().id) {
        sendLBC(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
      } else {
        message.reply('Sorry, I could not find a user in your tip...').then(message => message.delete(10000));
      }
    }
  });
}

function sendLBC(bot, message, tipper, recipient, amount, privacyFlag) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(10000));
    } else {
          lbc.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
              if (err) {
                message.reply(err.message).then(message => message.delete(10000));
              } else {
                if (privacyFlag) {
                  let userProfile = message.guild.members.find('id', recipient);
                    const embedTipReciever = embed: {
                    title: '**:money_with_wings::moneybag:LBRY Credit (LBC) Transaction Completed!:moneybag::money_with_wings:**',
                    description: ':confetti_ball::heart_eyes::moneybag::money_with_wings::money_mouth: You got privately **Tipped  __' + amount + '__** :money_mouth: :money_with_wings::moneybag::heart_eyes::confetti_ball:',
                    color: 1363892,
                    fields: [
                      {
                        name: '__txid__',
                        value: '(' + txid + ')[' + txLink(txid) + ']',
                        inline: true
                      }
                    ]
                  };
                  userProfile.user.send(embedTipReciever);
                  const embedTipSender = embed: {
                  title: '**:money_with_wings::moneybag:LBRY Credit (LBC) Transaction Completed!:moneybag::money_with_wings:**',
                  description: ':confetti_ball::heart_eyes::moneybag::money_with_wings::money_mouth:<@' + msg.author.username + '> **Tipped  ' + amount + ' LBC** to <@' + recipient + '>:money_mouth: :money_with_wings::moneybag::heart_eyes::confetti_ball:',
                  color: 1363892,
                  fields: [
                    {
                      name: '__Fee__',
                      value: '**' + paytxfee + '**',
                      inline: true
                    },
                    {
                      name: '__txid__',
                      value: '(' + txid + ')[' + txLink(txid) + ']',
                      inline: true
                    }
                  ]
                };
                message.author.send(embedTipSender);
                  if (
                    message.content.startsWith('!tiplbc private ')
                  ) {
                    message.delete(1000); //Supposed to delete message
                  }
                } else {
                    const embedTip = embed: {
                    title: '**:money_with_wings::moneybag:LBRY Credit (LBC) Transaction Completed!:moneybag::money_with_wings:**',
                    description: ':confetti_ball::heart_eyes::moneybag::money_with_wings::money_mouth:<@' + msg.author.username + '> **Tipped  ' + amount + ' LBC** to <@' + recipient + '>:money_mouth: :money_with_wings::moneybag::heart_eyes::confetti_ball:',
                    color: 1363892,
                    fields: [
                      {
                        name: '__Fee__',
                        value: '**' + paytxfee + '**',
                        inline: true
                      },
                      {
                        name: '__txid__',
                        value: '(' + txid + ')[' + txLink(txid) + ']',
                        inline: true
                      }
                    ]
                  };
                  message.channel.send(embedTip);
                }
              }
            });
    }
  });
}

function getAddress(userId, cb) {
  lbc.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      lbc.getNewAddress(userId, function(err, address) {
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
  if (amount.toLowerCase().endsWith('lbc')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return 'https://explorer.lbry.io/tx/' + txId;
}