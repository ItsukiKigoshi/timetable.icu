import {getAuth} from "./server";

// bun x auth@latest generateでschemaを生成するために空配列でexport
const dummyRequest = new Request("https://timetable.icu");
export const auth = getAuth({} as Env, dummyRequest);