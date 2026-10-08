# Carrinho — Documentação do projeto

PWA mobile-first de lista de compras. Esta documentação cobre o protótipo atual (arquivo único `carrinho.html`) e o caminho para transformá-lo em um PWA instalável.

- **Protótipo publicado:** https://claude.ai/artifact/1ZeQRRvZKSLAMyhM9C8TUn
- **Status:** protótipo funcional, dados salvos localmente no aparelho
- **Idioma / moeda:** pt-BR, BRL

---

## 1. Objetivo

Um app simples, com identidade própria, para montar uma lista de compras com preços, ver o total em tempo real e depois usar a mesma lista como checklist dentro do mercado.

## 2. Requisitos

### Funcionais

| # | Requisito | Situação |
|---|-----------|----------|
| 1 | Adicionar itens com nome e preço | Atendido |
| 2 | Itens vendidos por peso (carne, frios etc.) calculam o preço pelo peso em kg | Atendido |
| 3 | Somar produto a produto, mostrando o total | Atendido |
| 4 | Botão **Ir às compras** que transforma a lista em checklist | Atendido |
| 5 | Marcar itens conforme são colocados no carrinho | Atendido |
| 6 | Itens editáveis (inclusive durante as compras) | Atendido |
| 7 | Funcionar como PWA (instalável e offline) | Pendente (ver seção 8) |

### Não funcionais

- Mobile-first, usável com uma mão
- Simples: poucas telas, poucos campos
- Identidade visual única
- Acessível: foco visível, `aria-checked` nos itens, respeito a `prefers-reduced-motion`

---

## 3. Fluxo de uso

```
Modo planejamento  ──[Ir às compras]──▶  Modo compras
 (montar a lista)  ◀──[Voltar à lista]──  (checklist)
                                              │
                          todos marcados ──▶ [Concluir compra]
                                              │
                                              ▼
                              volta ao planejamento, checks zerados
```

### Modo planejamento

- Botão **+** abre a folha de cadastro (nome, tipo de venda, preço, quantidade ou peso)
- Tocar em um item abre a mesma folha para editar ou excluir
- Rodapé fixo: etiqueta com o **Total** e o botão **Ir às compras**
- Link **Limpar lista** (pede confirmação)

### Modo compras

- Tocar na linha marca ou desmarca o item
- Barra de progresso e contador ("3 de 8 no carrinho")
- A etiqueta passa a mostrar **No carrinho**, somando só os itens marcados
- Link **editar** em cada item para corrigir preço ou peso real
- **+** continua disponível para itens esquecidos
- Com tudo marcado, o botão vira **Concluir compra**

---

## 4. Regras de cálculo

| Tipo de venda | Campo de preço | Campo de quantidade | Subtotal |
|---------------|----------------|---------------------|----------|
| Unidade | preço por unidade | quantidade (padrão 1) | `preço × quantidade` |
| Quilo (kg) | preço por kg | peso em kg (ex.: `0,750`) | `preço × peso` |

- Entradas aceitam vírgula ou ponto decimal (`42,90` e `42.90`). Se houver vírgula, pontos são tratados como separador de milhar.
- Valores inválidos ou negativos viram `0`.
- Peso é exibido com até 3 casas decimais.
- Total do planejamento = soma de todos os subtotais. Total do modo compras = soma dos itens marcados.

---

## 5. Modelo de dados

Estado único, persistido em `localStorage` na chave `carrinho:v1`.

