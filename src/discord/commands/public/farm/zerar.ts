import { createCommand } from "#base";
import { prisma } from "#database";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
} from "discord.js";
import { auth } from "../../../../functions/auth.js";

createCommand({
    name: "zerar",
    description: "Zera todos os dados de um usuário no sistema",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário que deseja zerar",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],

    async run(interaction) {
        if (!(await auth(interaction))) return;

        const user = interaction.options.getUser("usuario", true);
        const guildId = interaction.guildId!;

        const member = await prisma.member.findFirst({
            where: {
                id: user.id,
                guildId,
            },
        });

        if (!member) {
            return interaction.reply({
                content: "❌ Usuário não encontrado no sistema.",
                ephemeral: true,
            });
        }

        try {
            await prisma.$transaction([
                prisma.farm.deleteMany({
                    where: { memberId: member.id },
                }),

                prisma.member.delete({
                    where: {
                        id_guildId: {
                            id: member.id,
                            guildId: member.guildId,
                        },
                    },
                })
            ]);

            await interaction.reply({
                content: `✅ Todos os dados de <@${user.id}> foram zerados com sucesso.`,
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "❌ Ocorreu um erro ao zerar os dados do usuário.",
                ephemeral: true,
            });
        }
        return
    },
});
