import { QubeeFetchError } from './qubee-fetch.error';

describe('QubeeFetchError', () => {
  describe('constructor', () => {
    it('should be an Error named after its class', () => {
      const error = new QubeeFetchError('https://example.com/api/articles', new Response(null));

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QubeeFetchError);
      expect(error.name).toBe('QubeeFetchError');
    });

    it('should carry the address, the status and the response', () => {
      const response = new Response('{"error":"Not found"}', { status: 404 });
      const error = new QubeeFetchError('https://example.com/api/articles?page=9', response);

      expect(error.uri).toBe('https://example.com/api/articles?page=9');
      expect(error.status).toBe(404);
      expect(error.response).toBe(response);
    });

    it('should name the address and the status in its message', () => {
      const response = new Response(null, { status: 503 });

      expect(new QubeeFetchError('https://example.com/api/articles', response).message).toBe(
        'The request to https://example.com/api/articles failed with status 503.'
      );
    });

    it('should leave the body of the response unread', async () => {
      const response = new Response('{"error":"Not found"}', { status: 404 });
      const error = new QubeeFetchError('https://example.com/api/articles', response);

      await expect(error.response.json()).resolves.toEqual({ error: 'Not found' });
    });
  });
});
