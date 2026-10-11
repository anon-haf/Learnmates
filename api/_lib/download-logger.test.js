import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDownloadAction,
  formatDownloadUrl,
  logDownloadServer,
} from './download-logger.js';

test('mapDownloadAction', () => {
  assert.equal(mapDownloadAction('paper'), 'past_paper_download');
  assert.equal(mapDownloadAction('topical_paper'), 'topical_download');
  assert.equal(mapDownloadAction('file'), 'resource_download');
  assert.equal(mapDownloadAction(undefined), 'resource_download');
});

test('formatDownloadUrl for resource_download', () => {
  const url = '/documents/alevel/cambridge/Physics/2-Kinematics/Kinematics.pdf';
  assert.equal(formatDownloadUrl('resource_download', url), url);

  const fullUrl = 'https://www.learnmates.org/documents/alevel/cambridge/Physics/2-Kinematics/Kinematics.pdf?download=true';
  assert.equal(formatDownloadUrl('resource_download', fullUrl), url);

  const withoutLeadingSlash = 'documents/alevel/cambridge/Physics/2-Kinematics/Kinematics.pdf';
  assert.equal(formatDownloadUrl('resource_download', withoutLeadingSlash), url);
});

test('formatDownloadUrl for past_paper_download and topical_download', () => {
  // Questions/{level}/{board}/{subject}/.../{fileName} -> board/level/subject/{fileName}
  const rawQuestionsUrl = '/Questions/alevel/cambridge/Physics/MCQ/9702_s22_qp_12.pdf';
  assert.equal(
    formatDownloadUrl('past_paper_download', rawQuestionsUrl),
    'cambridge/alevel/Physics/9702_s22_qp_12.pdf'
  );

  // topicals/{board}/{level}/{subject}/{fileName}
  const rawTopicalUrl = 'topicals/cambridge/alevel/Physics/9702_s22_qp_12.pdf';
  assert.equal(
    formatDownloadUrl('topical_download', rawTopicalUrl),
    'cambridge/alevel/Physics/9702_s22_qp_12.pdf'
  );

  // already structured as board/level/subject/file.pdf
  const standard = 'cambridge/alevel/Physics/9702_s22_qp_12.pdf';
  assert.equal(
    formatDownloadUrl('past_paper_download', standard),
    'cambridge/alevel/Physics/9702_s22_qp_12.pdf'
  );
});

test('logDownloadServer handles anonymous and authenticated users', async () => {
  let inserted = null;
  const mockSupabase = {
    from: (table) => ({
      insert: async (row) => {
        inserted = { table, row };
        return { error: null };
      },
    }),
  };

  // Anonymous user: should not log
  const anonResult = await logDownloadServer(mockSupabase, {
    userId: null,
    resourceType: 'file',
    rawUrl: '/documents/test.pdf',
  });
  assert.equal(anonResult, false);
  assert.equal(inserted, null);

  // Authenticated user: should log
  const authResult = await logDownloadServer(mockSupabase, {
    userId: 'user-123-abc',
    resourceType: 'paper',
    rawUrl: '/Questions/alevel/cambridge/Physics/9702_s22_qp_12.pdf',
    resourceName: '9702_s22_qp_12.pdf',
  });
  assert.equal(authResult, true);
  assert.equal(inserted.table, 'download');
  assert.deepEqual(inserted.row, {
    user_id: 'user-123-abc',
    action: 'past_paper_download',
    url: 'cambridge/alevel/Physics/9702_s22_qp_12.pdf',
  });
});
