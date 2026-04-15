import Agenda from 'agenda';
import { Job } from 'agenda';
import NodeMailerService from '../resources/mail/nodemailer.service';
import logger from '../utils/logger';
// Use the dedicated Queue URI
const mongoUri = process.env.QUEUE_DB_URI || 'mongodb://localhost:27017/venato_queue';

export const agenda = new Agenda({
  db: { 
    address: mongoUri, 
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

