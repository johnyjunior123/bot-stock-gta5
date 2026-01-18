import { createCommand } from "#base";
import {
    createLabel,
    createModalFields,
    createTextInput
} from "@magicyan/discord";
import { ApplicationCommandType, TextInputStyle } from "discord.js";

createCommand({
    name: "entregar-materiais",
    description: "Registrar entrega de farm",
    type: ApplicationCommandType.ChatInput,

    async run(interaction) {
        await interaction.showModal({
            title: "Entrega de Farm — Etapa 1",
            customId: "/farm/step1",
            components: createModalFields(
                createLabel("Metal",
                    createTextInput({
                        customId: "metal",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Borracha",
                    createTextInput({
                        customId: "rubber",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Cobre",
                    createTextInput({
                        customId: "copper",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Plástico",
                    createTextInput({
                        customId: "plastic",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
                createLabel("Vidro",
                    createTextInput({
                        customId: "glass",
                        value: "0",
                        style: TextInputStyle.Short,
                        required: true
                    })
                ),
            )
        });
    }
});