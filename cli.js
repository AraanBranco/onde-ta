#!/usr/bin/env node
'use strict';

var got = require('got');
var chalk = require('chalk');
var strl = require('string-length');
var repeat = require('repeating');
var meow = require('meow');
var storage = require('./storage');
var CODE_REGEX = /[a-z]{2}[0-9]{9}[a-z]{2}/ig;

var command;

var cli = meow({
  help: [
    'Usar',
    '  $ onde-ta RE108441783BR',
    '',
    '  Salvar encomendas e visualizar encomenda salva',
    '  $ onde-ta RE108441783BR --save batman',
    '  $ onde-ta batman',
    '',
    '  Remover encomendas',
    '  $ onde-ta --remove batman',
    '  $ onde-ta --clear',
    '',
    '  Listar encomendas',
    '  $ onde-ta --list',
    '',
    ' Opções',
    '  --save     Salva o código de uma encomenda com um nome',
    '  --remove   Remove a encomenda selecionada',
    '  --clear    Remove todas as encomendas salvas',
    '  --list     Lista todas as suas encomendas salvas com --save'
  ]
});

if (!CODE_REGEX.test(cli.input[0]) && cli.input[0]) {
  command = storage.get(cli.input[0]);
} else if (cli.input[0]) {
  command = cli.input[0];
} else if (cli.flags.clear) {
  storage.clear();
} else if (cli.flags.remove) {
  storage.del(cli.flags.remove);
} else if (cli.flags.list) {
  storage.list();
} else {
  cli.showHelp();
}

if (cli.flags.save) {
  storage.save(cli.flags.save, cli.input[0]);
}

function parse(data) {
  var longestLine = Math.max(strl(data.data), strl(data.local), strl(data.acao), strl(data.detalhes));

  // 14 is the size of the rest of the texts
  var bottomSize = longestLine + 14;
  var topSize = bottomSize - strl(data.data) - 2;

  var output = [
    chalk.yellow('┌ ') + chalk.bold(data.data) + ' ' + chalk.yellow(repeat('─', topSize)) + chalk.yellow('┐'),
    ' ⇢ Local:    ' + chalk.bold(data.local),
    ' ⇢ Ação:     ' + chalk.bold(data.acao),
    ' ⇢ Detalhes: ' + chalk.bold(data.detalhes),
    chalk.yellow('└') + chalk.yellow(repeat('─', bottomSize)) + chalk.yellow('┘')
  ];

  return console.log(output.join('\n'));
}

got('http://developers.agenciaideias.com.br/correios/rastreamento/json/' + command, {json: true})
  .then(function (response) {
    if (Array.isArray(response.body)) {
      response.body.forEach(function (data) {
        parse(data);
      });
    } else {
      console.log(chalk.red.bold('Houve algum erro, seu código está correto? ' + command));
    }
  })
  .catch(function () {
    console.log(chalk.red.bold('Houve algum erro, seu código está correto? ' + command));
    process.exit(1);
  });
