// src/modules/mail/helpers/index.ts

export {
  getAuthUserEmail,
  resolveTestMailRecipient,
} from "./controller";

export {
  SITE_NAME,
  buildMailTransportSignature,
  buildMailFromAddress,
  createMailTransportConfig,
  escapeMailHtml,
  wrapMailBody,
  sendMailWithTransport,
  welcomeMailSchema,
  passwordChangedSchema,
  depositSuccessMailSchema,
} from "./service";
export type {
  WelcomeMailInput,
  PasswordChangedMailInput,
  DepositSuccessMailInput,
} from "./service";
