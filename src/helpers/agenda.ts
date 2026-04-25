import Agenda from 'agenda';
import { Job } from 'agenda';
import NodeMailerService from '../resources/mail/nodemailer.service';
import logger from '../utils/logger';

function getAgendaMongoUri(): string {
  const { QUEUE_DB_URI, MONGO_PROD_URI, MONGO_URI, NODE_ENV } = process.env;
  const fallbackMongoUri = NODE_ENV === 'production' ? MONGO_PROD_URI : MONGO_URI;
  const mongoUri = QUEUE_DB_URI || fallbackMongoUri;

  if (!mongoUri) {
    throw new Error(
      'Missing queue database connection string. Set QUEUE_DB_URI or the active MongoDB URI.',
    );
  }

  return mongoUri;
}

export const agenda = new Agenda({
  db: { 
    address: getAgendaMongoUri(), 
    collection: 'agendaJobs',
  },
  processEvery: '10 seconds',
  maxConcurrency: 20,
  defaultLockLimit: 5,
  defaultLockLifetime: 10000, 
});

// Helper to start Agenda safely
export const startAgenda = async () => {
  logger.info("Starting Agenda...");
  await agenda.start();
  logger.info("Agenda is ready to process jobs.");
};
// Error Monitoring
agenda.on('fail', (err, job) => {
  logger.error(`[QUEUE ERROR] Job <${job.attrs.name}> failed: ${err.message}`, { error: err });
  // Tip: You could send a Slack/Discord notification here in production
});

