import { v4 as uuid4 } from "uuid"
import { text } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamp";

export const abstract = {
    id: text('id').primaryKey().$defaultFn(() => uuid4()),
    ...timestamps
}