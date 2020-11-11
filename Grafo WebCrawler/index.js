#!/usr/bin/env node

const engine = require('./engine');
const events = require('events');
const yargs = require('yargs');
const colors = require('colors');
const sqlite3 = require('sqlite3');
const fs = require('fs');

const argv = yargs
  .command('database', 'Caminho completo para o arquivo de banco de dados (Sqlite3).', {
    'database': {
      description: 'Caminho completo para o arquivo de banco de dados (Sqlite3).',
      type: 'string',
    }
  })
  .command('begin-vertex', 'Vértice (URL) por onde iniciará o mapeamento.', {
    'begin-vertex': {
      description: 'Vértice (URL) por onde iniciará o mapeamento.',
      type: 'string',
    }
  })
  .command('max-depth', 'Maior profundidade que o mapeamento deve chegar.', {
    'max-depth': {
      description: 'Maior profundidade que o mapeamento deve chegar.',
      type: 'number',
    }
  })
  .option('trace', {
    description: 'Ao definir essa flag o algoritmo exibirá os sites sendo mapeados em tempo real.',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .alias('trace', 'T')
  .argv;

(async () => {
  if (!argv['database']) {
    console.log('[' + 'FAILED'.red + '] Diretório de banco de dados inválido. Forneça um diretório absoluto e válido.');
    process.exit(1);
  }
  if (!argv['begin-vertex']) {
    console.log('[' + 'FAILED'.red + '] Você precisa especificar um vértice como ponto de partida.');
    process.exit(1);
  }
  if (!argv['max-depth']) {
    console.log('[' + 'FAILED'.red + '] A profundidade máxima da pesquisa deve ser especificada.');
    process.exit(1);
  }
  if (!fs.existsSync(argv['database'])) {
    console.log('[' + 'FAILED'.red + '] Falha ao se conectar com o banco de dados. O arquivo fornecido não existe.');
    process.exit(1);
  }

  console.log('[' + 'AGUARDE'.yellow + '] O algoritmo iniciará em breve. O mapeamento dos sites será feito através do algoritmo Breadth-First Search (BFS).');
  console.log('[' + 'COPYRIGHT'.yellow + '] Desenvolvido por estudantes de Eng. de Software da UPE - Garanhuns (Muryllo, Gustavo, Kelvin, Edgleyson, Thiago).\n');

  let db = new sqlite3.Database(argv['database']);

  //#region [ FUNÇÕES ADAPTADAS DO SQLITE ]

  /**Recupera todas as linhas encontradas referentes à consulta executada.
   * @param {string} query Uma string de consulta, exemplo: SELECT * FROM users.
   * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
   */
  async function sqlite_fetch_rows(query, params) {
    return new Promise((resolve, _reject) => {
      try {
        db.all(query, params, (_err, rows) => { resolve(rows); });
      } catch (e) { resolve(null); }
    });
  }

  //#endregion
  
  //await sqlite_query_exec(`BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS "websites" ( "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, "site_url" TEXT NOT NULL, "site_title"	TEXT NOT NULL, "site_description"	TEXT NOT NULL ); COMMIT;`, []);
  let sites = (await sqlite_fetch_rows(`SELECT site_url FROM websites;`, []));
  if (sites){
    let buffer = {};
    for (let k = 0; k < sites.length; k++){
      buffer[sites[k].site_url] = true;
    }
    sites = buffer;
  } else {
    sites = {};
  }
  let event = new events.EventEmitter();
  event.on('vertices', async (vertex) => {
    db.run(`INSERT INTO websites (site_url, site_title, site_description) VALUES (?, ?, ?);`, [vertex.Uri, vertex.Title, vertex.Description], (_this, err) => {
      if (err)
        console.log('[' + 'ERROR'.red + '] Erro ao inserir um website no banco de dados.');
    })
    if (argv['trace'] == true)
      console.log('[' + 'MAPPED'.green + '] [' + 'Depth: '.red + String(vertex.Depth).red + '] Title: ' + String(vertex.Title).yellow);
  });

  event.on('timeout', () => {
    if (argv['trace'] == true)
      console.log('[' + 'TIMEOUT'.red + '] Tempo limite atingido. Falha ao percorrer um vértice.');
  });

  await engine.GrafoWebCrawler(argv['begin-vertex'], Number(argv['max-depth']), event, sites);
})();



