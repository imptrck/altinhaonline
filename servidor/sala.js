// Relay de salas da Altinha. Sem dependencia nenhuma: WebSocket na unha.
// O servidor nao entende o jogo — ele repassa mensagens e responde ping.
// A unica coisa que ele decide e a HORA DE COMECAR, porque precisa de um
// relogio unico pros dois lados concordarem em que batida estao.
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORTA = process.env.PORTA || 8310;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const salas = new Map();

/* ---------- moldura WebSocket ---------- */

function enviar(sock, texto) {
  const dados = Buffer.from(texto, 'utf8');
  const n = dados.length;
  let cab;
  if (n < 126) { cab = Buffer.alloc(2); cab[1] = n; }
  else if (n < 65536) { cab = Buffer.alloc(4); cab[1] = 126; cab.writeUInt16BE(n, 2); }
  else { cab = Buffer.alloc(10); cab[1] = 127; cab.writeBigUInt64BE(BigInt(n), 2); }
  cab[0] = 0x81;                                   // FIN + texto
  try { sock.write(Buffer.concat([cab, dados])); } catch (e) {}
}

function fechar(sock) { try { sock.end(); } catch (e) {} }

// devolve mensagens completas e o que sobrou do buffer
function lerMolduras(buf, aoReceber, sock) {
  while (buf.length >= 2) {
    const op = buf[0] & 0x0f, temMasc = (buf[1] & 0x80) !== 0;
    let n = buf[1] & 0x7f, p = 2;
    if (n === 126) { if (buf.length < 4) break; n = buf.readUInt16BE(2); p = 4; }
    else if (n === 127) { if (buf.length < 10) break; n = Number(buf.readBigUInt64BE(2)); p = 10; }
    const masc = temMasc ? 4 : 0;
    if (buf.length < p + masc + n) break;
    const chave = temMasc ? buf.slice(p, p + 4) : null;
    const carga = buf.slice(p + masc, p + masc + n);
    if (chave) for (let i = 0; i < carga.length; i++) carga[i] ^= chave[i & 3];
    buf = buf.slice(p + masc + n);
    if (op === 8) { fechar(sock); return buf; }     // close
    if (op === 9) { enviar(sock, ''); continue; }   // ping (respondemos texto vazio)
    if (op === 1) aoReceber(carga.toString('utf8'));
  }
  return buf;
}

/* ---------- salas ---------- */

function sair(cli) {
  const s = salas.get(cli.sala);
  if (!s) return;
  s.clientes = s.clientes.filter(c => c !== cli);
  s.clientes.forEach(c => enviar(c.sock, JSON.stringify({ t: 'saiu' })));
  if (!s.clientes.length) salas.delete(cli.sala);
}

function tratar(cli, txt) {
  let m; try { m = JSON.parse(txt); } catch (e) { return; }

  if (m.t === 'ping') {                       // sincronismo de relogio
    return enviar(cli.sock, JSON.stringify({ t: 'pong', c: m.c, s: Date.now() }));
  }

  if (m.t === 'entrar') {
    const cod = String(m.sala || '').toUpperCase().slice(0, 8);
    const senha = String(m.senha || '');
    if (!cod) return enviar(cli.sock, JSON.stringify({ t: 'erro', msg: 'sala sem nome' }));
    let s = salas.get(cod);
    if (!s) { s = { senha: senha, clientes: [], seed: (Math.random() * 1e9) | 0 }; salas.set(cod, s); }
    if (s.senha !== senha) return enviar(cli.sock, JSON.stringify({ t: 'erro', msg: 'senha errada' }));
    if (s.clientes.length >= 2) return enviar(cli.sock, JSON.stringify({ t: 'erro', msg: 'sala cheia' }));
    cli.sala = cod;
    cli.quem = s.clientes.length;             // 0 = anfitriao
    s.clientes.push(cli);
    s.clientes.forEach(c => enviar(c.sock, JSON.stringify({
      t: 'sala', quem: c.quem, gente: s.clientes.length, seed: s.seed, cod: cod
    })));
    return;
  }

  const s = salas.get(cli.sala);
  if (!s) return;

  if (m.t === 'comecar' && cli.quem === 0) {  // so o anfitriao manda comecar
    const t0 = Date.now() + 2500;             // hora do beat 0, no relogio do servidor
    s.clientes.forEach(c => enviar(c.sock, JSON.stringify({ t: 'comecar', t0: t0, seed: s.seed })));
    return;
  }

  // qualquer outra coisa e repassada pro parceiro, sem o servidor entender
  s.clientes.forEach(c => { if (c !== cli) enviar(c.sock, txt); });
}

/* ---------- servidor ---------- */

const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('altinha relay ok — salas: ' + salas.size + '\n');
});

srv.on('upgrade', (req, sock) => {
  const chave = req.headers['sec-websocket-key'];
  if (!chave) return sock.destroy();
  const aceite = crypto.createHash('sha1').update(chave + GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\n'
           + 'Connection: Upgrade\r\nSec-WebSocket-Accept: ' + aceite + '\r\n\r\n');
  sock.setNoDelay(true);
  const cli = { sock: sock, sala: null, quem: 0 };
  let buf = Buffer.alloc(0);
  sock.on('data', d => { buf = lerMolduras(Buffer.concat([buf, d]), t => tratar(cli, t), sock); });
  sock.on('close', () => sair(cli));
  sock.on('error', () => sair(cli));
});

srv.listen(PORTA, () => console.log('relay da altinha na porta ' + PORTA));
