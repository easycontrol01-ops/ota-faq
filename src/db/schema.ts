import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "employee"]);
export const faqStatusEnum = pgEnum("faq_status", [
  "draft",
  "published",
  "offline",
  "archived",
]);
export const faqTypeEnum = pgEnum("faq_type", ["platform", "device"]);
export const faqOsEnum = pgEnum("faq_os", ["Android", "RTOS", "Linux", "any"]);
export const faqVisibilityEnum = pgEnum("faq_visibility", [
  "public",
  "internal",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameZh: varchar("name_zh", { length: 200 }).notNull(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  titleZh: text("title_zh").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  contentZh: text("content_zh").notNull().default(""),
  contentEn: text("content_en").notNull().default(""),
  type: faqTypeEnum("type").notNull().default("platform"),
  os: faqOsEnum("os").notNull().default("any"),
  visibility: faqVisibilityEnum("visibility").notNull().default("public"),
  status: faqStatusEnum("status").notNull().default("draft"),
  categoryId: integer("category_id").references(() => categories.id),
  viewCount: integer("view_count").notNull().default(0),
  helpfulCount: integer("helpful_count").notNull().default(0),
  notHelpfulCount: integer("not_helpful_count").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// FAQ-Tags junction
export const faqTags = pgTable("faq_tags", {
  id: serial("id").primaryKey(),
  faqId: integer("faq_id")
    .notNull()
    .references(() => faqs.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// FAQ Versions (history)
export const faqVersions = pgTable("faq_versions", {
  id: serial("id").primaryKey(),
  faqId: integer("faq_id")
    .notNull()
    .references(() => faqs.id, { onDelete: "cascade" }),
  titleZh: text("title_zh").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  contentZh: text("content_zh").notNull().default(""),
  contentEn: text("content_en").notNull().default(""),
  changeNote: text("change_note").default(""),
  modifiedBy: integer("modified_by").references(() => users.id),
  versionNumber: integer("version_number").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Search logs
export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  keyword: varchar("keyword", { length: 500 }).notNull(),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feedback
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  faqId: integer("faq_id")
    .notNull()
    .references(() => faqs.id, { onDelete: "cascade" }),
  helpful: boolean("helpful").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
