import type { FastifyInstance } from 'fastify';
import {
  calendarStatusHandler, calendarSyncHandler, deleteAccountHandler, gmailCallbackHandler,
  gmailConnectHandler, inboxHandler, listAccountsHandler, messageHandler, sendMailHandler,
  tasksStatusHandler, tasksSyncHandler,
  ownEventsHandler, ownTasksHandler,
} from './controller';

export async function registerMailAccountsUser(app: FastifyInstance) {
  app.get('/mail/accounts', listAccountsHandler);
  app.get('/mail/accounts/gmail/connect', gmailConnectHandler);
  app.delete('/mail/accounts/:id', deleteAccountHandler);
  app.get('/mail/accounts/google/tasks/status', tasksStatusHandler);
  app.post('/mail/accounts/google/tasks/sync', tasksSyncHandler);
  app.get('/mail/accounts/google/calendar/status', calendarStatusHandler);
  app.post('/mail/accounts/google/calendar/sync', calendarSyncHandler);
  app.get('/mail/accounts/google/tasks', ownTasksHandler);
  app.get('/mail/accounts/google/calendar', ownEventsHandler);
  app.get('/mail/inbox', inboxHandler);
  app.get('/mail/messages/:id', messageHandler);
  app.post('/mail/send', sendMailHandler);
}

export async function registerMailAccountsPublic(app: FastifyInstance) {
  app.get('/mail/accounts/gmail/callback', gmailCallbackHandler);
}
