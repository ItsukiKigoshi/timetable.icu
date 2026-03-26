import {getAuth} from "@/lib/auth.ts";

// export auth for `bun x auth@latest generate`
export const auth = getAuth({} as Env)