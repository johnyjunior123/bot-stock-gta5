import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle } from "discord.js";
import { farmCache } from "../../../cache/farm-cache.js";

createResponder({
    customId: "/farm/step1",
    types: [ResponderType.Modal],
    async run(interaction) {
        const { member, fields } = interaction;

        if (!member) return

        const step1Data = {
            metal: Number(fields.getTextInputValue("metal")),
            copper: Number(fields.getTextInputValue("copper")),
            plastic: Number(fields.getTextInputValue("plastic")),
            glass: Number(fields.getTextInputValue("glass")),
            rubber: Number(fields.getTextInputValue("rubber")),
        };

        const old = farmCache.get(member.user.id);
        if (old) clearTimeout(old.timeout);

        const timeout = setTimeout(() => {
            farmCache.delete(member.user.id);
        }, 20 * 60 * 1000);

        farmCache.set(member.user.id, {
            step1: step1Data,
            expiresAt: Date.now() + 20 * 60 * 1000,
            timeout,
        });

        await interaction.reply({
            content: "✅ Etapa 1 salva com sucesso.\nClique no botão abaixo para continuar.",
            components: [
                createRow(
                    new ButtonBuilder({
                        customId: "/farm/continue",
                        label: "➡️ Continuar",
                        style: ButtonStyle.Primary,
                    })
                )
            ]
        });
    },
});