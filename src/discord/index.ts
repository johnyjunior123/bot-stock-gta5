import { setupCreators } from "@constatic/base";

export const { createCommand, createEvent, createResponder } = setupCreators({
    commands: {
        guilds: [`${process.env.MAIN_GUILD_ID}`]
    }
});