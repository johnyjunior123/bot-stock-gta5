import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { ButtonBuilder, ButtonStyle } from "discord.js";
import { createRow } from "@magicyan/discord";

const actions = [
    { name: "Ammu Nation", value: "ammu-nation" },
    { name: "Lojinha", value: "lojinha" },
    { name: "Madeireira", value: "madeireira" },
    { name: "Banco Fleeca", value: "banco-fleeca" },
    { name: "Galinheiro", value: "galinheiro" },
    { name: "Açougue", value: "acougue" },
    { name: "Banco Central", value: "banco-central" },
    { name: "Nióbio", value: "niobio" },
    { name: "Aeroporto Trevor", value: "aeroporto-trevor" },
];

createCommand({
    name: "marcar_acao",
    description: "Abre uma ação para os usuários se candidatarem",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "acao",
            description: "Ação que será marcada",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: actions,
        },
        {
            name: "modalidade",
            description: "Escolha se a ação será no tiro ou na fuga (padrão: no tiro)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "No tiro", value: "no tiro" },
                { name: "Na fuga", value: "na fuga" },
            ],
        },
    ],
    async run(interaction) {
        const actionId = interaction.options.getString("acao", true);
        const action = actions.find(option => option.value === actionId);
        if (!action) return;

        const modality = interaction.options.getString("modalidade") ?? "no tiro";
        const button = new ButtonBuilder({
            customId: "/acao/candidatar",
            label: "Candidatar-se",
            style: ButtonStyle.Success,
        });
        const withdrawButton = new ButtonBuilder({
            customId: "/acao/desistir",
            label: "Desistir da ação",
            style: ButtonStyle.Danger,
        });

        await interaction.reply({
            content: `## ${action.name}\n**Modalidade:** ${modality === "na fuga" ? "Na fuga" : "No tiro"}\n**Candidatos:** —\n**Desistiram:** —`,
            components: [createRow(button, withdrawButton)],
            allowedMentions: { parse: [] },
        });
    },
});
