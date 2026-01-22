import { createCommand } from "#base";
import { prisma } from "#database";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { auth } from "../../../../functions/auth.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "pendente-detalhado",
    description: "Mostra detalhadamente as pendências de farm de um usuário por semana",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário que deseja consultar",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],

    async run(interaction) {
        if (!(await auth(interaction))) return;
        const user = interaction.options.getUser("usuario", true);
        const member = await prisma.member.findFirst({
            where: { id: user.id, guildId: interaction.guildId! },
        });

        if (!member) {
            return interaction.reply({
                content: "❌ Usuário não encontrado no sistema.",
                ephemeral: true,
            });
        }
        const result = await FarmService.getMemberPendingDetailed(member.id, interaction.guildId!);
        if (!result) {
            return interaction.reply({
                content: "❌ Não foi possível calcular a pendência.",
                ephemeral: true,
            });
        }
        if (!result.hasPending) {
            return interaction.reply({
                content: `✅ <@${user.id}> não possui pendências no farm.`,
                ephemeral: true,
            });
        }
        const description = result.byWeek.map((week) => {
            const pendingEntries = Object.entries(week.pending)
                .filter(([, value]) => value > 0)
                .map(([material, value]) => `• **${formatMaterial(material)}**: ${value}`)
                .join("\n");

            if (!pendingEntries) return null;

            return `**Semana de ${week.weekStart}**\n${pendingEntries}`;
        }).filter(Boolean).join("\n\n");
        await interaction.reply({
            embeds: [
                {
                    title: `📦 Pendências detalhadas de <@${user.id}>`,
                    description: description || "Nenhuma pendência registrada.",
                    footer: {
                        text: `Semanas ativas: ${result.weeksActive}`,
                    },
                    color: 0xe74c3c,
                },
            ],
        });
        return
    },
});
