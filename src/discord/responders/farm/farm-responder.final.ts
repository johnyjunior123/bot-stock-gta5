import { brBuilder, createContainer, createMediaGallery, createRow, Separator } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, ChannelType, type ModalSubmitInteraction } from "discord.js";
import { clearFarmSession, type FarmCacheData } from "../../../cache/farm-cache.js";
import { FarmService } from "../../../cache/prisma.service.js";
import { formatFarmList } from "../../../functions/farm-description.js";
import { FormatDate } from "../../../functions/format-date.js";

export async function finishFarmDelivery(
    interaction: ModalSubmitInteraction, key: string, session: FarmCacheData,
) {
    const { guild, fields, user } = interaction;
    if (!guild) return;

    const files = Array.from(fields.getUploadedFiles("images")?.values() ?? []);
    if (!files.length) {
        await interaction.reply({ content: "❌ Anexe o comprovante da entrega.", ephemeral: true });
        return;
    }
    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && ch.name.includes(user.id),
    );
    if (!channel || !channel.isSendable()) {
        await interaction.reply({
            content: "❌ Não foi possível encontrar seu canal de farm. Contate a equipe.",
            ephemeral: true,
        });
        return;
    }

    session.submitting = true;
    await interaction.deferReply({ ephemeral: true });
    let farm;
    try {
        farm = await FarmService.createFarm({
            memberId: user.id,
            memberGuildId: guild.id,
            ...session.quantities,
        });
    } catch (error) {
        console.error(error);
        session.submitting = false;
        await interaction.editReply({
            content: "❌ Erro ao registrar o farm no banco de dados. Tente novamente.",
            components: [createRow(new ButtonBuilder({
                customId: `/farm/continue/${session.id}/${session.page}`,
                label: "Tentar novamente",
                style: ButtonStyle.Primary,
            }))],
        });
        return;
    }

    clearFarmSession(key);
    const container = createContainer(
        constants.colors.azoxo,
        brBuilder(
            "# 📦 Entrega de Material",
            `👤 **Entregue por:** <@${user.id}> em ${FormatDate(new Date())}`,
            "",
            "## 📊 Detalhamento do Farm",
            ...formatFarmList(session.quantities),
        ),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: `/form/recuse/${farm.id}`,
                label: "Recusar Entrega",
                style: ButtonStyle.Danger,
            }),
            new ButtonBuilder({
                customId: `/form/approve/${farm.id}`,
                label: "Confirmar Entrega",
                style: ButtonStyle.Success,
            }),
        ),
        createMediaGallery(files),
    );

    try {
        await channel.send({
            flags: ["IsComponentsV2"],
            components: [container],
            files,
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: `❌ A entrega #${farm.id} foi registrada, mas não foi possível publicar o comprovante no canal. Contate a equipe e informe esse número antes de reenviar.`,
        });
        return;
    }
    await interaction.editReply({ content: "✅ Entrega registrada e enviada para aprovação." });
}
