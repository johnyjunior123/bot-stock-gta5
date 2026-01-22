import { ChatInputCommandInteraction, GuildMember } from "discord.js";

export async function auth(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember | null;

    if (!member) {
        await interaction.reply({
            content: "❌ Não foi possível verificar suas permissões.",
            ephemeral: true,
        });
        return false;
    }

    const roleId = process.env.ALLOWED_ROLE_ID;

    if (!roleId) {
        console.error("ALLOWED_ROLE_ID não configurado");
        await interaction.reply({
            content: "❌ Erro interno de permissão.",
            ephemeral: true,
        });
        return false;
    }

    const hasRole = member.roles.cache.has(roleId);

    if (!hasRole) {
        await interaction.reply({
            content: "❌ Você não tem permissão para usar este comando.",
            ephemeral: true,
        });
        return false;
    }

    return true;
}
