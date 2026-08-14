import {
  contentRepository,
  type BlogPost,
  type BlogPostInput,
  type Page,
  type PageInput,
} from '@/repositories/contentRepository';

export interface ContentService {
  listPages(): Promise<Page[]>;
  createPage(input: PageInput): Promise<Page>;
  updatePage(id: string, input: Partial<PageInput>): Promise<Page>;
  removePage(id: string): Promise<void>;
  listBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(input: BlogPostInput): Promise<BlogPost>;
  updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost>;
  removeBlogPost(id: string): Promise<void>;
}

class SupabaseContentService implements ContentService {
  listPages(): Promise<Page[]> {
    return contentRepository.listPages();
  }
  createPage(input: PageInput): Promise<Page> {
    return contentRepository.createPage(input);
  }
  updatePage(id: string, input: Partial<PageInput>): Promise<Page> {
    return contentRepository.updatePage(id, input);
  }
  removePage(id: string): Promise<void> {
    return contentRepository.removePage(id);
  }
  listBlogPosts(): Promise<BlogPost[]> {
    return contentRepository.listBlogPosts();
  }
  createBlogPost(input: BlogPostInput): Promise<BlogPost> {
    return contentRepository.createBlogPost(input);
  }
  updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
    return contentRepository.updateBlogPost(id, input);
  }
  removeBlogPost(id: string): Promise<void> {
    return contentRepository.removeBlogPost(id);
  }
}

export const contentService: ContentService = new SupabaseContentService();
