import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

/**
 * Starlight's docs collection, plus the `kind` of a generated API page — the
 * badge the PageTitle override shows beside the title.
 */
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        kind: z.enum(['component', 'error', 'function', 'hook', 'type']).optional(),
      }),
    }),
  }),
};
