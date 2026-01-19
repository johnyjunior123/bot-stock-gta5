import { createCommand } from "#base";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { FormatDate } from "../../../../functions/format-date.js";

createCommand({
    name: "ranking",
    description: "Mostra o ranking de entregas aprovadas",
    type: ApplicationCommandType.ChatInput,

    async run(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const ranking = await FarmService.ranking();

        if (!ranking || ranking.length === 0) {
            await interaction.editReply({
                content: "📌 Nenhuma entrega aprovada ainda."
            });
            return;
        }

        const top = ranking.slice(0, 10);
        const guild = interaction.guild;

        if (!guild) {
            await interaction.editReply({
                content: "❌ Esse comando só pode ser usado dentro de um servidor."
            });
            return;
        }

        const lines = await Promise.all(
            top.map(async (r, idx) => {
                const member = await guild.members.fetch(r.memberId).catch(() => null);
                const name = member?.nickname ?? member?.user?.username ?? "Desconhecido";

                return `**#${idx + 1}** ${name}\n` +
                    `Tot: **${r.total}** • M: ${r.metal} • C: ${r.copper} • B: ${r.rubber} • P: ${r.plastic} • V: ${r.glass} • A: ${r.pieceWeapon} • PP: ${r.pistolPiece}`;
            })
        );

        const embed = new EmbedBuilder()
            .setTitle("📈 Ranking de Entregas")
            .setDescription(`🗓️ Atualizado em: ${FormatDate(new Date())}`)
            .setFooter({ text: "Top 10 entregas aprovadas" });

        lines.forEach((line) => {
            embed.addFields({
                name: `⠀`,
                value: line,
                inline: false
            });
        });

        await interaction.editReply({
            embeds: [embed]
        });
    },
});
