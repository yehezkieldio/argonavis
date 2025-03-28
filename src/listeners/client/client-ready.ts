import { Listener } from "@sapphire/framework";
import type { Client, ClientUser } from "discord.js";
import { ArgoNavisEvents } from "#/libs/extensions/constants/events";
import packageJson from "../../../package.json" with { type: "json" };

export class ClientReadyListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: true,
            event: ArgoNavisEvents.ClientReady
        });
    }

    public async run(client: Client): Promise<void> {
        const { username, id } = client.user as ClientUser;
        this.container.logger.info(`ClientReadyListener: Successfully logged in as ${username} (${id})`);
        await Bun.sleep(500);
        this.header();
    }

    public async header() {
        console.log(
            `
       d8888                          888b    888                   d8b
      d88888                          8888b   888                   Y8P
     d88P888                          88888b  888
    d88P 888 888d888 .d88b.   .d88b.  888Y88b 888  8888b.  888  888 888 .d8888b
   d88P  888 888P"  d88P"88b d88""88b 888 Y88b888     "88b 888  888 888 88K
  d88P   888 888    888  888 888  888 888  Y88888 .d888888 Y88  88P 888 "Y8888b.
 d8888888888 888    Y88b 888 Y88..88P 888   Y8888 888  888  Y8bd8P  888      X88
d88P     888 888     "Y88888  "Y88P"  888    Y888 "Y888888   Y88P   888  88888P'
                         888
                    Y8b d88P
                     "Y88P"
ArgoNavis v${packageJson.version}
            `
        );
    }
}
