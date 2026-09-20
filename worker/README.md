# Relay da Altinha (Cloudflare Workers)

Repassa mensagens entre os dois jogadores de uma sala. **Não entende o jogo** —
só encaminha, responde `ping` pro sincronismo de relógio, e decide a hora de
começar (que precisa de um relógio único pros dois concordarem na batida).

Usa Durable Objects com **WebSocket Hibernation**: um objeto por sala, que pode
dormir com as conexões abertas sem contar duração. É o que mantém isso no plano
grátis (Durable Objects entraram no free tier em abril/2025).

## Subir

```bash
cd worker
npx wrangler login      # abre o navegador pra autenticar
npx wrangler deploy
```

No fim ele imprime algo como `https://altinha-relay.SEU-SUBDOMINIO.workers.dev`.
No jogo, em **online**, cole no campo *relay* trocando `https` por **`wss`**:

```
wss://altinha-relay.SEU-SUBDOMINIO.workers.dev
```

Fica salvo no navegador; só precisa fazer uma vez.

## Protocolo

| mensagem | direção | o que faz |
|---|---|---|
| `{t:'entrar', sala, senha}` | cliente → | entra; devolve `{t:'sala', quem, gente, seed}` |
| `{t:'ping', c}` | cliente → | devolve `{t:'pong', c, s}` — relógio comum |
| `{t:'comecar'}` | anfitrião → | difunde `{t:'comecar', t0, seed}` |
| `{t:'toque', beat, q, err, dx}` | cliente → | repassado pro parceiro |
| `{t:'falha', beat}` | cliente → | repassado pro parceiro |

`servidor/sala.js` na raiz do repo é o mesmo protocolo em Node, sem dependência
nenhuma, pra rodar local enquanto se desenvolve.
