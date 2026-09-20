// Relay de salas da Altinha em Cloudflare Workers + Durable Objects.
// Mesmo protocolo do servidor local (servidor/sala.js), entao o cliente
// nao sabe nem precisa saber em qual dos dois esta falando.
//
// Usa a API de HIBERNACAO: o objeto pode dormir com os WebSockets abertos e
// nao conta duracao enquanto dorme. E o que mantem isso dentro do plano gratis.

export class Sala {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('altinha relay ok', { status: 200 });
    }
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    this.ctx.acceptWebSocket(servidor);
    servidor.serializeAttachment({ quem: null, entrou: false });
    return new Response(null, { status: 101, webSocket: cliente });
  }

  vivos() {
    return this.ctx.getWebSockets().filter(w => (w.deserializeAttachment() || {}).entrou);
  }

  async webSocketMessage(ws, txt) {
    let m;
    try { m = JSON.parse(txt); } catch (e) { return; }

    // sincronismo de relogio: responde antes de qualquer outra coisa
    if (m.t === 'ping') {
      return ws.send(JSON.stringify({ t: 'pong', c: m.c, s: Date.now() }));
    }

    const meu = ws.deserializeAttachment() || {};

    if (m.t === 'entrar') {
      const senha = String(m.senha || '');
      let guardada = await this.ctx.storage.get('senha');
      let seed = await this.ctx.storage.get('seed');
      if (guardada === undefined) {
        guardada = senha;
        seed = (Math.random() * 1e9) | 0;
        await this.ctx.storage.put({ senha: guardada, seed: seed });
      }
      if (guardada !== senha) {
        return ws.send(JSON.stringify({ t: 'erro', msg: 'senha errada' }));
      }
      const dentro = this.vivos();
      if (dentro.length >= 2) {
        return ws.send(JSON.stringify({ t: 'erro', msg: 'sala cheia' }));
      }
      const quem = dentro.some(w => (w.deserializeAttachment() || {}).quem === 0) ? 1 : 0;
      ws.serializeAttachment({ quem: quem, entrou: true });
      const agora = this.vivos();
      for (const w of agora) {
        const a = w.deserializeAttachment() || {};
        w.send(JSON.stringify({ t: 'sala', quem: a.quem, gente: agora.length, seed: seed }));
      }
      return;
    }

    if (!meu.entrou) return;

    if (m.t === 'comecar') {
      if (meu.quem !== 0) return;                  // visitante nao comeca, e nao repassa
      const t0 = Date.now() + 2500;                 // hora do beat 0, relogio do servidor
      const seed = await this.ctx.storage.get('seed');
      for (const w of this.vivos()) {
        w.send(JSON.stringify({ t: 'comecar', t0: t0, seed: seed }));
      }
      return;
    }

    // lista fechada: so mensagem de jogo atravessa. Repassar tudo deixava o
    // 'comecar' recusado do visitante chegar cru no outro lado, sem t0.
    if (m.t !== 'toque' && m.t !== 'falha') return;
    for (const w of this.vivos()) if (w !== ws) w.send(txt);
  }

  async webSocketClose(ws) {
    ws.serializeAttachment({ quem: null, entrou: false });
    for (const w of this.vivos()) w.send(JSON.stringify({ t: 'saiu' }));
  }

  async webSocketError(ws) {
    return this.webSocketClose(ws);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cod = (url.searchParams.get('sala') || '').toUpperCase().slice(0, 8);
    if (!cod) return new Response('falta ?sala=CODIGO', { status: 400 });
    const id = env.SALA.idFromName(cod);
    return env.SALA.get(id).fetch(req);
  },
};