```json
{
  "mode": "plan",
  "items": [
    {
      "id": 1760000000000,
      "name": "Contrafilé",
      "unit": "kg",
      "price": 42.9,
      "qty": 0.75,
      "done": false
    }
  ]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `mode` | `"plan"` \| `"shop"` | Tela atual |
| `id` | number | `Date.now()` no momento da criação |
| `name` | string | Nome do item |
| `unit` | `"un"` \| `"kg"` | Tipo de venda |
| `price` | number | Preço por unidade ou por kg |
| `qty` | number | Quantidade ou peso em kg |
| `done` | boolean | Marcado no modo compras |

Todas as leituras e escritas do storage ficam em `try/catch`, e o app renderiza normalmente se o storage estiver vazio ou indisponível.

---

## 6. Identidade visual

**Conceito:** feira e mercado. O elemento marcante é o total em uma **etiqueta de preço** amarela, levemente inclinada e com um furo, fixa no rodapé. O resto da interface fica quieto para ela se destacar.

### Tokens de cor

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `--bg` | `#F1F4FF` | `#0D1331` | Fundo |
| `--surface` | `#FFFFFF` | `#172048` | Cartões e folha |
| `--ink` | `#14204D` | `#EEF1FF` | Texto |
| `--muted` | `#5E688F` | `#98A2D0` | Texto secundário |
| `--line` | `#DCE2F7` | `#2A3466` | Bordas |
| `--btn` | `#1B34C9` | `#FFD23F` | Botão principal |
| `--tag` | `#FFD23F` | `#FFD23F` | Etiqueta de preço |
| `--ok` | `#1E8E5A` | `#4CD08E` | Item marcado |
| `--danger` | `#C62E3E` | `#FF7A87` | Excluir |

O tema segue `prefers-color-scheme` e também aceita `data-theme="light|dark"` em `:root`.

### Tipografia

Bricolage Grotesque (Google Fonts), com fallback para `system-ui`. Números usam `font-variant-numeric: tabular-nums` para os valores não "pularem" ao somar.

### Layout

- Coluna única, largura máxima de 520 px
- Dock fixo no rodapé com `env(safe-area-inset-bottom)` para não colidir com a barra do sistema
- Cadastro em folha inferior (bottom sheet), ideal para o polegar

---

## 7. Estrutura do protótipo

Arquivo único `carrinho.html`, sem dependências além da fonte.

| Parte | Função |
|-------|--------|
| `render()` | Redesenha lista, totais, barra de progresso e botão principal conforme `mode` |
| `openSheet(id?)` | Abre a folha em modo novo ou edição |
| `setUnit(u)` | Alterna Unidade/Quilo e atualiza rótulos |
| `prev()` | Atualiza o subtotal ao vivo na folha |
| `num(v)` | Converte texto digitado em número seguro |
| `save()` | Persiste o estado no `localStorage` |

---

## 8. Do protótipo ao PWA

O protótipo roda como página hospedada, mas a página publicada não consegue registrar manifest nem service worker próprios. Para instalar de verdade, o passo seguinte é levar o código para um projeto real.

### Checklist de PWA

- [ ] `manifest.webmanifest` com `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color` (`#1B34C9`) e `background_color`
- [ ] Ícones 192×192 e 512×512 (e versão *maskable*)
- [ ] Service worker com cache do app shell para uso offline (essencial dentro do mercado, onde o sinal costuma ser ruim)
- [ ] Servir em HTTPS
- [ ] `<meta name="viewport" content="..., viewport-fit=cover">` (já presente)
- [ ] Testar instalação no Android (Chrome) e iOS (Safari, "Adicionar à Tela de Início")

### Opções de stack

| Opção | Quando faz sentido |
|-------|--------------------|
| Vite + React + TypeScript + `vite-plugin-pwa` | Caminho mais curto; gera manifest e service worker com pouca configuração |
| Next.js + Tailwind (manifest + SW via plugin) | Se quiser reaproveitar a stack dos outros projetos |
| HTML puro + `manifest` + `sw.js` manual | Menor esforço, mantém o arquivo único |

Deploy sugerido: container Docker servindo os estáticos (nginx ou similar) atrás do Traefik, via Coolify.

---

## 9. Evoluções possíveis

- Sincronização entre aparelhos (lista compartilhada com outra pessoa)
- Categorias ou corredores para ordenar o checklist na ordem do mercado
- Histórico de compras e preços anteriores por item
- Sugestão de itens já comprados antes (autocompletar)
- Orçamento máximo com alerta ao ultrapassar
- Exportar ou compartilhar a lista por mensagem
- Backup e importação em JSON

---

## 10. Limitações conhecidas do protótipo

- Dados ficam apenas no navegador do aparelho; limpar os dados do site apaga a lista
- Sem sincronização entre dispositivos
- Sem modo offline garantido (depende do service worker, ainda não implementado)
- Uma única lista por vez
