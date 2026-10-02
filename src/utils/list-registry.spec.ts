import { articleList } from '../../test/fixtures/article-list';
import { tagList } from '../../test/fixtures/tag-list';
import { claimListParams, createListRegistry } from './list-registry';

describe('list registry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start empty', () => {
    const registry = createListRegistry();

    expect(registry.claims.size).toBe(0);
    expect(registry.reported.size).toBe(0);
  });

  it('should record a claim for every url name of the list', () => {
    const registry = createListRegistry();

    claimListParams(registry, articleList);

    expect([...registry.claims].map((claim) => claim.param.key).sort()).toEqual([
      'page',
      'q',
      'sort',
      'status',
    ]);
    expect([...registry.claims].every((claim) => claim.list === articleList)).toBe(true);
  });

  it('should drop only its own claims when released', () => {
    const registry = createListRegistry();
    const release = claimListParams(registry, articleList);

    claimListParams(registry, articleList);
    release();

    expect(registry.claims.size).toBe(4);
  });

  it('should name both lists and the parameter in the warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registry = createListRegistry();

    claimListParams(registry, articleList);
    claimListParams(registry, tagList);

    expect(warn).toHaveBeenCalledWith(
      '[@qubeejs/react] The lists "articles" and "tags" both own the URL parameter "page", so changing one changes the other. Give one of them another name, or declare the param once and use the same object in both lists if this is intended.'
    );
  });

  it('should report a collision once, however often the lists mount', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registry = createListRegistry();

    claimListParams(registry, articleList);
    claimListParams(registry, tagList)();
    claimListParams(registry, tagList);

    expect(warn.mock.calls.filter(([message]) => String(message).includes('"page"'))).toHaveLength(
      1
    );
  });
});
