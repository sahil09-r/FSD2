import app from './app';
import { config } from './config';

app.listen(config.port, () => console.log(`BankOS API listening on :${config.port}`));
