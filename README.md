# Embaixadinha

Jogo de ritmo onde a bola **é** o metrônomo. Cada toque cai num tempo da música;
acerte na hora e ela volta centrada, erre e ela sai torta — e aí você tem que se
esticar pra salvar. Três quedas e acabou.

Jogue: https://imptrck.github.io/altinhaonline/

## Controles

| tecla | parte |
|---|---|
| `A` | pé esquerdo |
| `S` | coxa esquerda |
| `espaço` | cabeça |
| `K` | coxa direita |
| `L` | pé direito |
| `Esc` | opções / pausa |

## Notas longas (segurar)

Alguns toques pedem que você **segure** a tecla em vez de tocar. Um anel de
progresso mostra quanto falta, e o aviso vira **SOLTA** perto do fim — soltar é
julgado como um toque, com a mesma janela de tempo.

- **Matar no pé / na coxa** — a bola para em cima do corpo enquanto você segura.
- **Volta ao mundo** — você toca, a bola sobe, o pé dá a volta em torno dela, e
  você solta na hora em que ela desce.

Soltar cedo derruba a bola. Segurar demais também.

**Ajuste a latência antes de julgar seu ritmo.** Jogue uns 20 toques, olhe o "erro
médio" no rodapé e clique em *usar como latência*. Fone Bluetooth costuma pedir
150–250 ms; sem isso o jogo parece quebrado e a culpa não é sua.

## Como funciona

- Um arquivo só, sem dependência, sem build. `index.html` e pronto.
- **A bola não é simulada.** Dois toques consecutivos e o intervalo entre eles
  definem uma parábola única, resolvida em fórmula fechada. Determinístico: nunca
  dessincroniza da música.
- O tempo do jogo sai de `AudioContext.currentTime`, nunca de `Date.now()` nem de
  contagem de frames. Esconder a aba suspende o contexto, o que pausa o jogo inteiro
  de forma coerente, de graça.
- A música é sintetizada em Web Audio (surdo, caixa, agogô, baixo) — não tem mp3.
