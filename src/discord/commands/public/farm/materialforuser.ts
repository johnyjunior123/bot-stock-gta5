import { createCommand } from "#base";
import { brBuilder, createContainer, Separator } from "@magicyan/discord";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { FormatDate } from "../../../../functions/format-date.js";

function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        start: FormatDate(monday),
        end: FormatDate(sunday),
    };
}

createCommand({
    name: "farm",
    description: "Consulta o farm de um usuário (semana e total)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário que você quer consultar",
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],

    async run(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser("usuario", true);

        const weekly = await FarmService.userWeekly(user.id);
        const total = await FarmService.userTotal(user.id);

        const weekRange = getWeekRange();

        const container = createContainer(
            constants.colors.azoxo,
            brBuilder(
                `# 📦 Farm de ${user.username}`,
                `🗓️ Atualizado em: ${FormatDate(new Date())}`,
                "",
                `## 🗓️ Esta semana (${weekRange.start} → ${weekRange.end})`,
                `• Metal: ${weekly.metal}`,
                `• Cobre: ${weekly.copper}`,
                `• Borracha: ${weekly.rubber}`,
                `• Plástico: ${weekly.plastic}`,
                `• Vidro: ${weekly.glass}`,
                `• Arma: ${weekly.pieceWeapon}`,
                `• Peça Pistol: ${weekly.pistolPiece}`,
                `• **Total da semana:** ${weekly.total}`,
                "",
                `## 📌 Total Geral`,
                `• Metal: ${total.metal}`,
                `• Cobre: ${total.copper}`,
                `• Borracha: ${total.rubber}`,
                `• Plástico: ${total.plastic}`,
                `• Vidro: ${total.glass}`,
                `• Arma: ${total.pieceWeapon}`,
                `• Peça Pistol: ${total.pistolPiece}`,
                `• **Total Geral:** ${total.total}`,
            ),
            Separator.Default,
        );

        await interaction.editReply({
            flags: ["IsComponentsV2"],
            components: [container]
        });
    },
});
