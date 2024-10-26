import { CronJob } from 'cron';
import { backup } from './backup.js';
import { env } from './env.js';

console.log('NodeJS Version: ' + process.version);

const tryBackup = async () => {
  try {
    if (env.BACKUP_START_CHECK_IN_URL) {
      console.log('Pinging check-in URL to indicate backup start...');
      await fetch(env.BACKUP_START_CHECK_IN_URL, { method: 'POST' });
    }

    await backup();

    if (env.BACKUP_COMPLETE_CHECK_IN_URL) {
      console.log('Pinging check-in URL to indicate backup completion...');
      await fetch(env.BACKUP_COMPLETE_CHECK_IN_URL, { method: 'POST' });
    }
  } catch (error) {
    console.error('Error while running backup: ', error);
    if (env.BACKUP_ERROR_CHECK_IN_URL) {
      console.log('Pinging check-in URL to indicate backup error...');
      await fetch(env.BACKUP_ERROR_CHECK_IN_URL, { method: 'POST' });
    }
    process.exit(1);
  }
};

if (env.RUN_ON_STARTUP || env.SINGLE_SHOT_MODE) {
  console.log('Running on start backup...');

  await tryBackup();

  if (env.SINGLE_SHOT_MODE) {
    console.log('Database backup complete, exiting...');
    process.exit(0);
  }
}

const job = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {
  await tryBackup();
});

job.start();

console.log('Backup cron scheduled...');
