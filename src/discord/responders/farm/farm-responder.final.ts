import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { brBuilder, createContainer, createMediaGallery, createRow, Separator } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import { farmCache } from "../../../cache/farm-cache.js";
import { FarmService } from "../../../cache/prisma.service.js";
import { formatFarmList } from "../../../functions/farm-description.js";
import { FormatDate } from "../../../functions/format-date.js";

createResponder({
    customId: "/farm/step2",
    types: [ResponderType.ModalComponent],
    async run(interaction) {
        const { guild, member, fields } = interaction;
        if (!guild || !member) return;

        const cache = farmCache.get(member.user.id);
        if (!cache) {
            await interaction.reply({
                content: "❌ Tempo expirado. Refaça o envio.",
                ephemeral: true,
            });
            return;
        }

        clearTimeout(cache.timeout);

        const farmData = {
            ...cache.step1,
            pieceWeapon: Number(fields.getTextInputValue("pieceWeapon")),
            pistolPiece: Number(fields.getTextInputValue("pistolPiece")),
        };

        let farm;

        try {
            farm = await FarmService.createFarm({
                memberId: member.user.id,
                memberGuildId: guild.id,

                metal: farmData.metal,
                copper: farmData.copper,
                rubber: farmData.rubber,
                plastic: farmData.plastic,
                glass: farmData.glass,
                pieceWeapon: farmData.pieceWeapon,
                pistolPiece: farmData.pistolPiece,
                dirtyMoney: farmData.dirtyMoney,
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                content: "❌ Erro ao registrar o farm no banco de dados.",
                ephemeral: true,
            });
            return;
        }

        farmCache.delete(member.user.id);
        const images = fields.getUploadedFiles("images")
        const files = Array.from(images?.values() ?? [])
        const channel = guild.channels.cache.find(
            ch =>
                ch.type === ChannelType.GuildText &&
                ch.name.includes(member.user.id)
        );
        if (!channel || !channel.isSendable()) {
            await interaction.editReply({
                content: "❌ Não foi possível encontrar seu canal de farm. Contate a equipe."
            });
            return
        }
        const container = createContainer(
            constants.colors.azoxo,
            brBuilder(
                `# 📦 Entrega de Material`,
                `👤 **Entregue por:** ${member} em ${FormatDate(new Date())}`,
                "",
                "## 📊 Detalhamento do Farm",
                ...formatFarmList(farmData)
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
                })
            ),
            files.length >= 1 && createMediaGallery(files)
        );

        await channel.send({
            flags: ["IsComponentsV2"],
            components: [container],
            files
        });

        await interaction.deferUpdate()
    },
});
