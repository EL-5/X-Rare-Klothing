import { supabase } from '@/lib/supabase';
import type { BlogPostRow, ContentStatus, PageRow } from '@/types/database';

export interface Page {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  status: ContentStatus;
}

export interface PageInput {
  slug: string;
  title: string;
  body?: string;
  status: ContentStatus;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  status: ContentStatus;
  publishedAt: string | null;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  status: ContentStatus;
}

function mapPage(row: PageRow): Page {
  return { id: row.id, slug: row.slug, title: row.title, body: row.body, status: row.status };
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status,
    publishedAt: row.published_at,
  };
}

export const contentRepository = {
  async listPages(): Promise<Page[]> {
    const { data, error } = await supabase.from('pages').select('*').order('title');
    if (error) throw error;
    return (data ?? []).map(mapPage);
  },

  async createPage(input: PageInput): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        slug: input.slug,
        title: input.title,
        body: input.body || null,
        status: input.status,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapPage(data);
  },

  async updatePage(id: string, input: Partial<PageInput>): Promise<Page> {
    const row: Partial<PageRow> = {};
    if (input.slug !== undefined) row.slug = input.slug;
    if (input.title !== undefined) row.title = input.title;
    if (input.body !== undefined) row.body = input.body || null;
    if (input.status !== undefined) {
      row.status = input.status;
      if (input.status === 'published') row.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('pages').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapPage(data);
  },

  async removePage(id: string): Promise<void> {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  },

  async listBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapBlogPost);
  },

  async createBlogPost(input: BlogPostInput): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt || null,
        body: input.body || null,
        status: input.status,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapBlogPost(data);
  },

  async updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
    const row: Partial<BlogPostRow> = {};
    if (input.slug !== undefined) row.slug = input.slug;
    if (input.title !== undefined) row.title = input.title;
    if (input.excerpt !== undefined) row.excerpt = input.excerpt || null;
    if (input.body !== undefined) row.body = input.body || null;
    if (input.status !== undefined) {
      row.status = input.status;
      if (input.status === 'published') row.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('blog_posts').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapBlogPost(data);
  },

  async removeBlogPost(id: string): Promise<void> {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
  },
};
