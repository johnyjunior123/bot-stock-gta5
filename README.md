# Awesome Bot Base

> [!NOTE] 
> This project **base** can be generated using the [Constant CLI](https://github.com/rinckodev/constatic/tree/master/tools/cli#readme)
> See the full documentation for this base by accessing: https://constatic-docs.vercel.app/docs/discord/start

This is the most complete discord bot base you've ever seen! Developed by [@rinckodev](https://github.com/rinckodev), this project uses typescript in an incredible way to provide complete structures and facilitate the development of your discord bot.

> [!WARNING]
> [NodeJs](https://nodejs.org/en) version required: 20.12 or higher

## Scripts

- `test`: valida as metas, os campos dos modais e as sessões de entrega de farm

- `dev`: running bot in development
- `build`: build the project
- `watch`: running in watch mode
- `start`: running the compiled bot

## Configuração e entrega de farm

Copie `.env.example` para `.env` e preencha as variáveis conforme os comentários.
Configure também os IDs de canais e cargos em `constants.json`.

Use `/alterar-valor` para configurar a meta semanal de cada material. Por exemplo,
metal com quantidade 1000 faz `/entregar-materiais` solicitar metal. Outros materiais
com meta maior que zero também aparecem; definir uma meta como zero retira o item
do formulário. `/meta` mostra esses mesmos materiais vigentes.

O formulário informa a meta e solicita a quantidade entregue de cada material.
Entregas parciais são permitidas: informe zero para o que não entregou e pelo menos
uma quantidade positiva. O comprovante é obrigatório. Até quatro materiais cabem
com o comprovante em um único modal; com mais materiais, use o botão Continuar
para concluir as etapas. A sessão dura 20 minutos e mantém as metas consultadas
ao abrir o formulário.

O material antes exibido como peça de pistola agora aparece como **Peça de Sub**.
A chave interna `pistolPiece` foi mantida para preservar as metas e entregas
existentes, sem migração de banco.

## Structures

- [Commands](https://constatic-docs.vercel.app/docs/discord/commands)
- [Responder](https://constatic-docs.vercel.app/docs/discord/responders)
- [Events](https://constatic-docs.vercel.app/docs/discord/events)
