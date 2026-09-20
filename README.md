# Altinha

Jogo de ritmo onde a bola **é** o metrônomo. Modo atual: embaixadinha. Cada toque cai num tempo da música;
acerte na hora e ela volta centrada, erre e ela sai torta — e aí você tem que se
esticar pra salvar. Três quedas e acabou.

Jogue: https://imptrck.github.io/altinhaonline/

## No celular

Abra pelo navegador do telefone e os controles aparecem sozinhos: uma fileira
de botões no **rodapé**, que é onde o polegar está. O botão da vez acende, e
acende em **dourado** quando a nota é longa — mesmo aviso do anel.

Funciona em retrato (campo em cima, botões embaixo) e em paisagem (botões
sobrepostos no rodapé). Segurar funciona igual: encoste e mantenha.

A calibragem também aceita toque — sem isso não dava pra calibrar sem teclado,
e sem calibrar o jogo parece quebrado.

## Controles

| tecla | parte |
|---|---|
| `A` | pé esquerdo |
| `S` | coxa esquerda |
| `espaço` | cabeça |
| `K` | coxa direita |
| `L` | pé direito |
| `Esc` | opções / pausa |

## Em dupla (mesmo teclado)

Dois amigos, uma bola. A partitura é compartilhada e **cada nota tem dono**: a
bola vai de um boneco pro outro, e quando é a sua vez o seu lado acende.

| jogador | teclas |
|---|---|
| esquerda | `A` pé esq · `S` cabeça · `D` pé dir |
| direita | `J` pé esq · `K` cabeça · `L` pé dir |

Cooperativo: placar e bolas são dos dois. E o detalhe que faz a graça — **o seu
erro de tempo chega torto pra ele**. Passe porco, problema dele.

## Online

Botão **online** na tela inicial. Combinem nome de sala e senha; quem entra
primeiro é o anfitrião e dá o start. Cada um usa `A S D` no próprio teclado.

Como funciona, em uma frase: **quem julga um toque é sempre o dono dele**, então
a sua latência nunca te faz errar — você só transmite o resultado. O outro lado
desenha a bola de forma otimista e corrige quando a mensagem chega; notícia ruim
chegando 100 ms atrasada ninguém percebe.

O relógio comum sai de 8 idas e voltas até o servidor, ficando com a de menor
tempo. Precisa subir o relay uma vez — veja `worker/README.md`.

## Desafio do dia

A partitura sai de um sorteio **semeado pela data**: todo mundo que abrir hoje
pega exatamente a mesma sequência de lances, então o placar é comparável. Sem
servidor, sem sala. O botão *compartilhar* no fim copia o seu resultado.

Recorde do dia e recorde geral ficam salvos no navegador.

## Notas longas (segurar)

Alguns toques pedem que você **segure** a tecla em vez de tocar. Você é avisado
com ~1,5 s de antecedência: anel duplo dourado no alvo, a palavra **SEGURAR** (ou
**GIRAR**) em cima dele, e um halo dourado na própria bola — porque é na bola que
o olho fica, não no alvo.

Durante o toque, um anel de progresso mostra quanto falta, e o aviso vira
**SOLTA** perto do fim; soltar é julgado como um toque, com a mesma janela.

- **Matar no pé / na coxa** — a bola para em cima do corpo enquanto você segura.
- **Volta ao mundo** — você toca, a bola sobe, o pé dá a volta em torno dela, e
  você solta na hora em que ela desce.

Soltar cedo derruba a bola. Segurar demais também.

**Na primeira vez o jogo pede pra calibrar**: você aperta espaço junto com o tambor
8 vezes e ele mede seu atraso sozinho (pega a mediana, então uma batida perdida não
estraga a medida). Dá pra refazer em *opções → calibrar*. Sem isso o jogo parece
quebrado, e a culpa é da latência do fone, não sua.

## Como funciona

- Um arquivo só, sem dependência, sem build. `index.html` e pronto.
- **A bola não é simulada.** Dois toques consecutivos e o intervalo entre eles
  definem uma parábola única, resolvida em fórmula fechada. Determinístico: nunca
  dessincroniza da música.
- O tempo do jogo sai de `AudioContext.currentTime`, nunca de `Date.now()` nem de
  contagem de frames. Esconder a aba suspende o contexto, o que pausa o jogo inteiro
  de forma coerente, de graça.
- **Fluidez** ajustável em opções (economia / equilíbrio / máxima). Travar o
  desenho economiza energia mas custa resposta visual: num monitor de 164 Hz,
  *equilíbrio* dá 82 fps (12,2 ms) e *máxima* dá 164 fps (6,1 ms). O relógio do
  jogo é o do áudio, então nada disso mexe em precisão de timing — só em quanto
  tempo você leva pra VER o que já aconteceu.
- Tremida de tela, flash, zoom no toque perfeito, brilho que cresce com o combo e
  torcida sintetizada. Tudo desligável em *opções → efeitos visuais*, porque
  tremida e flash incomodam quem tem sensibilidade.
- A música é sintetizada em Web Audio (surdo, caixa, agogô, baixo) — não tem mp3.
  As camadas **respondem ao combo**: com pouco toque na sequência toca só o
  esqueleto, e vai enchendo conforme você emenda. Derrubou, desmonta.
- O andamento **acelera** com a dificuldade. Pra isso o mapa batida↔tempo é uma
  lista de trechos, e um trecho novo só vale a partir do instante dele — assim a
  batida nunca dá salto na hora em que o BPM muda.
