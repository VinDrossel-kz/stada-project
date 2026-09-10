import {integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const teams=sqliteTable('teams',{id:integer('id').primaryKey(),name:text('name').notNull(),score:integer('score').notNull().default(0),updatedAt:text('updated_at')});
