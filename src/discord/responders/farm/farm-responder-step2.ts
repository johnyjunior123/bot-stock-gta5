import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createFileUpload, createLabel, createModalFields, createTextInput } from "@magicyan/discord";
import { TextInputStyle } from "discord.js";
import { farmCache } from "../../../cache/farm-cache.js";

createResponder({
    customId: "/farm/continue",
    types: [ResponderType.Button],
    async run(interaction) {
        const cache = farmCache.get(interaction.user.id);
        if (!cache) {
            await interaction.reply({
                content: "❌ Sua sessão expirou. Envie o formulário novamente.",
                ephemeral: true,
            });
            return;
        }

        await interaction.showModal({
            title: "Entrega de Farm — Etapa 2",
            customId: "/farm/step2",
            components: createModalFields(
                createLabel("Peça de arma",
                    createTextInput({
                        customId: "pieceWeapon",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Corpo de pistola",
                    createTextInput({
                        customId: "pistolPiece",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Comprovante",
                    createFileUpload("images", true, 1)
                )
            )
        });
    },
});