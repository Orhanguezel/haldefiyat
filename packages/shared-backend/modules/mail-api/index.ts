// src/modules/mail/index.ts

export { registerMail } from './router';

export {
  sendMailHandler,
  sendTestMail,
} from './controller';

export {
  getAuthUserEmail,
  resolveTestMailRecipient,
  SITE_NAME,
  buildMailTransportSignature,
  buildMailFromAddress,
  createMailTransportConfig,
  escapeMailHtml,
  wrapMailBody,
  sendMailWithTransport,
  welcomeMailSchema,
  passwordChangedSchema,
} from './helpers';
export type {
  WelcomeMailInput,
  PasswordChangedMailInput,
} from './helpers';

export {
  sendMailRaw,
  sendWelcomeMail,
  sendPasswordChangedMail,
} from './service';

export {
  sendMailSchema,
} from './validation';
export type {
  SendMailInput,
} from './validation';
