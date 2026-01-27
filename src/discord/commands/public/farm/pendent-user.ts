import { createCommand } from "#base";
import { prisma } from "#database";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
} from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { auth } from "../../../../functions/auth.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "pendente-only",
    description: "Mostra o que um usuário está pendente no farm",
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
            where: {
                id: user.id,
                guildId: interaction.guildId!,
            },
        });
        const guildId = interaction.guildId

        if (!member) {
            return interaction.reply({
                content: "❌ Usuário não encontrado no sistema.",
                ephemeral: true,
            });
        }

        const result = await FarmService.getMemberPending(member.id, guildId);

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

        const description = Object.entries(result.pending)
            .filter(([, value]) => value > 0)
            .map(([material, value]) => `• **${formatMaterial(material)}**: ${value}`)
            .join("\n");

        console.log('teste')

        await interaction.reply({
            embeds: [
                {
                    title: "📦 Pendências de Farm",
                    description,
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
