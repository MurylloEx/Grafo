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

  /**Responsável por executar as consultas na ordem correta.
   * @param {function} callback Callback assíncrono usado na serialização das consultas.
   */
  function sqlite_serialize(callback) {
    db.serialize(callback);
  }

  /**Retorna o número de linhas obtidas em uma consulta ao sqlite.
   * @param {any} result Valor retornado em uma das seguintes funções: sqlite_fetch_row, sqlite_fetch_rows.
   */
  function sqlite_num_rows(result) {
    if (typeof result === 'object') {
      if (Array.isArray(result)) {
        return result.length;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  }

  /**Recupera apenas a primeira linha que encontrar referente à consulta executada.
   * @param {string} query Uma string de consulta, exemplo: SELECT * FROM users.
   * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
   */
  async function sqlite_fetch_row(query, params) {
    return new Promise((resolve, _reject) => {
      try {
        db.get(query, params, (_err, row) => { resolve(row); });
      } catch (e) { resolve(null); }
    });
  }

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

  /**Função utilizada para executar um comando de inserção, alteração ou exclusão no banco de dados. Esta função não retorna nenhum valor, exceto um status booleano indicando se o comando foi bem-sucedido.
   * @param {string} query Uma string de consulta, exemplo: INSERT INTO users (name, email) VALUES ('muryllo', 'muryllo(a)gmail.com').
   * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
   */
  async function sqlite_query_exec(query, params) {
    return new Promise((resolve, _reject) => {
      try {
        db.prepare(query).run(params).finalize((err) => { resolve(!err); });
      } catch (e) { resolve(false); }
    });
  }

  /**Retorna o número de linhas alteradas, inseridas ou removidas na última operação INSERT, UPDATE ou DELETE.
   */
  async function sqlite_affected_rows() {
    return new Promise(async (resolve, _reject) => {
      resolve(
        (await sqlite_fetch_row(`SELECT CHANGES() AS AffectedRows;`, [])).AffectedRows
      );
    });
  }

  /**Retorna o id da última linha inserida no banco de dados. */
  async function sqlite_last_insert_row_id() {
    return new Promise(async (resolve, _reject) => {
      resolve(
        (await sqlite_fetch_row(`SELECT LAST_INSERT_ROWID() AS RowId;`, [])).RowId
      );
    });
  }

  //#endregion

  db.exec(`BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS "websites" ( "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, "site_url" TEXT NOT NULL, "site_title"	TEXT NOT NULL, "site_description"	TEXT NOT NULL ); COMMIT;`);
  let event = new events.EventEmitter();
  event.on('vertices', (vertex) => {
    try {
      db.run(`INSERT INTO websites (site_url, site_title, site_description) VALUES (?, ?, ?);`, [vertex.Uri, vertex.Title, vertex.Description]);
    } catch (e) {
      console.log('[' + 'ERROR'.red + '] Erro ao inserir um website no banco de dados.');
    }
    if (argv['trace'] == true)
      console.log('[' + 'MAPPED'.green + '] [' + 'Depth: '.red + String(vertex.Depth).red + '] Title: ' + String(vertex.Title).yellow);
  });
  event.on('timeout', () => {
    if (argv['trace'] == true)
      console.log('[' + 'TIMEOUT'.red + '] Tempo limite atingido. Falha ao percorrer um vértice.');
  });
  await engine.GrafoWebCrawler(argv['begin-vertex'], Number(argv['max-depth']), event);
})();



