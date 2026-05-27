import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const writeups = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writeups" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      platform: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard", "insane"]).optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      stack: z.array(z.string()).default([]),
      repo: z.string().url().optional(),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { writeups, projects };
