import { builder } from './builder';

// Import all type definitions
import './types/country';
import './types/league';
import './types/team';
import './types/season';
import './types/fixture';
import './types/fixture-stats';
import './types/standing';
import './types/match-note';
import './types/user';
import './types/favorite';
import './types/odds';
import './types/lineup';
// V2 types
import './types/alert';
import './types/saved-screen';
import './types/user-selection';

// Import queries
import './queries/countries';
import './queries/leagues';
import './queries/teams';
import './queries/fixtures';
import './queries/standings';
import './queries/odds';
import './queries/match-details';
// V2 queries
import './queries/alerts';
import './queries/screens';
import './queries/selections';

// Import mutations
import './mutations/sync';
import './mutations/notes';
import './mutations/favorites';
import './mutations/odds';
// V2 mutations
import './mutations/alerts';
import './mutations/screens';
import './mutations/selections';

export const schema = builder.toSchema();

