import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import {
    calculatePrice,
    findProduct,
    formatMoneyType,
    formatPartnershipSale,
    formatQuantity,
    productChoices,
    type MoneyType,
    type Partnership,
} from "./products.js";

createCommand({
    name: "venda",
    description: "Cria o resumo de uma venda",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "cliente",
            description: "Nome, vulgo ou identificação do cliente",
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
            description: "Produto vendido",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: productChoices,
        },
        {
            name: "quantidade",
            description: "Quantidade vendida",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
        },
        {
            name: "dinheiro",
            description: "Dinheiro limpo ou sujo",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Limpo", value: "limpo" },
                { name: "Sujo", value: "sujo" },
            ],
        },
        {
            name: "parceria",
            description: "Venda com parceria ou sem parceria?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Com parceria", value: "com" },
                { name: "Sem parceria", value: "sem" },
            ],
        },
    ],
    async run(interaction) {
        const client = interaction.options.getString("cliente", true);
        const contact = interaction.options.getString("contato", true);
        const productId = interaction.options.getString("produto", true);
        const quantity = interaction.options.getInteger("quantidade", true);
        const moneyType = interaction.options.getString("dinheiro", true) as MoneyType;
        const partnership = interaction.options.getString("parceria", true) as Partnership;

        const product = findProduct(productId);
        if (!product) {
            await interaction.reply({
                content: "Produto não encontrado.",
                ephemeral: true,
            });
            return;
        }

        const price = calculatePrice(product, partnership, moneyType, quantity);

        const channel = interaction.guild?.channels.cache.get(constants.channels.vendas);
        if (!channel || !channel.isSendable()) {
            await interaction.reply({
                content: "Canal de vendas não configurado ou sem permissão para enviar mensagens.",
                ephemeral: true,
            });
            return;
        }

        await channel.send({
            embeds: [
                {
                    title: "Venda",
                    color: 0x22c55e,
                    description: [
                        `• **Cliente:** ${client}`,
                        `• **Contato:** ${contact}`,
                        `• **Produto:** ${product.name}`,
                        `• **Quantidade:** ${formatQuantity(product, quantity)}`,
                        `• **Dinheiro:** ${formatMoneyType(moneyType)}`,
                        `• **Valor por unidade:** ${price.unit}`,
                        `• **Valor total da venda:** ${formatPartnershipSale(partnership)} - ${price.total}`,
                    ].join("\n"),
                },
            ],
        });

        await interaction.reply({
            content: `Venda enviada em ${channel}.`,
            ephemeral: true,
        });
    },
});
