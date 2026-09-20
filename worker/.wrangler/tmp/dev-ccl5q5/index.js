var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var Sala = class {
  static {
    __name(this, "Sala");
  }
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") {
      return new Response("altinha relay ok", { status: 200 });
    }
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    this.ctx.acceptWebSocket(servidor);
    servidor.serializeAttachment({ quem: null, entrou: false });
    return new Response(null, { status: 101, webSocket: cliente });
  }
  vivos() {
    return this.ctx.getWebSockets().filter((w) => (w.deserializeAttachment() || {}).entrou);
  }
  async webSocketMessage(ws, txt) {
    let m;
    try {
      m = JSON.parse(txt);
    } catch (e) {
      return;
    }
    if (m.t === "ping") {
      return ws.send(JSON.stringify({ t: "pong", c: m.c, s: Date.now() }));
    }
    const meu = ws.deserializeAttachment() || {};
    if (m.t === "entrar") {
      const senha = String(m.senha || "");
      let guardada = await this.ctx.storage.get("senha");
      let seed = await this.ctx.storage.get("seed");
      if (guardada === void 0) {
        guardada = senha;
        seed = Math.random() * 1e9 | 0;
        await this.ctx.storage.put({ senha: guardada, seed });
      }
      if (guardada !== senha) {
        return ws.send(JSON.stringify({ t: "erro", msg: "senha errada" }));
      }
      const dentro = this.vivos();
      if (dentro.length >= 2) {
        return ws.send(JSON.stringify({ t: "erro", msg: "sala cheia" }));
      }
      const quem = dentro.some((w) => (w.deserializeAttachment() || {}).quem === 0) ? 1 : 0;
      ws.serializeAttachment({ quem, entrou: true });
      const agora = this.vivos();
      for (const w of agora) {
        const a = w.deserializeAttachment() || {};
        w.send(JSON.stringify({ t: "sala", quem: a.quem, gente: agora.length, seed }));
      }
      return;
    }
    if (!meu.entrou) return;
    if (m.t === "comecar") {
      if (meu.quem !== 0) return;
      const t0 = Date.now() + 2500;
      const seed = await this.ctx.storage.get("seed");
      for (const w of this.vivos()) {
        w.send(JSON.stringify({ t: "comecar", t0, seed }));
      }
      return;
    }
    if (m.t !== "toque" && m.t !== "falha") return;
    for (const w of this.vivos()) if (w !== ws) w.send(txt);
  }
  async webSocketClose(ws) {
    ws.serializeAttachment({ quem: null, entrou: false });
    for (const w of this.vivos()) w.send(JSON.stringify({ t: "saiu" }));
  }
  async webSocketError(ws) {
    return this.webSocketClose(ws);
  }
};
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cod = (url.searchParams.get("sala") || "").toUpperCase().slice(0, 8);
    if (!cod) return new Response("falta ?sala=CODIGO", { status: 400 });
    const id = env.SALA.idFromName(cod);
    return env.SALA.get(id).fetch(req);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-x8eCQQ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-x8eCQQ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Sala,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
