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

`/criar-canal-farm` cadastra o usuário no banco antes de criar seu canal.
Se o canal já existir, o comando garante o cadastro sem duplicar o usuário nem
alterar sua data de entrada. As pendências contam desde a semana do cadastro,
mesmo antes da primeira entrega, e essa data é mantida após as entregas.

Use `/alterar-valor` para configurar a meta semanal de cada material. Por exemplo,
metal com quantidade 1000 faz `/entregar-materiais` solicitar metal. Outros materiais
com meta maior que zero também aparecem; definir uma meta como zero retira o item
do formulário. `/meta` mostra esses mesmos materiais vigentes.

Para cadastrar um material, use `/criar_novo_material nome:Explosivos` e depois
`/alterar-valor material:Explosivos qntde:100`. O material aparece imediatamente
nas sugestões de `/alterar-valor`; digite parte do nome para encontrá-lo.
O cadastro exige o mesmo cargo autorizado por `ALLOWED_ROLE_ID` que a alteração
de metas. Nomes duplicados são rejeitados, inclusive variações de maiúsculas,
acentos e espaços. O cadastro sozinho não define uma meta.

Novos materiais ficam salvos no banco e, após configurar uma meta positiva,
participam das entregas, consultas, ranking e pendências. Os materiais e o
histórico existentes são preservados. O catálogo segue o escopo global das metas.
Antes de iniciar esta versão, execute `npx prisma migrate deploy`,
`npx prisma generate` e `npm run build`, e reinicie o bot para registrar o comando.

**Areia** também está disponível. Aplique as migrações com `npx prisma migrate deploy`
e gere o cliente com `npx prisma generate` antes de compilar a atualização.
Configure sua meta em `/alterar-valor` para incluí-la no formulário de entrega.

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
