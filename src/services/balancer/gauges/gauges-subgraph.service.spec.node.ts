import gaugesResponse from './__mocks__/gauges-response.schema.json';
import nock from 'nock';
import { gaugesSubgraphService } from './gauges-subgraph.service';

describe('GaugesSubgraphService', () => {
  beforeEach(() => {
    nock('https://api.thegraph.com')
      .post('/subgraphs/name/mendesfabio/balancer-gauges')
      .reply(200, gaugesResponse);
  });

  describe('#get', () => {
    describe('default query', () => {
      it('Array of gauges', async () => {
        const response = await gaugesSubgraphService.gauges.get();

        expect(response).toEqual(gaugesResponse.data.liquidityGauges);
      });
    });
  });
});
