import {
  commitLocation,
  createListStateMachine,
  draftLocation,
  observeLocation,
} from './list-state-machine';

describe('list-state machine', () => {
  describe('createListStateMachine', () => {
    it('should start settled at the location', () => {
      expect(createListStateMachine('/articles')).toEqual({
        debouncing: false,
        draft: null,
        inflight: [],
        location: '/articles',
      });
    });
  });

  describe('draftLocation', () => {
    it('should hold the href as a debounced draft', () => {
      const machine = draftLocation(createListStateMachine('/articles'), '/articles?q=r');

      expect(machine).toEqual({
        debouncing: true,
        draft: '/articles?q=r',
        inflight: [],
        location: '/articles',
      });
    });
  });

  describe('commitLocation', () => {
    it('should add the href to the in-flight list and keep it as the draft', () => {
      const machine = commitLocation(createListStateMachine('/articles'), '/articles?q=react');

      expect(machine).toEqual({
        debouncing: false,
        draft: '/articles?q=react',
        inflight: ['/articles?q=react'],
        location: '/articles',
      });
    });

    it('should stop debouncing', () => {
      const drafted = draftLocation(createListStateMachine('/articles'), '/articles?q=r');

      expect(commitLocation(drafted, '/articles?q=r').debouncing).toBe(false);
    });

    it('should settle when the href is the current location', () => {
      const inFlight = commitLocation(createListStateMachine('/articles'), '/articles?q=a');

      expect(commitLocation(inFlight, '/articles')).toEqual({
        debouncing: false,
        draft: null,
        inflight: [],
        location: '/articles',
      });
    });
  });

  describe('observeLocation', () => {
    it('should return the same machine when the location is unchanged', () => {
      const machine = commitLocation(createListStateMachine('/articles'), '/articles?q=react');

      expect(observeLocation(machine, '/articles')).toBe(machine);
    });

    it('should settle when the URL reaches the last in-flight href', () => {
      const machine = commitLocation(createListStateMachine('/articles'), '/articles?q=react');

      expect(observeLocation(machine, '/articles?q=react')).toEqual({
        debouncing: false,
        draft: null,
        inflight: [],
        location: '/articles?q=react',
      });
    });

    it('should keep the draft while later hrefs are still in flight', () => {
      const first = commitLocation(createListStateMachine('/articles'), '/articles?q=a');
      const second = commitLocation(first, '/articles?q=ab');

      expect(observeLocation(second, '/articles?q=a')).toEqual({
        debouncing: false,
        draft: '/articles?q=ab',
        inflight: ['/articles?q=ab'],
        location: '/articles?q=a',
      });
    });

    it('should keep the draft while a debounce is pending', () => {
      const committed = commitLocation(createListStateMachine('/articles'), '/articles?q=r');
      const typing = draftLocation(committed, '/articles?q=re');

      expect(observeLocation(typing, '/articles?q=r')).toEqual({
        debouncing: true,
        draft: '/articles?q=re',
        inflight: [],
        location: '/articles?q=r',
      });
    });

    it('should reset when the URL changes to something it did not ask for', () => {
      const typing = draftLocation(createListStateMachine('/articles'), '/articles?q=r');

      expect(observeLocation(typing, '/authors')).toEqual(createListStateMachine('/authors'));
    });
  });
});
