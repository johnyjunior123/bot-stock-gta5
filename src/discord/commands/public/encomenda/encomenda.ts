import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import {
    calculatePrice,
    findProduct,
    formatMoneyType,
    formatPartnership,
    formatQuantity,
    productChoices,
    type MoneyType,
    type Partnership,
} from "./products.js";

createCommand({
    name: "encomenda",
    description: "Cria o resumo de uma encomenda",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "cliente",
            description: "Nome ou vulgo do cliente",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "grupo",
            description: "Gangue, equipe ou Civil",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "contato",
            description: "Telefone ou contato do cliente",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "produto",
            description: "Produto da encomenda",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: productChoices,
        },
        {
            name: "quantidade",
            description: "Quantidade pedida",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
        },
        {
            name: "parceria",
            description: "O cliente possui parceria?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Sim", value: "com" },
                { name: "Não", value: "sem" },
            ],
        },
        {
            name: "dinheiro",
            description: "Tipo de dinheiro usado no valor",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Limpo", value: "limpo" },
                { name: "Sujo", value: "sujo" },
            ],
        },
        {
            name: "retirada",
            description: "Disponibilidade para retirada. Ex: 25/05/2026",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async run(interaction) {
        const client = interaction.options.getString("cliente", true);
        const group = interaction.options.getString("grupo", true);
        const contact = interaction.options.getString("contato", true);
        const productId = interaction.options.getString("produto", true);
        const quantity = interaction.options.getInteger("quantidade", true);
        const partnership = interaction.options.getString("parceria", true) as Partnership;
        const moneyType = interaction.options.getString("dinheiro", true) as MoneyType;
        const pickup = interaction.options.getString("retirada", true);

        const product = findProduct(productId);
        if (!product) {
            await interaction.reply({
                content: "Produto não encontrado.",
                ephemeral: true,
            });
            return;
        }

        const price = calculatePrice(product, partnership, moneyType, quantity);

        await interaction.reply({
            embeds: [
                {
                    title: "Encomenda",
                    color: 0x5865f2,
                    description: [
                        "## Cliente",
                        `• **Nome / Vulgo:** ${client}`,
                        `• **Gangue ou Civil:** ${group}`,
                        `• **Contato:** ${contact}`,
                        "",
                        "## Pedido",
                        `• **Produto:** ${product.name}`,
                        `• **Quantidade:** ${formatQuantity(product, quantity)}`,
                        `• **Dinheiro:** ${formatMoneyType(moneyType)}`,
                        `• **Valor por unidade:** ${price.unit}`,
                        `• **Valor total:** ${price.total}`,
                        "",
                        "## Condições",
                        `• **Possui parceria?** ${formatPartnership(partnership)}`,
                        `• **Disponibilidade para retirada:** ${pickup}`,
                    ].join("\n"),
                },
            ],
        });
    },
});
