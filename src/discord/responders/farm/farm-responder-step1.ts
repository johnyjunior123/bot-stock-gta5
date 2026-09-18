import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle } from "discord.js";
import { getFarmSession } from "../../../cache/farm-cache.js";
import { readFarmQuantities } from "../../../functions/farm-form.js";
import { finishFarmDelivery } from "./farm-responder.final.js";

createResponder({
    customId: "/farm/submit/:sessionId/:page",
    types: [ResponderType.Modal, ResponderType.ModalComponent],
    async run(interaction, { sessionId, page }) {
        if (!interaction.guildId) return;
        const key = `${interaction.guildId}:${interaction.user.id}`;
        const session = getFarmSession(key, sessionId, page);
        if (!session) {
            await interaction.reply({
                content: "❌ Esta etapa não está mais disponível. Use /entregar-materiais para iniciar uma nova entrega.",
                ephemeral: true,
            });
            return;
        }

        const continueButton = () => createRow(new ButtonBuilder({
            customId: `/farm/continue/${session.id}/${session.page}`,
            label: "Continuar",
            style: ButtonStyle.Primary,
        }));

        try {
            const quantities = readFarmQuantities(session.pages[session.page],
                material => interaction.fields.getTextInputValue(material));
            session.quantities = { ...session.quantities, ...quantities };
        } catch (error) {
            await interaction.reply({
                content: error instanceof Error ? error.message : "❌ Quantidade inválida.",
                components: [continueButton()],
                ephemeral: true,
            });
            return;
        }

        if (session.page < session.pages.length - 1) {
            session.page++;
            await interaction.reply({
                content: "✅ Quantidades salvas. Clique abaixo para continuar a entrega.",
                components: [continueButton()],
                ephemeral: true,
            });
            return;
        }

        if (!Object.values(session.quantities).some(quantity => quantity > 0)) {
            await interaction.reply({
                content: "❌ Informe pelo menos uma quantidade maior que zero. Use /entregar-materiais para refazer a entrega.",
                ephemeral: true,
            });
            return;
        }

        await finishFarmDelivery(interaction, key, session);
    },
});
