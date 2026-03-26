/// <reference path="../.astro/types.d.ts" />

declare namespace App {
    interface Locals {
        user: import("better-auth").User | null;
        session: import("better-auth").Session | null;
        runtime: {
            env: Cloudflare.Env;
            cf: import("@cloudflare/workers-types").CfProperties;
            ctx: {
                waitUntil: (promise: Promise<any>) => void;
            };
        };
    }
}