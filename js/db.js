import config from '../Configuration';
import thinky from 'thinky';

thinky.init(config.rethinkdb);

export default thinky;
