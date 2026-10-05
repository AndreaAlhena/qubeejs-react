import { buildListRequest, readListState } from '@qubeejs/core';

import { articleList } from '../../test/fixtures/article-list';
import { taskList } from '../../test/fixtures/task-list';
import { buildRequestFor } from './build-request-for';

describe('buildRequestFor', () => {
  it('should build the request of a list without an input', () => {
    const request = buildRequestFor(articleList, articleList, 'page=2', undefined);

    expect(request?.uri).toBe(
      buildListRequest(articleList, readListState(articleList, 'page=2')).uri
    );
  });

  it('should pass the input to a list that declares one', () => {
    const request = buildRequestFor(taskList, taskList, 'status=open', { projectId: '42' });

    expect(request?.uri).toBe(
      buildListRequest(taskList, readListState(taskList, 'status=open'), { projectId: '42' }).uri
    );
  });

  it('should build nothing while the input is null', () => {
    expect(buildRequestFor(taskList, taskList, 'status=open', null)).toBeNull();
  });
});
