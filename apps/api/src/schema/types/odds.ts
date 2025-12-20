import { builder } from '../builder';

// Odds snapshot from database
export const OddsSnapshot = builder.prismaObject('OddsSnapshot', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    fixtureId: t.exposeInt('fixtureId'),
    bookmaker: t.exposeString('bookmaker'),
    market: t.exposeString('market'),
    homeOdds: t.exposeFloat('homeOdds', { nullable: true }),
    drawOdds: t.exposeFloat('drawOdds', { nullable: true }),
    awayOdds: t.exposeFloat('awayOdds', { nullable: true }),
    overOdds: t.exposeFloat('overOdds', { nullable: true }),
    underOdds: t.exposeFloat('underOdds', { nullable: true }),
    yesOdds: t.exposeFloat('yesOdds', { nullable: true }),
    noOdds: t.exposeFloat('noOdds', { nullable: true }),
    line: t.exposeFloat('line', { nullable: true }),
    isOpening: t.exposeBoolean('isOpening'),
    isClosing: t.exposeBoolean('isClosing'),
    capturedAt: t.expose('capturedAt', { type: 'DateTime' }),
    fixture: t.relation('fixture'),
  }),
});

// Live odds from API (not persisted)
const LiveOddsMarket = builder.objectType('LiveOddsMarket', {
  fields: (t) => ({
    home: t.float({ nullable: true }),
    draw: t.float({ nullable: true }),
    away: t.float({ nullable: true }),
    homePoint: t.float({ nullable: true }),
    awayPoint: t.float({ nullable: true }),
    over: t.float({ nullable: true }),
    under: t.float({ nullable: true }),
    point: t.float({ nullable: true }),
  }),
});

const LiveBookmakerOdds = builder.objectType('LiveBookmakerOdds', {
  fields: (t) => ({
    key: t.string(),
    name: t.string(),
    lastUpdate: t.string(),
    h2h: t.field({ type: LiveOddsMarket, nullable: true }),
    spreads: t.field({ type: LiveOddsMarket, nullable: true }),
    totals: t.field({ type: LiveOddsMarket, nullable: true }),
  }),
});

const ConsensusOdds = builder.objectType('ConsensusOdds', {
  fields: (t) => ({
    home: t.float({ nullable: true }),
    draw: t.float({ nullable: true }),
    away: t.float({ nullable: true }),
    over: t.float({ nullable: true }),
    under: t.float({ nullable: true }),
    point: t.float({ nullable: true }),
  }),
});

const ImpliedProbabilities = builder.objectType('ImpliedProbabilities', {
  fields: (t) => ({
    home: t.float(),
    draw: t.float(),
    away: t.float(),
    overround: t.float(),
  }),
});

export const LiveOdds = builder.objectType('LiveOdds', {
  fields: (t) => ({
    eventId: t.string(),
    homeTeam: t.string(),
    awayTeam: t.string(),
    commenceTime: t.string(),
    bookmakers: t.field({ type: [LiveBookmakerOdds] }),
    consensus: t.field({ type: ConsensusOdds, nullable: true }),
    impliedProbabilities: t.field({ type: ImpliedProbabilities, nullable: true }),
  }),
});

// Odds movement tracking
export const OddsMovement = builder.objectType('OddsMovement', {
  fields: (t) => ({
    market: t.string(),
    opening: t.field({ type: ConsensusOdds }),
    current: t.field({ type: ConsensusOdds }),
    movement: t.field({ type: ConsensusOdds }),
    movementPercent: t.field({ type: ConsensusOdds }),
  }),
});

