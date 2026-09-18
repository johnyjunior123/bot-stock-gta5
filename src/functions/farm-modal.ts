import { createFileUpload, createLabel, createModalFields, createTextInput } from "@magicyan/discord";
import { TextInputStyle } from "discord.js";
import type { FarmCacheData } from "../cache/farm-cache.js";
import { formatMaterial } from "./utils.js";

export function createFarmModal(session: FarmCacheData) {
    const labels = session.pages[session.page].map(({ material, weeklyMin }) =>
        createLabel(`${formatMaterial(material)} — meta: ${weeklyMin}`,
            createTextInput({
                customId: material,
                placeholder: "Quantidade entregue (0 se não entregou)",
                style: TextInputStyle.Short,
                required: true,
                maxLength: 10,
            }),
        ),
    );
    if (session.page === session.pages.length - 1) {
        labels.push(createLabel("Comprovante", createFileUpload("images", true, 1)));
    }
    return {
        title: session.pages.length === 1 ? "Entrega de Farm" : `Entrega de Farm — Etapa ${session.page + 1}`,
        customId: `/farm/submit/${session.id}/${session.page}`,
        components: createModalFields(...labels),
    };
}
