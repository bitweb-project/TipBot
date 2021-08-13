'use strict';
let config = require('config');
let bteFee = config.get('bte').paytxfee;
let prefix = config.get('bot').prefix;
exports.commands = ['tiphelp'];
exports.tiphelp = {
  usage: '<subcommand>',
  description: 'This commands has been changed to currency specific commands!',
  process: function(bot, message) {
    message.author.send(
      '__**:bank: Coins :bank:**__\n' +
      '  **Bitweb (BTE) Tipper**\n    Transaction Fees: **' + bteFee + '**\n' +        
      '__**Commands**__\n' +
      '  **' + prefix + 'tipbte** : Displays This Message\n' +
      '  **' + prefix + 'tipbte price** : get bitweb price\n' +
      '  **' + prefix + 'tipbte balance** : get your balance\n' +
      '  **' + prefix + 'tipbte deposit** : get address for your deposits\n' +
      '  **' + prefix + 'tipbte withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n' +
      '  **' + prefix + 'tipbte <@user> <amount>** :mention a user with @ and then the amount to tip them\n' +
      '  **' + prefix + 'tipbte private <@user> <amount>** : put private before Mentioning a user to tip them privately\n'
    );
  }
};
